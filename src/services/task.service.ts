/**
 * Task Service
 *
 * Handles task business logic:
 * - Task CRUD operations
 * - Task ownership validation
 * - Status transitions
 */

import { Task } from '../models/task.entity';
import { TaskStatus, TaskPriority } from '../enums';
import { TaskRepository } from '../repositories/task.repository';
import { BoardRepository } from '../repositories/board.repository';
import { BaseService } from './base.service';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task';
import { AppError } from '../middleware/error-handler';

export class TaskService extends BaseService<Task> {
  constructor(
    private taskRepository: TaskRepository,
    private boardRepository: BoardRepository
  ) {
    super(taskRepository);
  }

  /**
   * Create a new task
   */
  async createTask(createDto: CreateTaskDto, userId: string): Promise<Task> {
    const { title, description, status, priority, boardId } = createDto;

    if (!boardId) {
      throw new AppError(400, 'boardId обязателен', 'ValidationError');
    }

    // Validate board exists and user owns it
    const board = await this.boardRepository.findOne({ id: boardId });
    if (!board || board.ownerId !== userId) {
      throw new AppError(403, 'Access denied to board', 'Forbidden');
    }

    // Check board task limit (1000 tasks per board)
    const taskCount = await this.taskRepository.countByBoard(boardId);
    if (taskCount >= 1000) {
      throw new AppError(
        429,
        'Достигнут лимит задач (максимум 1000 на доску)',
        'TASK_LIMIT_EXCEEDED'
      );
    }

    // Create task with default values
    const taskData: Partial<Task> = {
      title,
      description: description || null,
      status: status || TaskStatus.BACKLOG,
      priority: priority || TaskPriority.MEDIUM,
      boardId,
    };

    return this.taskRepository.create(taskData);
  }

  /**
   * Update task with ownership validation
   */
  async updateTask(
    taskId: string,
    updateDto: UpdateTaskDto,
    userId: string
  ): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);

    // Validate board ownership
    const board = await this.boardRepository.findOne({ id: task.boardId });
    if (!board || board.ownerId !== userId) {
      throw new AppError(403, 'Access denied to this task', 'Forbidden');
    }

    return this.taskRepository.update(taskId, updateDto);
  }

  /**
   * Delete task with ownership validation
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findById(taskId);

    // Validate board ownership
    const board = await this.boardRepository.findOne({ id: task.boardId });
    if (!board || board.ownerId !== userId) {
      throw new AppError(403, 'Access denied to this task', 'Forbidden');
    }

    await this.taskRepository.delete(taskId);
  }

  /**
   * Find all tasks for a board with filters
   */
  async findByBoard(
    boardId: string,
    userId: string,
    options?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{
    data: Task[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    // Validate board ownership
    const board = await this.boardRepository.findOne({ id: boardId });
    if (!board || board.ownerId !== userId) {
      throw new AppError(403, 'Access denied to board', 'Forbidden');
    }

    return this.taskRepository.findByBoardId(boardId, options);
  }

  /**
   * Find task by ID with ownership validation
   */
  async findById(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);

    // Validate board ownership
    const board = await this.boardRepository.findOne({ id: task.boardId });
    if (!board || board.ownerId !== userId) {
      throw new AppError(403, 'Access denied to this task', 'Forbidden');
    }

    return task;
  }

  /**
   * Validate board ownership
   */
  async validateBoardOwnership(
    taskId: string,
    userId: string
  ): Promise<boolean> {
    const task = await this.taskRepository.findById(taskId);
    const board = await this.boardRepository.findOne({ id: task.boardId });
    return board ? board.ownerId === userId : false;
  }
}

export default TaskService;
