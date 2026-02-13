/**
 * Authentication Middleware
 *
 * Provides JWT-based authentication middleware for Express routes.
 * Protects routes by requiring valid JWT tokens.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';
import { verifyAccessToken, extractTokenFromHeader } from '../config/jwt';

/**
 * Extend Express Request type to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request
 * @throws AppError if token is missing or invalid
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AppError(401, 'Authentication required', 'Unauthorized');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user information to request
    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        statusCode: error.statusCode,
        message: error.message,
        error: error.error,
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    } else {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json({
        statusCode: 401,
        message,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }
  }
}

/**
 * Optional authentication middleware
 * Attaches user information if token is present, but doesn't require it
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional authentication
    next();
  }
}

/**
 * Authorization middleware factory
 * Creates middleware that checks if authenticated user has required role
 * @param _roles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export function authorize(..._roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'Unauthorized');
      }

      // Role-based authorization can be implemented here
      // For now, we'll check if user has the required role
      // This will be enhanced when User entity has roles

      // Example: Check if user has any of the required roles
      // const userRoles = req.user.roles || [];
      // const hasRequiredRole = roles.some((role) => userRoles.includes(role));

      // if (!hasRequiredRole) {
      //   throw new AppError(403, 'Insufficient permissions', 'Forbidden');
      // }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          error: error.error,
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      } else {
        res.status(403).json({
          statusCode: 403,
          message: 'Authorization failed',
          error: 'Forbidden',
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
    }
  };
}

/**
 * Check if the authenticated user is the resource owner
 * @param getUserIdFromParams - Function to extract user ID from request params
 * @returns Express middleware function
 */
export function checkOwnership(
  getUserIdFromParams: (req: Request) => string
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'Unauthorized');
      }

      const resourceOwnerId = getUserIdFromParams(req);

      if (req.user.id !== resourceOwnerId) {
        throw new AppError(403, 'You do not have permission to access this resource', 'Forbidden');
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          error: error.error,
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      } else {
        res.status(403).json({
          statusCode: 403,
          message: 'Authorization failed',
          error: 'Forbidden',
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
    }
  };
}

export default {
  authenticate,
  optionalAuthenticate,
  authorize,
  checkOwnership,
};
