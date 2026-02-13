/**
 * Task Repository
 *
 * Handles data access for Task entities.
 * Extends BaseRepository with task-specific queries.
 */

import { FindOptionsWhere, DataSource } from 'typeorm';
import { Task } from '../models/task.entity';
import { TaskStatus } from '../../../../libs/shared-types/src/models/task.interface';
import { BaseRepository, PaginationResult } from './base.repository';

export class TaskRepository extends BaseRepository<Task> {
  constructor(dataSource: DataSource) {
    super(dataSource, Task);
  }

  /**
   * Find all tasks for a specific project
   */
  async findByProjectId(
    projectId: string,
    options?: { status?: TaskStatus; page?: number; pageSize?: number }
  ): Promise<PaginationResult<Task>> {
    const { status, page, pageSize } = options || {};

    const where: FindOptionsWhere<Task> = { projectId };
    if (status) {
      where.status = status;
    }

    if (page && pageSize) {
      return this.findAll({ page, pageSize });
    }

    const data = await this.findMany(where);
    return {
      data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    };
  }

  /**
   * Find tasks by status
   */
  async findByStatus(
    projectId: string,
    status: TaskStatus
  ): Promise<Task[]> {
    return this.findMany({ projectId, status });
  }

  /**
   * Find tasks for board view (exclude completed/archived tasks)
   */
  async findForBoard(projectId: string): Promise<Task[]> {
    return this.getRepository().find({
      where: { projectId, status: TaskStatus.DONE },
      relations: ['labels'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Search tasks by title or description
   */
  async search(query: string, userId: string): Promise<Task[]> {
    return this.getRepository()
      .createQueryBuilder('task')
      .leftJoin('task.project', 'project')
      .leftJoin('task.labels', 'labels')
      .where('project.ownerId = :userId', { userId })
      .andWhere(
        '(task.title ILIKE :query OR task.description ILIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('task.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Find completed tasks
   */
  async findCompleted(projectId: string): Promise<Task[]> {
    return this.findMany({ projectId, status: TaskStatus.DONE });
  }

  /**
   * Count tasks in a project
   */
  async countByProjectId(projectId: string): Promise<number> {
    return this.count({ projectId });
  }
}
