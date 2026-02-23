/**
 * Winston Logger Configuration
 *
 * Provides structured logging with different levels and transports.
 * Supports correlation ID for request tracing across the application.
 */

import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, printf, colorize, json } = format;

// Custom log format for development
const devLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const correlationId = metadata.correlationId ? `[${metadata.correlationId}]` : '';
  const metaStr = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
  return `${timestamp as string} [${level}]${correlationId}: ${message} ${metaStr}`;
});

/**
 * Logger instance with correlation ID support
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Use different formats based on environment
    process.env.NODE_ENV === 'production' ? json() : combine(colorize({ all: true }), devLogFormat)
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
 * @param moduleName - Name of the module for context
 * @param correlationId - Optional correlation ID for request tracing
 */
export function createModuleLogger(moduleName: string, correlationId?: string) {
  const metadata: any = { module: moduleName };
  if (correlationId) {
    metadata.correlationId = correlationId;
  }
  return logger.child(metadata);
}

/**
 * Create a logger with correlation ID for request tracing
 * @param correlationId - Unique identifier for the request
 */
export function createRequestLogger(correlationId: string) {
  return logger.child({ correlationId });
}

export default logger;
