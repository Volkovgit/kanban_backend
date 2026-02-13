/**
 * Base Service Class
 *
 * Provides common business logic for all services.
 * Acts as an intermediary between controllers and repositories.
 */

import { AppError } from '../middleware/error-handler';
import { BaseRepository, PaginationOptions, PaginationResult } from '../repositories/base.repository';
import { ObjectLiteral, DeepPartial, FindOptionsWhere } from 'typeorm';

/**
 * Service response interface for operations that return data
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Base service with common business logic
 */
export abstract class BaseService<T extends ObjectLiteral> {
  protected repository: BaseRepository<T>;

  constructor(repository: BaseRepository<T>) {
    this.repository = repository;
  }

  /**
   * Get all entities with optional pagination
   */
  async getAll(options?: PaginationOptions): Promise<PaginationResult<T>> {
    return this.repository.findAll(options);
  }

  /**
   * Get entity by ID
   * @throws AppError if entity not found
   */
  async getById(id: string): Promise<T> {
    return this.repository.findById(id);
  }

  /**
   * Get one entity by conditions
   * @returns null if not found
   */
  async getOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne(where);
  }

  /**
   * Get many entities by conditions
   */
  async getMany(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.findMany(where);
  }

  /**
   * Check if entity exists
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    return this.repository.exists(where);
  }

  /**
   * Create a new entity
   * Override this method to add custom business logic before/after creation
   */
  async create(entityData: DeepPartial<T>): Promise<T> {
    return this.repository.create(entityData);
  }

  /**
   * Update an entity by ID
   * Override this method to add custom business logic before/after update
   */
  async update(id: string, entityData: DeepPartial<T>): Promise<T> {
    return this.repository.update(id, entityData);
  }

  /**
   * Delete an entity by ID
   * Override this method to add custom business logic before/after deletion
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Soft delete an entity by ID
   * @throws AppError if entity not found or doesn't support soft delete
   */
  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Restore a soft-deleted entity
   * @throws AppError if entity not found
   */
  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  /**
   * Validate ownership of a resource
   * Override to implement custom ownership logic
   * @throws AppError if user doesn't own the resource
   */
  async validateOwnership(_resourceId: string, _userId: string): Promise<void> {
    // Base implementation - override in child classes
    // This is a placeholder that should be overridden based on entity-specific ownership logic
    throw new AppError(501, 'Ownership validation not implemented', 'NotImplemented');
  }

  /**
   * Validate business rules before creating an entity
   * Override in child classes to add custom validation
   * @throws AppError if validation fails
   */
  protected async validateCreate(_entityData: DeepPartial<T>): Promise<void> {
    // Base implementation - override in child classes
    // This is a placeholder for custom validation logic
  }

  /**
   * Validate business rules before updating an entity
   * Override in child classes to add custom validation
   * @throws AppError if validation fails
   */
  protected async validateUpdate(_id: string, _entityData: DeepPartial<T>): Promise<void> {
    // Base implementation - override in child classes
    // This is a placeholder for custom validation logic
  }

  /**
   * Validate business rules before deleting an entity
   * Override in child classes to add custom validation
   * @throws AppError if validation fails
   */
  protected async validateDelete(_id: string): Promise<void> {
    // Base implementation - override in child classes
    // This is a placeholder for custom validation logic
  }

  /**
   * Hook called after entity creation
   * Override in child classes for post-creation actions
   */
  protected async afterCreate(_entity: T): Promise<void> {
    // Base implementation - override in child classes
    // This is a placeholder for post-creation logic
  }

  /**
   * Hook called after entity update
   * Override in child classes for post-update actions
   */
  protected async afterUpdate(_entity: T): Promise<void> {
    // Base implementation - override in child classes
    // This is a placeholder for post-update logic
  }

  /**
   * Hook called after entity deletion
   * Override in child classes for post-deletion actions
   */
  protected async afterDelete(_id: string): Promise<void> {
    // Base implementation - override in child classes
    // This is a placeholder for post-deletion logic
  }

  /**
   * Execute a transaction with multiple operations
   * Override in child classes to implement transaction logic
   */
  async transaction<R>(callback: () => Promise<R>): Promise<R> {
    // Base implementation - override in child classes if using TypeORM transactions
    // This is a placeholder for transaction logic
    return callback();
  }
}

export default BaseService;
