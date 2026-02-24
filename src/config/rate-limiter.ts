/**
 * Rate Limiter Configuration
 *
 * Provides rate limiting middleware for different endpoint types:
 * - Auth endpoints: 10 requests/minute per IP
 * - API endpoints: 100 requests/minute per user
 */

import rateLimit, { MemoryStore } from 'express-rate-limit';
import { Request } from 'express';
import '../middleware/authenticate'; // ensure Express.Request has user property for authentication endpoints

/**
 * Rate limiter for authentication endpoints
 * Stricter limit to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  store: new MemoryStore(),
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
  // Не указываем keyGenerator - используем стандартный который правильно обрабатывает IPv6
});

/**
 * Rate limiter for general API endpoints
 * Higher limit for authenticated users
 */
export const apiRateLimiter = rateLimit({
  store: new MemoryStore(),
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
  // Отключаем rate limiting в тестовой среде
  skip: () => process.env.NODE_ENV === 'test',
  // Ключом будет пользовательский ID из req.user.id (если аутентифицирован)
  // или IP адрес (если не аутентифицирован)
  keyGenerator: (req: Request) => {
    // Для authenticated пользователей используем ID, иначе IP
    if (req.user?.id) {
      return req.user.id;
    }
    // Используем req.ip который express    // Fallback to IP address if available, otherwise a default string
    return req.ip || req.connection?.remoteAddress || 'unknown';
  },
});

export default {
  authRateLimiter,
  apiRateLimiter,
};
