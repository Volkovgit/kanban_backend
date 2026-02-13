/**
 * Winston Logger Configuration
 *
 * Provides structured logging with different levels and transports.
 * Logs to console with color-coded output and timestamps.
 */

import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  return `${timestamp as string} [${level}]: ${message} ${
    Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : ''
  }`;
});

/**
 * Logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize({ all: true }),
    logFormat
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      stderrLevels: ['error', 'warn'],
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

/**
 * Create a child logger for specific contexts (e.g., specific modules)
 */
export function createModuleLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}

export default logger;
