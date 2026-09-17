import { createApp } from './app';
import { connectDB, getDbStatus, isMongoUriConfigured } from './config/db';
import { env } from './config/env';
import { ensureAdminSeeded } from './utils/seedAdmin';
import { isGmailConfigured, verifyGmailConnection, isEmailServiceAvailable, describeEmailConfig } from './services/emailService';

const app = createApp();

/**
 * Validate email configuration at startup and print a CLEAR message naming only
 * the missing variable(s) — never their values, so secrets never leak to logs.
 * When Gmail SMTP is configured, run a safe connection/auth check async.
 */
function validateEmailConfig(): void {
  const provider = (process.env.EMAIL_PROVIDER || 'auto').trim().toLowerCase() || 'auto';
  const gmailConfigured = isGmailConfigured();
  const available = isEmailServiceAvailable();

  // `env.gmail.user` falls back to SITE_EMAIL, so only flag GMAIL_USER when an
  // app password exists but the sender account was never set explicitly.
  if (env.gmail.appPassword && !(process.env.GMAIL_USER || '').trim()) {
    console.warn(
      '[Server] GMAIL_APP_PASSWORD is set but GMAIL_USER is not - set GMAIL_USER to the ' +
        'same Google account that owns the app password.'
    );
  }

  if (!available) {
    console.warn(
      '[Server] Email service is NOT configured - set GMAIL_APP_PASSWORD (Gmail App Password) ' +
        'or RESEND_API_KEY + RESEND_FROM_EMAIL in backend/.env. ' +
        'OTP, registration and announcement emails will fail until then.'
    );
  } else {
    console.log(`[Server] Email service ready: ${describeEmailConfig()}.`);
  }

  if (provider === 'resend') {
    if (!env.resendApiKey) {
      console.warn('[Server] EMAIL_PROVIDER=resend is set but RESEND_API_KEY is missing.');
    }
    return;
  }

  if (gmailConfigured) {
    // Non-blocking, safe authentication/connection check (no credentials logged).
    verifyGmailConnection().then((res) => {
      if (res.ok) console.log('[Server] Gmail SMTP connection & authentication verified.');
      else console.warn('[Server] Gmail SMTP configuration check failed:', res.error);
    });
  }
}

async function bootstrap(): Promise<void> {
  // 1. Validate configuration before touching the database.
  if (!isMongoUriConfigured()) {
    console.error(
      '[Server] MONGODB_URI is missing or still set to a placeholder. ' +
        'Set backend/.env MONGODB_URI to your MongoDB connection string.'
    );
  } else {
    // 2. Connect (single attempt, cached) and 3. seed the admin, in order.
    try {
      await connectDB();
      await ensureAdminSeeded();
    } catch (err) {
      console.error('[Server] Database unavailable at startup:', (err as Error).message);
      console.error('[Server] API will start in degraded mode and return 503 until MongoDB is reachable.');
    }
  }

  // 4. Only now start serving HTTP requests.
  // Validate email configuration (clear startup log, safe — never prints secrets).
  validateEmailConfig();

  const server = app.listen(env.port, () => {
    console.log(`[Server] API listening on http://localhost:${env.port}`);
    console.log(`[Server] Database status: ${getDbStatus()}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${env.port} is already in use by another process.`);
      console.error(`[Server] To free port ${env.port}, run: fuser -k ${env.port}/tcp`);
      process.exit(1);
    } else {
      console.error('[Server] Server error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();

export default app;
