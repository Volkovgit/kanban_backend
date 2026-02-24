/**
 * T076/T078: Task Controller
 *
 * Обрабатывает HTTP запросы для управления задачами:
 * - Получение списка задач доски
 * - Создание новой задачи
 * - Получение задачи по ID
 * - Обновление задачи
 * - Удаление задачи
 */

import { Router, Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dto/task/create-task.dto';
import { UpdateTaskDto } from '../dto/task/update-task.dto';
import { wrapAsync } from '../middleware/error-handler';
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { BaseController } from './base.controller';
import { validateDto } from '../config/validation';

/**
 * T076: Контроллер для управления задачами
 * Express router для task endpoints
 */
export class TaskController extends BaseController {
  private router = Router();
  private taskService: TaskService;
  private dataSource: any;

  constructor(taskService: TaskService, dataSource: any) {
    super();
    this.taskService = taskService;
    this.dataSource = dataSource;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * T076/T078: GET /boards/:boardId/tasks
     * Получение списка задач доски с фильтрацией по status/priority
     */
    this.router.get(
      '/boards/:boardId/tasks',
      createAuthenticateMiddleware(this.dataSource),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const boardId = req.params.boardId;
        const { page, pageSize } = this.getPaginationParams(req);
        const { status, priority } = req.query;

        const result = await this.taskService.findByBoard(boardId, userId, {
          page,
          pageSize,
          status: status as any,
          priority: priority as any,
        });

        // Устанавливаем заголовки пагинации
        res.setHeader('X-Total-Count', result.total.toString());
        res.setHeader('X-Page-Size', result.pageSize.toString());
        res.setHeader('X-Current-Page', result.page.toString());
        res.setHeader('X-Total-Pages', result.totalPages.toString());

        return res.status(200).json(this.success(result.data));
      })
    );

    /**
     * T076/T078: POST /boards/:boardId/tasks
     * Создание новой задачи на доске
     */
    this.router.post(
      '/boards/:boardId/tasks',
      createAuthenticateMiddleware(this.dataSource),
      validateDto(CreateTaskDto),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const boardId = req.params.boardId;
        const createTaskDto: CreateTaskDto = req.body;

        // Добавляем boardId к DTO
        const taskData = {
          ...createTaskDto,
          boardId,
        };

        const task = await this.taskService.createTask(taskData, userId);

        return res.status(201).json(this.success(task, 'Задача успешно создана'));
      })
    );

    /**
     * T076/T078: GET /tasks/:id
     * Получение задачи по ID с проверкой владения доской
     */
    this.router.get(
      '/tasks/:id',
      createAuthenticateMiddleware(this.dataSource),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const taskId = req.params.id;

        const task = await this.taskService.findById(taskId, userId);

        return res.status(200).json(this.success(task));
      })
    );

    /**
     * T076/T078: PATCH /tasks/:id
     * Обновление задачи с проверкой владения
     */
    this.router.patch(
      '/tasks/:id',
      createAuthenticateMiddleware(this.dataSource),
      validateDto(UpdateTaskDto),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const taskId = req.params.id;
        const updateTaskDto: UpdateTaskDto = req.body;

        const task = await this.taskService.updateTask(taskId, updateTaskDto, userId);

        return res.status(200).json(this.success(task, 'Задача успешно обновлена'));
      })
    );

    /**
     * T076/T078: DELETE /tasks/:id
     * Удаление задачи
     */
    this.router.delete(
      '/tasks/:id',
      createAuthenticateMiddleware(this.dataSource),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const taskId = req.params.id;

        await this.taskService.deleteTask(taskId, userId);

        return res.status(200).json(this.success(null, 'Задача успешно удалена'));
      })
    );
  }

  /**
   * Получить Express router для task endpoints
   */
  getRouter(): Router {
    return this.router;
  }
}
