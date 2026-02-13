/**
 * Global Error Handling Middleware
 *
 * Catches all errors thrown in the application and returns consistent error responses.
 * This should be registered LAST in the middleware chain.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'class-validator';

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

  // Handle AppError (our custom errors with business logic)
  if (err instanceof AppError) {
    const response = {
      statusCode: err.statusCode,
      message: err.message,
      error: err.error,
      errors: err.errors,
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
      const response: ErrorResponse = {
        statusCode: 409,
        message: 'Resource already exists',
        error: 'Conflict',
        timestamp: new Date().toISOString(),
        path: req.url,
      };
      res.status(409).json(response);
      return;
    }
    // Check for foreign key violation (code '23503')
    if (postgresError.code === '23503') {
      const response: ErrorResponse = {
        statusCode: 400,
        message: 'Referenced resource does not exist',
        error: 'BadRequest',
        timestamp: new Date().toISOString(),
        path: req.url,
      };
      res.status(400).json(response);
      return;
    }
    // Generic database error
    const response: ErrorResponse = {
      statusCode: 500,
      message: process.env.NODE_ENV === 'production'
        ? 'Database error occurred'
        : 'Database query failed',
      error: process.env.NODE_ENV === 'development' ? 'DatabaseError' : undefined,
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    res.status(500).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response: ErrorResponse = {
      statusCode: 401,
      message: 'Invalid token',
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    res.status(401).json(response);
    return;
  }

  // Handle JWT expired errors
  if (err.name === 'TokenExpiredError') {
    const response: ErrorResponse = {
      statusCode: 401,
      message: 'Token has expired',
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    res.status(401).json(response);
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const response: ErrorResponse = {
      statusCode: 400,
      message: 'Validation failed',
      error: 'BadRequest',
      timestamp: new Date().toISOString(),
      path: req.url,
    };
    res.status(400).json(response);
    return;
  }

  // Default error handler (generic server error)
  const response: ErrorResponse = {
    statusCode: 500,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'Unknown error occurred',
    error: process.env.NODE_ENV === 'development' ? 'InternalServerError' : undefined,
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
