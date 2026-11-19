import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication routes:
 * Allows a maximum of 5 failed attempts per 15 minutes per IP address.
 * Successful requests do not consume the quota.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 attempts per windowMs
  skipSuccessfulRequests: true, // Only count failed attempts (4xx/5xx)
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many failed login attempts from this IP. Please try again after 1 minute.',
  },
});
