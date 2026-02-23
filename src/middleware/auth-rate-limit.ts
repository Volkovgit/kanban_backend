/**
 * T035: Auth Rate Limiter Middleware
 *
 * Применяет rate limiting к auth endpoints для защиты от brute force атак.
 * 10 запросов в минуту на IP адрес.
 */

import rateLimit from 'express-rate-limit';

/**
 * T035: Rate limiter для auth endpoints
 * - 10 запросов в минуту на IP
 * - Защита от brute force атак на login/register
 */
export const authRateLimiterMiddleware = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // Максимум 10 запросов
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Слишком много запросов с этого IP. Попробуйте позже.',
    },
  },
  standardHeaders: true, // Возвращать заголовки RateLimit-* в response
  legacyHeaders: false, // Отключить устаревшие заголовки X-RateLimit-*
  skipSuccessfulRequests: false, // Считать все запросы, включая успешные
  keyGenerator: (req: any) => {
    // Используем IP адрес как ключ
    return req.ip;
  },
});

export default authRateLimiterMiddleware;
