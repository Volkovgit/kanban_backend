/**
 * Project Repository
 *
 * Handles database operations for Project entity.
 * Extends BaseRepository with project-specific methods.
 */

import { DataSource, FindOptionsWhere } from 'typeorm';
import { Project } from '../models/project.entity';
import { BaseRepository } from './base.repository';
import { AppError } from '../middleware/error-handler';

/**
 * Project repository with specialized queries
 */
export class ProjectRepository extends BaseRepository<Project> {
  constructor(dataSource: DataSource) {
    super(dataSource, Project);
  }

  /**
   * Find all projects belonging to a specific user
   * @param userId - The user's ID (ownerId)
   * @param options - Optional pagination options
   * @returns Paginated list of user's projects
   */
  async findAllByUserId(
    userId: string,
    options?: { page: number; pageSize: number }
  ): Promise<{
    data: Project[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const where = { ownerId: userId } as FindOptionsWhere<Project>;

    if (options) {
      const { page, pageSize } = options;
      const skip = (page - 1) * pageSize;

      const [data, total] = await this.repository.findAndCount({
        where,
        skip,
        take: pageSize,
        order: { updatedAt: 'DESC' }, // Most recently updated first
        cache: false,
      });

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const data = await this.repository.find({
      where,
      order: { updatedAt: 'DESC' },
      cache: false,
    });

    return {
      data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    };
  }

  /**
   * Find project by ID and verify ownership
   * @param id - Project ID
   * @param userId - User ID to verify ownership
   * @returns Project if found and owned by user
   * @throws AppError if project not found or access denied
   */
  async findByIdAndOwner(id: string, userId: string): Promise<Project> {
    const project = await this.findById(id);

    if (project.ownerId !== userId) {
      throw new AppError(403, 'Access denied', 'Forbidden');
    }

    return project;
  }

  /**
   * Create a new project for a user
   * @param name - Project name
   * @param description - Optional project description
   * @param ownerId - User ID who will own the project
   * @returns Created project
   */
  async createProject(
    name: string,
    description: string | null | undefined,
    ownerId: string
  ): Promise<Project> {
    const projectData: Partial<Project> = {
      name,
      ownerId,
    };

    // Only set description if provided (including empty string)
    // TypeORM will handle null vs undefined correctly
    if (description !== undefined) {
      (projectData as any).description = description;
    }

    return this.create(projectData as any);
  }

  /**
   * Update an existing project
   * @param id - Project ID
   * @param userId - User ID to verify ownership
   * @param updates - Partial project data to update
   * @returns Updated project
   * @throws AppError if project not found or access denied
   */
  async updateProject(
    id: string,
    userId: string,
    updates: Partial<Pick<Project, 'name' | 'description'>>
  ): Promise<Project> {
    const project = await this.findByIdAndOwner(id, userId);
    this.repository.merge(project, updates);
    return this.repository.save(project);
  }

  /**
   * Delete a project
   * @param id - Project ID
   * @param userId - User ID to verify ownership
   * @throws AppError if project not found or access denied
   */
  async deleteProject(id: string, userId: string): Promise<void> {
    const project = await this.findByIdAndOwner(id, userId);
    await this.repository.remove(project);
  }

  /**
   * Count the number of tasks in a project
   * @param projectId - Project ID
   * @returns Number of tasks in the project
   */
  async countTasks(projectId: string): Promise<number> {
    // Use QueryBuilder to count related tasks efficiently
    const result = await this.repository
      .createQueryBuilder('project')
      .leftJoin('project.tasks', 'task')
      .where('project.id = :projectId', { projectId })
      .select('COUNT(task.id)', 'taskCount')
      .getRawOne();

    return parseInt(result?.taskCount || '0', 10);
  }

  /**
   * Check if a project name already exists for a user
   * @param name - Project name to check
   * @param userId - User ID (owner)
   * @param excludeId - Optional project ID to exclude (for update scenarios)
   * @returns True if name exists for user, false otherwise
   */
  async nameExistsForUser(
    name: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    const where: FindOptionsWhere<Project> = {
      name,
      ownerId: userId,
    };

    const existingProject = await this.repository.findOne({
      where,
      cache: false,
    });

    if (!existingProject) {
      return false;
    }

    // If excludeId is provided, allow if the existing project is the same one
    if (excludeId && existingProject.id === excludeId) {
      return false;
    }

    return true;
  }
}

export default ProjectRepository;
