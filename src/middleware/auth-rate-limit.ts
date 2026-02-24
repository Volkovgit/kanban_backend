/**
 * T035: Auth Rate Limiter Middleware
 *
 * Применяет rate limiting к auth endpoints для защиты от brute force атак.
 * 10 запросов в минуту на IP адрес.
 * Отключён в тестовой среде для корректного прохождения тестов.
 */

import rateLimit, { MemoryStore } from 'express-rate-limit';

/**
 * T035: Rate limiter для auth endpoints
 * - 10 запросов в минуту на IP
 * - Защита от brute force атак на login/register
 */
export const authRateLimiterMiddleware = rateLimit({
  store: new MemoryStore(),
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
  // Не указываем keyGenerator - используем стандартный который правильно обрабатывает IPv6
  // Отключаем rate limiting в тестовой среде
  skip: () => process.env.NODE_ENV === 'test',
});

export default authRateLimiterMiddleware;
