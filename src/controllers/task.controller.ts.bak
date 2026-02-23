/**
 * Task Controller
 *
 * Handles HTTP requests for task CRUD operations
 */

import { Request, Response, Router } from 'express';
import { TaskService } from '../services/task.service';
import { BaseController } from './base.controller';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';
import { TaskStatus } from '../../../../libs/shared-types/src/models/task.interface';
import { AppError } from '../middleware/error-handler';

export class TaskController extends BaseController {
  private router: Router;
  private taskService: TaskService;

  constructor(taskService: TaskService) {
    super();
    this.taskService = taskService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // All task routes require authentication
    const { authenticate } = require('../middleware/auth.middleware');

    // List tasks with optional filtering
    this.router.get('/', authenticate, this.listTasks.bind(this));

    // Get single task
    this.router.get('/:id', authenticate, this.getTask.bind(this));

    // Create task
    this.router.post('/', authenticate, this.createTask.bind(this));

    // Update task
    this.router.patch('/:id', authenticate, this.updateTask.bind(this));

    // Delete task
    this.router.delete('/:id', authenticate, this.deleteTask.bind(this));
  }

  /**
   * GET /api/v1/tasks
   * List tasks with optional project and status filtering
   */
  private async listTasks(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { projectId, status } = req.query;

      let tasks;

      if (projectId) {
        // Validate projectId UUID
        this.validateUuid(projectId as string, 'Project ID');

        const statusFilter = status ? (status as string) as TaskStatus : undefined;

        tasks = await this.taskService.findByProjectId(
          projectId as string,
          userId,
          statusFilter
        );
      } else {
        // Return all tasks across all projects
        // For now, we'll need to implement this differently
        throw new AppError(501, 'Cross-project task list not yet implemented', 'NotImplemented');
      }

      return this.success(res, tasks);
    } catch (error: any) {
      return this.error(res, error.statusCode || 500, error.message, error.error);
    }
  }

  /**
   * GET /api/v1/tasks/:id
   * Get single task by ID
   */
  private async getTask(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      this.validateUuid(id, 'Task ID');

      const task = await this.taskService.findById(id, userId);

      if (!task) {
        return this.error(res, 404, 'Task not found', 'NotFound');
      }

      return this.success(res, task);
    } catch (error: any) {
      return this.error(res, error.statusCode || 500, error.message, error.error);
    }
  }

  /**
   * POST /api/v1/tasks
   * Create a new task
   */
  private async createTask(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);

      this.validateRequired(req.body, ['title', 'projectId']);

      const createDto: CreateTaskDto = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate,
        projectId: req.body.projectId,
        labelIds: req.body.labelIds,
      };

      const task = await this.taskService.createTask(createDto, userId);

      return this.success(res, task, 201);
    } catch (error: any) {
      return this.error(res, error.statusCode || 500, error.message, error.error);
    }
  }

  /**
   * PATCH /api/v1/tasks/:id
   * Update an existing task
   */
  private async updateTask(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      this.validateUuid(id, 'Task ID');

      const updateDto: UpdateTaskDto = {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate,
        labelIds: req.body.labelIds,
      };

      const task = await this.taskService.updateTask(id, updateDto, userId);

      return this.success(res, task);
    } catch (error: any) {
      return this.error(res, error.statusCode || 500, error.message, error.error);
    }
  }

  /**
   * DELETE /api/v1/tasks/:id
   * Delete a task
   */
  private async deleteTask(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      this.validateUuid(id, 'Task ID');

      await this.taskService.deleteTask(id, userId);

      return this.noContent(res);
    } catch (error: any) {
      return this.error(res, error.statusCode || 500, error.message, error.error);
    }
  }

  /**
   * Get router for mounting
   */
  public getRouter(): Router {
    return this.router;
  }
}
