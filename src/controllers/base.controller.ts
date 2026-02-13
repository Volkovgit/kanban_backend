/**
 * Base Controller Class
 *
 * Provides common functionality for all controllers including
 * standardized response formatting, error handling, and HTTP utilities.
 */

import { Request, Response } from 'express';
import { AppError, ErrorResponse } from '../middleware/error-handler';

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

/**
 * Pagination response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Base controller with common methods for all controllers
 */
export abstract class BaseController {
  /**
   * Send a success response
   */
  protected success<T>(res: Response, data: T, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  /**
   * Send a success response with no content
   */
  protected noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Send an error response
   */
  protected error(res: Response, statusCode: number, message: string, error?: string): Response {
    const response: ErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: res.req?.url || '',
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send a paginated response
   */
  protected paginated<T>(
    res: Response,
    data: T[],
    page: number,
    pageSize: number,
    totalCount: number
  ): Response {
    const totalPages = Math.ceil(totalCount / pageSize);

    const response: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };

    // Add pagination headers
    res.setHeader('X-Total-Count', totalCount.toString());
    res.setHeader('X-Page-Size', pageSize.toString());
    res.setHeader('X-Current-Page', page.toString());
    res.setHeader('X-Total-Pages', totalPages.toString());

    return res.status(200).json({
      success: true,
      ...response,
    });
  }

  /**
   * Parse and validate pagination parameters from request query
   */
  protected getPaginationParams(req: Request): PaginationParams {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string) || 10)
    );
    const skip = (page - 1) * pageSize;

    return { page, pageSize, skip };
  }

  /**
   * Extract user ID from request (from JWT token)
   * @throws AppError if user is not authenticated
   */
  protected getUserId(req: Request): string {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized', 'Unauthorized');
    }

    return userId;
  }

  /**
   * Check if user owns the resource
   * @throws AppError if user doesn't own the resource
   */
  protected checkOwnership(resourceOwnerId: string, currentUserId: string): void {
    if (resourceOwnerId !== currentUserId) {
      throw new AppError(403, 'Forbidden', 'You do not have permission to access this resource');
    }
  }

  /**
   * Validate required fields in request body
   * @throws AppError if required fields are missing
   */
  protected validateRequired(body: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      throw new AppError(
        400,
        `Missing required fields: ${missingFields.join(', ')}`,
        'ValidationError'
      );
    }
  }

  /**
   * Validate UUID format
   * @throws AppError if UUID is invalid
   */
  protected validateUuid(uuid: string, fieldName: string = 'ID'): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(uuid)) {
      throw new AppError(400, `Invalid ${fieldName} format`, 'ValidationError');
    }
  }
}

export default BaseController;
