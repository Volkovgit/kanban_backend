/**
 * Base Repository Class
 *
 * Provides common database operations for all repositories.
 * Wraps TypeORM repository with standard CRUD operations and common queries.
 */

import { ObjectLiteral, Repository, FindOptionsWhere, DataSource, DeepPartial } from 'typeorm';
import { AppError } from '../middleware/error-handler';

/**
 * Pagination options interface
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Pagination result interface
 */
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Base repository with common CRUD operations
 */
export abstract class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;

  constructor(
    protected dataSource: DataSource,
    protected entity: new () => T
  ) {
    this.repository = dataSource.getRepository(entity);
  }

  /**
   * Find all entities with optional pagination
   */
  async findAll(options?: PaginationOptions): Promise<PaginationResult<T>> {
    if (options) {
      const { page, pageSize } = options;
      const skip = (page - 1) * pageSize;

      const [data, total] = await this.repository.findAndCount({
        skip,
        take: pageSize,
      });

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const data = await this.repository.find();
    return {
      data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    };
  }

  /**
   * Find entity by ID
   * @throws AppError if entity not found or invalid ID format
   */
  async findById(id: string): Promise<T> {
    // Validate UUID format before database query
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new AppError(404, 'Resource not found', 'NotFound');
    }

    // Use findOne with cache disabled to ensure fresh data from database
    const entity = await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
      cache: false, // Disable query cache
    });

    if (!entity) {
      throw new AppError(404, 'Resource not found', 'NotFound');
    }

    return entity;
  }

  /**
   * Find one entity by conditions
   * @returns null if not found
   */
  async findOne(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where, cache: false });
  }

  /**
   * Find one entity by conditions or throw error
   * @throws AppError if entity not found
   */
  async findOneOrFail(where: FindOptionsWhere<T>): Promise<T> {
    const entity = await this.repository.findOne({ where });

    if (!entity) {
      throw new AppError(404, 'Resource not found', 'NotFound');
    }

    return entity;
  }

  /**
   * Find entities by conditions
   */
  async findMany(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where });
  }

  /**
   * Check if entity exists by conditions
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }

  /**
   * Count entities by conditions
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }

  /**
   * Create a new entity
   */
  async create(entityData: DeepPartial<T>): Promise<T> {
    const newEntity = this.repository.create(entityData);
    const saved = await this.repository.save(newEntity);

    // Force a database query to ensure the transaction is flushed
    // This is needed because TypeORM might batch inserts in some cases
    await this.repository.manager.connection.query('SELECT 1');

    return saved;
  }

  /**
   * Update an entity by ID
   * @throws AppError if entity not found
   */
  async update(id: string, entityData: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id);
    this.repository.merge(entity, entityData);
    return this.repository.save(entity);
  }

  /**
   * Update entities by conditions
   */
  async updateMany(where: FindOptionsWhere<T>, entityData: DeepPartial<T>): Promise<void> {
    await this.repository.update(where, entityData as DeepPartial<any>);
  }

  /**
   * Delete an entity by ID
   * @throws AppError if entity not found
   */
  async delete(id: string): Promise<void> {
    const entity = await this.findById(id);
    await this.repository.remove(entity);
  }

  /**
   * Delete entities by conditions
   */
  async deleteMany(where: FindOptionsWhere<T>): Promise<void> {
    await this.repository.delete(where);
  }

  /**
   * Soft delete an entity by ID (if entity supports soft delete)
   * @throws AppError if entity not found or doesn't support soft delete
   */
  async softDelete(id: string): Promise<void> {
    const result = await this.repository.softDelete({ id } as unknown as FindOptionsWhere<T>);

    if (result.affected === 0) {
      throw new AppError(404, 'Resource not found', 'NotFound');
    }
  }

  /**
   * Restore a soft-deleted entity
   * @throws AppError if entity not found
   */
  async restore(id: string): Promise<void> {
    const result = await this.repository.restore({ id } as unknown as FindOptionsWhere<T>);

    if (result.affected === 0) {
      throw new AppError(404, 'Resource not found', 'NotFound');
    }
  }

  /**
   * Get the TypeORM repository instance
   */
  getRepository(): Repository<T> {
    return this.repository;
  }
}

export default BaseRepository;
