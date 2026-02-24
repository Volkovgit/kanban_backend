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

  // Handle NestJS HttpExceptions
  if (err instanceof HttpException) {
    const statusCode = err.getStatus();
    const exceptionResponse = err.getResponse();

    let error = 'Error';
    let message = err.message;
    let errors: any;

    // Если ответ в формате { message, error, ... }
    if (typeof exceptionResponse === 'object') {
      error = (exceptionResponse as any).error || error;
      message = (exceptionResponse as any).message || message;
      errors = (exceptionResponse as any).errors;
    }

    const response = {
      success: false,
      error: {
        code: statusCode === 401 ? 'UNAUTHORIZED' :
              statusCode === 409 ? 'CONFLICT' :
              statusCode === 403 ? 'FORBIDDEN' :
              statusCode === 404 ? 'NOT_FOUND' :
              statusCode === 400 ? 'BAD_REQUEST' : 'ERROR',
        message,
        ...(errors ? { errors } : {}),
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    res.status(statusCode).json(response);
    return;
  }

  // Handle AppError (our custom errors with business logic)
  if (err instanceof AppError) {
    const response = {
      success: false,
      error: {
        code: err.error || 'ERROR',
        message: err.message,
        ...(err.errors ? { errors: err.errors } : {}),
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    res.status(err.statusCode).json(response);
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
      res.status(409).json(response);
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
      res.status(400).json(response);
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
    res.status(500).json(response);
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
    res.status(401).json(response);
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
    res.status(401).json(response);
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
    res.status(400).json(response);
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

  res.status(500).json(response);
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
