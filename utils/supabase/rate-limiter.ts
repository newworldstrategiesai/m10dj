// Global rate limiter to prevent Supabase auth rate limiting during development
let lastRateLimitTime = 0;
const RATE_LIMIT_COOLDOWN = 30000; // 30 seconds cooldown after rate limit

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