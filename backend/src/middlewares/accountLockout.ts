/**
 * Account Lockout Middleware
 *
 * Tracks consecutive failed login attempts per email (in-memory store).
 * After MAX_ATTEMPTS failed logins the account is locked for LOCKOUT_DURATION.
 *
 * Works alongside express-rate-limit (which limits by IP).
 * This catches credential-stuffing attacks that rotate IPs.
 */
import { Request, Response, NextFunction } from 'express';

interface LockoutEntry {
  attempts: number;
  lockedUntil: number | null;      // epoch ms, null = not locked
  lastAttempt: number;             // epoch ms
}

const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);
const LOCKOUT_DURATION_MS = parseInt(process.env.LOGIN_LOCKOUT_MINUTES || '15', 10) * 60 * 1000;
const RESET_WINDOW_MS = 15 * 60 * 1000; // reset counter after 15 min of inactivity

// In-memory store – swap for Redis in clustered deployments
const store = new Map<string, LockoutEntry>();

/** Periodic cleanup every 30 minutes. */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastAttempt > RESET_WINDOW_MS * 2) {
      store.delete(key);
    }
  }
}, 30 * 60 * 1000);

/**
 * Middleware that blocks a request if the account (by email) is locked.
 * Mount BEFORE the login controller.
 */
export const checkAccountLock = (req: Request, res: Response, next: NextFunction): void => {
  const email = (req.body?.email || '').toLowerCase().trim();
  if (!email) { next(); return; }

  const entry = store.get(email);
  if (!entry) { next(); return; }

  // Check if lock has expired
  if (entry.lockedUntil) {
    if (Date.now() < entry.lockedUntil) {
      const retryAfterSec = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
      res.status(429).json({
        success: false,
        message: `Account temporarily locked. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
        retryAfter: retryAfterSec,
      });
      return;
    }
    // Lock expired — reset
    store.delete(email);
  }

  next();
};

/**
 * Record a failed login for the given email.
 * If threshold is reached, lock the account.
 */
export const recordFailedLogin = (email: string): void => {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = store.get(key) || { attempts: 0, lockedUntil: null, lastAttempt: now };

  // Reset counter if last attempt was long ago
  if (now - entry.lastAttempt > RESET_WINDOW_MS) {
    entry.attempts = 0;
    entry.lockedUntil = null;
  }

  entry.attempts += 1;
  entry.lastAttempt = now;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  store.set(key, entry);
};

/**
 * Clear the failed-login counter on successful login.
 */
export const clearFailedLogins = (email: string): void => {
  store.delete(email.toLowerCase().trim());
};
