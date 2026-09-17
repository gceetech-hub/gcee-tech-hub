import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Admin } from '../models/Admin';
import { env } from '../config/env';

/**
 * Ensure the intended active Admin account exists in the database.
 *
 * Safety guarantees:
 *   - only runs when the connection is fully established
 *     (`readyState === 1`), so it can never trip the
 *     "before initial connection is complete" error;
 *   - idempotent and race-safe: uses an atomic `updateOne` upsert keyed on the
 *     unique email, so concurrent calls cannot create duplicates;
 *   - a module-level mutex prevents overlapping runs;
 *   - existing admin records are never deleted — a disabled account is simply
 *     re-activated.
 */
let seeding: Promise<void> | null = null;

async function doEnsureAdminSeeded(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[seedAdmin] Skipped: MongoDB is not connected yet.');
    return;
  }

  const email = (env.adminEmail || '').toLowerCase().trim();
  if (!email) return;

  const existing = await Admin.findOne({ email }).select('_id isActive').lean();
  if (existing) {
    if (existing.isActive === false) {
      await Admin.updateOne({ _id: existing._id }, { $set: { isActive: true } });
      console.log(`[seedAdmin] Re-activated admin account: ${email}`);
    }
    return;
  }

  const password = env.adminPassword || '';
  if (!password) {
    console.warn('[seedAdmin] ADMIN_PASSWORD is not set; skipping admin creation.');
    return;
  }

  const name = env.adminName || 'GCEE Tech Hub Admin';
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await Admin.updateOne(
      { email },
      {
        $setOnInsert: {
          name,
          email,
          passwordHash,
          role: 'superadmin',
          isActive: true,
        },
      },
      { upsert: true }
    );
    console.log(`[seedAdmin] Admin account ensured: ${email}`);
  } catch (err: any) {
    // A concurrent insert already created the account — nothing to do.
    if (err?.code === 11000) return;
    throw err;
  }
}

export function ensureAdminSeeded(): Promise<void> {
  if (!seeding) {
    seeding = doEnsureAdminSeeded()
      .catch((err: any) => {
        console.error('[seedAdmin] Failed to ensure admin seeded:', err?.message || err);
      })
      .finally(() => {
        seeding = null;
      });
  }
  return seeding;
}
