import mongoose from 'mongoose';
import { env } from './env';

/**
 * Central MongoDB connection manager.
 *
 * This is the ONLY place in the application that calls `mongoose.connect()`.
 * Every controller, middleware and route must go through `connectDB()` so the
 * process keeps exactly one MongoDB connection (Mongoose pools sockets
 * internally) and never opens a new connection per request.
 *
 * Failure behaviour is deliberately conservative:
 *   - while a connection attempt is in-flight, all callers await the SAME
 *     promise (no concurrent/duplicate attempts);
 *   - after a failure the manager enters a cooldown window and immediately
 *     rejects further calls instead of hammering the server (no retry storm
 *     and no repeated `[DB] Connecting...` log spam);
 *   - once the cooldown expires the next call performs a single fresh attempt.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null };
global.mongooseCache = cached;

const DB_UNAVAILABLE_MESSAGE =
  'Database service temporarily unavailable. Please try again later.';
const NOT_CONFIGURED_MESSAGE =
  'MONGODB_URI is not configured. Set backend/.env MONGODB_URI to your real MongoDB Atlas connection string.';

const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 60_000;

let inFlight: Promise<typeof mongoose> | null = null;
let retryAt = 0;
let failureCount = 0;

const CONNECT_OPTS: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 8_000,
  connectTimeoutMS: 12_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10,
  minPoolSize: 0,
  bufferCommands: false,
  retryWrites: true,
  retryReads: true,
};

export function getMongoUri(): string {
  return (process.env.MONGODB_URI || '').trim() || (env.mongodbUri || '').trim();
}

/**
 * True only when a plausible, non-placeholder MongoDB URI is present.
 * Rejects the `<user>` / `cluster0.xxxxx.mongodb.net` templates shipped in
 * `.env.example` so a forgotten placeholder never triggers a connection storm.
 */
export function isMongoUriConfigured(): boolean {
  const uri = getMongoUri();
  if (!/^mongodb(\+srv)?:\/\/.+/i.test(uri)) return false;
  if (uri.includes('<') || uri.includes('>')) return false;
  if (/xxxxx/i.test(uri)) return false;
  if (/cluster\.mongodb\.net/i.test(uri)) return false;
  return true;
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getDbStatus(): 'connected' | 'connecting' | 'unavailable' {
  if (mongoose.connection.readyState === 1) return 'connected';
  if (mongoose.connection.readyState === 2 || inFlight) return 'connecting';
  return 'unavailable';
}

/** Build a secret-free, human-readable error from a raw driver error. */
function sanitizeDbError(err: unknown): Error {
  const raw = String((err as { message?: string })?.message || err || '');
  let reason = 'connection error';
  if (/not configured|MONGODB_URI/i.test(raw)) reason = 'configuration error';
  else if (/querySrv|ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(raw)) reason = 'DNS/host lookup failed';
  else if (/authentication|bad auth|auth failed|Authentication failed/i.test(raw)) reason = 'authentication failed';
  else if (/ECONNREFUSED|refused/i.test(raw)) reason = 'server refused the connection';
  else if (/ETIMEDOUT|timed? ?out|ServerSelection/i.test(raw)) reason = 'server selection timed out';

  const safe = new Error(`MongoDB connection failed: ${reason}`);
  (safe as { isDbConnectionError?: boolean }).isDbConnectionError = true;
  (safe as { cause?: unknown }).cause = undefined;
  return safe;
}

/**
 * Classify an error as a database-connection failure. Used by the error
 * middleware and controllers to return 503 instead of leaking driver details.
 */
export function isDbConnectionError(err: unknown): boolean {
  if (!err) return false;
  if ((err as { isDbConnectionError?: boolean }).isDbConnectionError) return true;
  const name = (err as { name?: string }).name || '';
  const message = (err as { message?: string }).message || '';
  if (name === 'MongooseServerSelectionError' || name === 'MongoServerSelectionError') return true;
  if (
    message.includes('MONGODB_URI is not configured') ||
    message.includes('querySrv') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('Connection timeout') ||
    message.includes('bad auth') ||
    message.includes('Authentication failed') ||
    message.includes('buffering timed out') ||
    message.startsWith('MongoDB connection failed')
  ) {
    return true;
  }
  return false;
}

function unavailableError(): Error {
  const err = new Error(DB_UNAVAILABLE_MESSAGE);
  (err as { isDbConnectionError?: boolean }).isDbConnectionError = true;
  return err;
}

/**
 * Verify a cached connection is actually usable by issuing a ping.
 *
 * `readyState === 1` only means the socket was open at some point. On
 * serverless platforms (and after Atlas idle timeouts) a warm container can
 * hold a cached connection whose socket is already dead, so a fast ping is
 * the only reliable liveness signal. The result is cached briefly to avoid
 * paying the round-trip on every single request.
 */
let lastAliveCheck = 0;
const ALIVE_CHECK_TTL_MS = 3_000;

async function isConnectionAlive(): Promise<boolean> {
  const now = Date.now();
  if (now - lastAliveCheck < ALIVE_CHECK_TTL_MS) return true;
  try {
    const db = mongoose.connection.db;
    if (!db || mongoose.connection.readyState !== 1) return false;
    await db.admin().ping();
    lastAliveCheck = now;
    return true;
  } catch {
    return false;
  }
}

/**
 * Connect to MongoDB using the validated `MONGODB_URI`.
 *
 * Safe to call on every request: returns the live connection when connected,
 * the shared in-flight promise while connecting, and a fast 503-style
 * rejection during the cooldown after a failure.
 */
export function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return isConnectionAlive().then((alive) => {
      if (alive) {
        cached.conn = mongoose;
        return mongoose;
      }
      // Cached connection is stale (dead socket) — tear it down and reconnect.
      console.warn('[DB] Cached connection is stale; reconnecting...');
      cached.conn = null;
      return mongoose.disconnect().catch(() => {}).then(() => connectDB());
    });
  }

  if (inFlight) return inFlight;

  // Mongo may be reconnecting internally (e.g. after a dropped socket).
  if (mongoose.connection.readyState === 2) {
    return mongoose.connection
      .asPromise()
      .then(() => {
        cached.conn = mongoose;
        return mongoose;
      })
      .catch((err) => {
        throw sanitizeDbError(err);
      });
  }

  const now = Date.now();
  if (now < retryAt) {
    return Promise.reject(unavailableError());
  }

  const uri = getMongoUri();
  if (!isMongoUriConfigured()) {
    console.error(`[DB] ${NOT_CONFIGURED_MESSAGE}`);
    // Long cooldown: a missing config must never cause repeated attempts.
    retryAt = now + RETRY_MAX_MS;
    const err = new Error(NOT_CONFIGURED_MESSAGE);
    (err as { isDbConnectionError?: boolean }).isDbConnectionError = true;
    return Promise.reject(err);
  }

  console.log('[DB] Connecting to MongoDB Atlas...');

  inFlight = mongoose
    .connect(uri, CONNECT_OPTS)
    .then((m) => {
      failureCount = 0;
      retryAt = 0;
      cached.conn = m;
      console.log('[DB] Connected successfully');
      return m;
    })
    .catch((err) => {
      failureCount += 1;
      const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** Math.min(failureCount - 1, 4));
      retryAt = Date.now() + delay;
      const safe = sanitizeDbError(err);
      console.error(`[DB] ${safe.message} (next attempt in ${Math.round(delay / 1000)}s)`);
      cached.conn = null;
      throw safe;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
