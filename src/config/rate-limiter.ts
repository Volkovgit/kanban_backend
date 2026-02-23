/**
 * Rate Limiter Configuration
 *
 * Provides rate limiting middleware for different endpoint types:
 * - Auth endpoints: 10 requests/minute per IP
 * - API endpoints: 100 requests/minute per user
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Stricter limit to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // Максимум 10 запросов
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    statusCode: 429,
  },
  standardHeaders: true, // Возвращать заголовки RateLimit-* в response
  legacyHeaders: false, // Отключить устаревшие заголовки X-RateLimit-*
  skipSuccessfulRequests: false, // Считать все запросы, включая успешные
});

/**
 * Rate limiter for general API endpoints
 * Higher limit for authenticated users
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 100, // Максимум 100 запросов
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Ключом будет пользовательский ID из req.user.id (если аутентифицирован)
  // или IP адрес (если не аутентифицирован)
  keyGenerator: (req: any) => {
    return req.user?.id || req.ip;
  },
});

export default {
  authRateLimiter,
  apiRateLimiter,
};
