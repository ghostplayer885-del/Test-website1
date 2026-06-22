/*
  CODE_RABBIT_REVIEW: Rate limiter notes
  - This is an in-memory rate limiter intended for simple deployments and tests.
  - In production consider a distributed persistent store (Redis) to avoid bypass via multiple instances.
  - Review values for `WINDOW_MS` and `MAX_ATTEMPTS` to match your threat model.
*/
/**
 * Simple in-memory rate limiter for admin login attempts
 * Tracks failed login attempts per IP address
 */

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5; // Max 5 attempts per minute

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    // First attempt
    rateLimitMap.set(identifier, {
      attempts: 1,
      resetTime: now + WINDOW_MS,
    });
    return true;
  }

  // Check if window has expired
  if (now > entry.resetTime) {
    // Reset window
    rateLimitMap.set(identifier, {
      attempts: 1,
      resetTime: now + WINDOW_MS,
    });
    return true;
  }

  // Check if under limit
  if (entry.attempts < MAX_ATTEMPTS) {
    entry.attempts++;
    return true;
  }

  // Over limit
  return false;
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    rateLimitMap.set(identifier, {
      attempts: 1,
      resetTime: now + WINDOW_MS,
    });
  } else if (now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      attempts: 1,
      resetTime: now + WINDOW_MS,
    });
  } else {
    entry.attempts++;
  }
}

export function getRemainingAttempts(identifier: string): number {
  const entry = rateLimitMap.get(identifier);
  if (!entry) return MAX_ATTEMPTS;

  const now = Date.now();
  if (now > entry.resetTime) return MAX_ATTEMPTS;

  return Math.max(0, MAX_ATTEMPTS - entry.attempts);
}

export function getResetTime(identifier: string): number {
  const entry = rateLimitMap.get(identifier);
  if (!entry) return 0;
  return entry.resetTime;
}
