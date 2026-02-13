/**
 * Project Ownership Middleware
 *
 * Middleware to verify that the authenticated user owns a project.
 * Can be used to protect routes that require project ownership.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';
import { ProjectService } from '../services/project.service';
import { Project } from '../models/project.entity';

/**
 * Extend Express Request type to include validated project
 */
declare global {
  namespace Express {
    interface Request {
      project?: Project;
    }
  }
}

/**
 * Project ownership validation middleware factory
 * Creates middleware that checks if the authenticated user owns the project
 * specified in the request params.
 *
 * The project ID is extracted from the request params using the provided paramKey.
 * If ownership is validated, the project is attached to req.project for use in
 * subsequent middleware or route handlers.
 *
 * @param projectService - ProjectService instance for validation
 * @param paramKey - The key in req.params that contains the project ID (default: 'id')
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get(
 *   '/projects/:id/tasks',
 *   authenticate,
 *   validateProjectOwnership(projectService, 'id'),
 *   wrapAsync(async (req, res) => {
 *     // req.project is available here, pre-validated
 *     const project = req.project!;
 *     // ... use project
 *   })
 * );
 * ```
 */
export function validateProjectOwnership(
  projectService: ProjectService,
  paramKey: string = 'id'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'Unauthorized');
      }

      // Extract project ID from request params
      const projectId = req.params[paramKey];

      if (!projectId) {
        throw new AppError(400, `Project ID parameter '${paramKey}' is required`, 'BadRequest');
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(projectId)) {
        throw new AppError(400, 'Invalid project ID format', 'BadRequest');
      }

      // Verify ownership using ProjectService
      const project = await projectService.getProjectWithOwnership(
        projectId,
        req.user.id
      );

      // Attach validated project to request for use in subsequent handlers
      req.project = project;

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
        const message = error instanceof Error ? error.message : 'Project ownership validation failed';
        res.status(403).json({
          statusCode: 403,
          message,
          error: 'Forbidden',
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
    }
  };
}

/**
 * Optional project ownership middleware
 * Attaches the project to req.project if it exists and user owns it,
 * but doesn't block the request if ownership validation fails.
 * Useful for routes where project access is optional.
 *
 * @param projectService - ProjectService instance for validation
 * @param paramKey - The key in req.params that contains the project ID (default: 'id')
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.get(
 *   '/search',
 *   authenticate,
 * optionalProjectOwnership(projectService, 'projectId'),
 *   wrapAsync(async (req, res) => {
 *     // req.project may be available if ownership was validated
 *     const project = req.project; // Project | undefined
 *     // ... handle both cases
 *   })
 * );
 * ```
 */
export function optionalProjectOwnership(
  projectService: ProjectService,
  paramKey: string = 'id'
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next();
        return;
      }

      const projectId = req.params[paramKey];

      if (!projectId) {
        next();
        return;
      }

      // Try to validate ownership, but don't block on failure
      const project = await projectService.getProjectWithOwnership(
        projectId,
        req.user.id
      ).catch(() => null);

      if (project) {
        req.project = project;
      }

      next();
    } catch {
      // Ignore all errors for optional validation
      next();
    }
  };
}

/**
 * Check if the authenticated user owns any of the specified projects
 * Useful for batch operations on multiple projects
 *
 * @param projectService - ProjectService instance for validation
 * @param paramKey - The key in req.params that contains comma-separated project IDs (default: 'ids')
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * router.delete(
 *   '/projects/batch',
 *   authenticate,
 *   validateMultipleProjectOwnership(projectService, 'ids'),
 *   wrapAsync(async (req, res) => {
 *     // All project IDs in req.params.ids are validated as owned by user
 *     const projectIds = req.params.ids.split(',');
 *     // ... process batch deletion
 *   })
 * );
 * ```
 */
export function validateMultipleProjectOwnership(
  projectService: ProjectService,
  paramKey: string = 'ids'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required', 'Unauthorized');
      }

      const projectIds = req.params[paramKey];

      if (!projectIds) {
        throw new AppError(400, `Project IDs parameter '${paramKey}' is required`, 'BadRequest');
      }

      // Split comma-separated IDs and validate each
      const ids = projectIds.split(',').map((id) => id.trim());

      if (ids.length === 0) {
        throw new AppError(400, 'At least one project ID is required', 'BadRequest');
      }

      // Validate all IDs are proper UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      for (const id of ids) {
        if (!uuidRegex.test(id)) {
          throw new AppError(400, `Invalid project ID format: ${id}`, 'BadRequest');
        }
      }

      // Verify ownership for all projects
      const ownershipChecks = await Promise.allSettled(
        ids.map((id) => projectService.getProjectWithOwnership(id, req.user!.id))
      );

      // Find any projects where ownership check failed
      const failedIndexes = ownershipChecks
        .map((result, index) => (result.status === 'rejected' ? index : -1))
        .filter((index) => index !== -1);

      if (failedIndexes.length > 0) {
        throw new AppError(
          403,
          `You do not have permission to access one or more projects`,
          'Forbidden'
        );
      }

      // Attach validated projects to request
      req.projects = ownershipChecks.map((result) =>
        result.status === 'fulfilled' ? result.value : null
      ).filter((p) => p !== null) as Project[];

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
        const message = error instanceof Error ? error.message : 'Project ownership validation failed';
        res.status(403).json({
          statusCode: 403,
          message,
          error: 'Forbidden',
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }
    }
  };
}

// Extend Express Request namespace for multiple projects
declare global {
  namespace Express {
    interface Request {
      projects?: Project[];
    }
  }
}

export default {
  validateProjectOwnership,
  optionalProjectOwnership,
  validateMultipleProjectOwnership,
};
