/**
 * Winston Logger Configuration
 *
 * Provides structured logging with different levels and transports.
 * Supports correlation ID for request tracing across the application.
 */

import winston from 'winston';
import { format } from 'winston';

const { combine, timestamp, printf, colorize, json } = format;

// Format to redact sensitive information
const redactSensitive = format((info) => {
  const sanitize = (obj: Record<string, unknown>): Record<string, unknown> => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj))
      return obj.map((item) =>
        sanitize(item as Record<string, unknown>)
      ) as unknown as Record<string, unknown>;

    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token')
      ) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = sanitize(obj[key] as Record<string, unknown>);
      }
    }
    return result;
  };

  // Redact properties in the info object
  for (const key of Object.keys(info)) {
    if (key === 'level' || key === 'message' || typeof key === 'symbol')
      continue;
    if (
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('token')
    ) {
      info[key] = '[REDACTED]';
    } else if (typeof info[key] === 'object' && info[key] !== null) {
      info[key] = sanitize(info[key] as Record<string, unknown>);
    }
  }
  return info;
});

// Custom log format for development
const devLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const correlationId = metadata.correlationId
    ? `[${metadata.correlationId}]`
    : '';
  const metaStr =
    Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : '';
  return `${timestamp as string} [${level}]${correlationId}: ${message} ${metaStr}`;
});

/**
 * Logger instance with correlation ID support
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    process.env.NODE_ENV === 'production'
      ? redactSensitive()
      : redactSensitive(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Use different formats based on environment
    process.env.NODE_ENV === 'production'
      ? json()
      : combine(colorize({ all: true }), devLogFormat)
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
  const metadata: Record<string, unknown> = { module: moduleName };
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
