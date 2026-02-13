/**
 * Request Logging Middleware
 *
 * Logs incoming HTTP requests using Winston logger.
 * Tracks method, URL, status code, and response time.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Extend Express Request type to track start time
 */
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

/**
 * Request logging middleware
 * Logs each request with method, URL, status code, and response time
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Record start time for response time calculation
  req.startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    logger.log(logLevel, 'Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
  });

  next();
}

/**
 * Create a simpler request logger for development
 * Only logs method and URL without response tracking
 */
export function simpleRequestLogger(req: Request, _res: Response, next: NextFunction): void {
  logger.info(`${req.method} ${req.url}`);
  next();
}

export default requestLogger;
