/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per time window
 */
import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '@retail-brain/config';

export const rateLimitMiddleware = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  message: {
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Use IP address as key
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  // Skip rate limiting for health checks
  skip: (req) => {
    return req.path === '/health' || req.path === '/v1/health';
  },
});

