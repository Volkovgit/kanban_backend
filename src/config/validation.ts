/**
 * Validation Configuration
 *
 * Configures class-validator and class-transformer for DTO validation.
 * Provides validation middleware for Express routes.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError, validate } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';

/**
 * Validation error response format
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

/**
 * Validate request body against a DTO class
 * @param dtoClass - The DTO class to validate against
 * @param skipMissingProperties - Whether to skip validation of missing properties
 * @returns Express middleware function
 */
export function validateDto<T extends object>(
  dtoClass: ClassConstructor<T>,
  skipMissingProperties: boolean = false
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(dtoClass, req.body);

    const errors: ValidationError[] = await validate(dto, {
      skipMissingProperties,
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      stopAtFirstError: false, // Collect all errors
    });

    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);

      const response = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? formattedErrors : undefined,
        },
        path: req.url,
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
      return;
    }

    // Replace req.body with the validated and transformed DTO
    req.body = dto;
    next();
  };
}

/**
 * Validate request query parameters against a DTO class
 * @param dtoClass - The DTO class to validate against
 * @returns Express middleware function
 */
export function validateQuery<T extends object>(
  dtoClass: ClassConstructor<T>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(dtoClass, req.query);

    const errors: ValidationError[] = await validate(dto, {
      skipMissingProperties: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query validation failed',
          errors: formattedErrors,
        },
        path: req.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.query = dto as any;
    next();
  };
}

/**
 * Validate request params against a DTO class
 * @param dtoClass - The DTO class to validate against
 * @returns Express middleware function
 */
export function validateParams<T extends object>(
  dtoClass: ClassConstructor<T>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = plainToInstance(dtoClass, req.params);

    const errors: ValidationError[] = await validate(dto, {
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Params validation failed',
          errors: formattedErrors,
        },
        path: req.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.params = dto as any;
    next();
  };
}

/**
 * Format validation errors into a more readable format
 */
export function formatValidationErrors(
  errors: ValidationError[]
): Array<{ field: string; constraints: string[] }> {
  const formattedErrors: Array<{ field: string; constraints: string[] }> = [];

  for (const error of errors) {
    const constraints = error.constraints
      ? Object.values(error.constraints)
      : [];

    if (error.children && error.children.length > 0) {
      // Handle nested validation errors
      const nestedErrors = formatValidationErrors(error.children);
      formattedErrors.push(...nestedErrors.map((e) => ({
        field: `${error.property}.${e.field}`,
        constraints: e.constraints,
      })));
    } else if (constraints.length > 0) {
      formattedErrors.push({
        field: error.property,
        constraints,
      });
    }
  }

  return formattedErrors;
}

/**
 * Manual validation helper for any object
 * @param dto - The DTO instance to validate
 * @returns Validation result with errors if any
 */
export async function validateObject<T extends object>(
  dto: T
): Promise<ValidationResult> {
  const errors = await validate(dto, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
  };
}

/**
 * Custom validator decorators can be added here
 * Example: validate password strength, email format, etc.
 */

export default {
  validateDto,
  validateQuery,
  validateParams,
  formatValidationErrors,
  validateObject,
};
