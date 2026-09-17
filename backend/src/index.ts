import { createApp } from './app';
import { connectDB, getDbStatus, isMongoUriConfigured } from './config/db';
import { env } from './config/env';
import { ensureAdminSeeded } from './utils/seedAdmin';

const app = createApp();

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
