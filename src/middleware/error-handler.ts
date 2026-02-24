/**
 * Global Error Handling Middleware
 *
 * Catches all errors thrown in the application and returns consistent error responses.
 * This should be registered LAST in the middleware chain.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'class-validator';
import { HttpException } from '@nestjs/common';

/**
 * Formatted validation error for API responses
 */
export interface FormattedValidationError {
  field: string;
  constraints: string[];
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  errors?: ValidationError[] | FormattedValidationError[];
  timestamp: string;
  path: string;
}

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error?: string,
    public errors?: ValidationError[]
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Maps HTTP status codes to standard error codes
 */
const getErrorCode = (status: number, defaultCode: string = 'ERROR'): string => {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };
  return codes[status] || defaultCode;
};

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error caught:', {
      message: err.message,
      name: err.name,
      url: req.url,
      method: req.method,
    });
  }

  // Helper to attach correlation ID
  const sendResponse = (statusCode: number, responseObj: any) => {
    const correlationId = req.headers['x-correlation-id'];
    if (correlationId) {
      responseObj.correlationId = correlationId;
    }
    res.status(statusCode).json(responseObj);
  };

  // Handle NestJS HttpExceptions
  if (err instanceof HttpException) {
    const statusCode = err.getStatus();
    const exceptionResponse = err.getResponse();

    let error = 'Error';
    let message = err.message;
    let errors: any;

    if (typeof exceptionResponse === 'object') {
      error = (exceptionResponse as any).error || error;
      message = (exceptionResponse as any).message || message;
      errors = (exceptionResponse as any).errors;
    }

    const response = {
      success: false,
      error: {
        code: getErrorCode(statusCode, 'ERROR'),
        message,
        ...(errors ? { errors } : {}),
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    sendResponse(statusCode, response);
    return;
  }

  // Handle AppError (our custom errors with business logic)
  if (err instanceof AppError) {
    const response = {
      success: false,
      error: {
        code: err.error || getErrorCode(err.statusCode, 'ERROR'),
        message: err.message,
        ...(err.errors ? { errors: err.errors } : {}),
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    sendResponse(err.statusCode, response);
    return;
  }

  // Handle TypeORM unique constraint violations
  if (err.name === 'QueryFailedError') {
    const postgresError = err as any;
    // Check for unique violation (code '23505')
    if (postgresError.code === '23505') {
      const response = {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
        },
        timestamp: new Date().toISOString(),
        path: req.url,
      };
      sendResponse(409, response);
      return;
    }
    // Check for foreign key violation (code '23503')
    if (postgresError.code === '23503') {
      const response = {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Referenced resource does not exist',
        },
        timestamp: new Date().toISOString(),
        path: req.url,
      };
      sendResponse(400, response);
      return;
    }
    // Generic database error
    const response = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'Database error occurred'
          : 'Database query failed',
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    sendResponse(500, response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    sendResponse(401, response);
    return;
  }

  // Handle JWT expired errors
  if (err.name === 'TokenExpiredError') {
    const response = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token has expired',
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    sendResponse(401, response);
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const response = {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    sendResponse(400, response);
    return;
  }

  // Default error handler (generic server error)
  const response = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message || 'Unknown error occurred',
    },
    timestamp: new Date().toISOString(),
    path: req.url,
  };

  sendResponse(500, response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: wrapAsync(async (req, res, next) => { ... })
 */
export function wrapAsync(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
