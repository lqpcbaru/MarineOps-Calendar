import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

/**
 * Dedicated brute-force limiter for POST /api/v1/auth/login. LoginUseCase
 * has no other protection against repeated guessing — no account lockout,
 * no backoff — and the general API rate limit (default 100/min) is far
 * too permissive for a password endpoint on its own. Applied in addition
 * to the general limiter, scoped to this one route.
 */
export function createLoginRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60_000,
    max: parseInt(process.env['LOGIN_RATE_LIMIT_MAX'] || '10', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percubaan log masuk. Sila cuba semula kemudian.',
    },
  });
}
