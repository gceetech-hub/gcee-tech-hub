import type { Response } from 'express';
import { isDbConnectionError } from '../config/db';

const DB_UNAVAILABLE = 'Database service temporarily unavailable.';
const SERVER_ERROR = 'Something went wrong. Please try again.';

/**
 * Send a safe, user-facing error response.
 *
 * Never leaks driver messages, stack traces, connection strings or env values.
 * Database-connection failures are reported as 503; everything else as a
 * generic 500 (unless the response already started).
 */
export function sendSafeError(res: Response, err: unknown, fallback: string = SERVER_ERROR): void {
  if (res.headersSent) return;
  if (isDbConnectionError(err)) {
    res.status(503).json({ success: false, message: DB_UNAVAILABLE });
    return;
  }
  res.status(500).json({ success: false, message: fallback });
}
