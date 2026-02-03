// Global rate limiter to prevent Supabase auth rate limiting during development
let lastRateLimitTime = 0;
const RATE_LIMIT_COOLDOWN = 120000; // 2 minutes after a 429 (helps local dev)
const AUTH_CALL_THROTTLE = 15000;   // Max one getUser() per 15 seconds app-wide
let lastAuthCallTime = 0;

export function isRateLimited(): boolean {
  const now = Date.now();
  if (now - lastRateLimitTime < RATE_LIMIT_COOLDOWN) {
    return true;
  }
  return false;
}

export function setRateLimited(): void {
  lastRateLimitTime = Date.now();
  console.warn(`🚦 Supabase rate limited - pausing auth calls for ${RATE_LIMIT_COOLDOWN / 1000} seconds`);
}

export function getRemainingCooldown(): number {
  const now = Date.now();
  const remaining = Math.max(0, RATE_LIMIT_COOLDOWN - (now - lastRateLimitTime));
  return Math.ceil(remaining / 1000);
}

/** Returns true if we should skip auth call (throttle). Call recordAuthCall() after a successful getUser(). */
export function shouldThrottleAuthCall(): boolean {
  const now = Date.now();
  return now - lastAuthCallTime < AUTH_CALL_THROTTLE;
}

export function recordAuthCall(): void {
  lastAuthCallTime = Date.now();
}