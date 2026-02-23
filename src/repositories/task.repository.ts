/**
 * Task Repository
 *
 * Handles data access for Task entities.
 * Extends BaseRepository with task-specific queries.
 */

import { FindOptionsWhere, DataSource } from 'typeorm';
import { Task } from '../models/task.entity';
import { TaskStatus, TaskPriority } from '../enums';
import { BaseRepository, PaginationResult } from './base.repository';

export class TaskRepository extends BaseRepository<Task> {
  constructor(dataSource: DataSource) {
    super(dataSource, Task);
  }

  /**
   * Find all tasks for a specific board
   */
  async findByBoardId(
    boardId: string,
    options?: { status?: TaskStatus; priority?: TaskPriority; page?: number; pageSize?: number }
  ): Promise<PaginationResult<Task>> {
    const { status, priority, page, pageSize } = options || {};

    const where: FindOptionsWhere<Task> = { boardId };
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
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
    boardId: string,
    status: TaskStatus
  ): Promise<Task[]> {
    return this.findMany({ boardId, status });
  }

  /**
   * Find tasks for board view (exclude completed tasks)
   */
  async findForBoard(boardId: string): Promise<Task[]> {
    return this.getRepository().find({
      where: { boardId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Search tasks by title or description
   */
  async search(query: string, userId: string): Promise<Task[]> {
    return this.getRepository()
      .createQueryBuilder('task')
      .leftJoin('task.board', 'board')
      .where('board.ownerId = :userId', { userId })
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
  async findCompleted(boardId: string): Promise<Task[]> {
    return this.findMany({ boardId, status: TaskStatus.DONE });
  }

  /**
   * Count tasks in a board
   */
  async countByBoardId(boardId: string): Promise<number> {
    return this.count({ boardId });
  }
}

export default TaskRepository;
