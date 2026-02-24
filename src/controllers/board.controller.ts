/**
 * T056/T058: Board Controller
 *
 * Обрабатывает HTTP запросы для управления канбан-досками:
 * - Получение списка досок пользователя
 * - Создание новой доски
 * - Получение доски по ID
 * - Обновление доски
 * - Удаление доски
 */

import { Router, Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { CreateBoardDto } from '../dto/board/create-board.dto';
import { UpdateBoardDto } from '../dto/board/update-board.dto';
import { wrapAsync } from '../middleware/error-handler';
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { validateBoardOwnership } from '../middleware/validate-board-ownership';
import { BaseController } from './base.controller';
import { DataSource } from 'typeorm';
import { validateDto } from '../config/validation';

/**
 * T056: Контроллер для управления досками
 * Express router для board endpoints
 */
export class BoardController extends BaseController {
  private router = Router();
  private boardService: BoardService;
  private dataSource: DataSource;

  constructor(boardService: BoardService, dataSource: DataSource) {
    super();
    this.boardService = boardService;
    this.dataSource = dataSource;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * T056/T058: GET /boards
     * Получение списка досок авторизованного пользователя с пагинацией
     */
    this.router.get(
      '/',
      createAuthenticateMiddleware(this.dataSource),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const { page, pageSize } = this.getPaginationParams(req);

        const result = await this.boardService.findByOwner(userId, {
          page,
          pageSize,
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
     * T056/T058: POST /boards
     * Создание новой доски для авторизованного пользователя
     */
    this.router.post(
      '/',
      createAuthenticateMiddleware(this.dataSource),
      validateDto(CreateBoardDto),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const createBoardDto: CreateBoardDto = req.body;

        const board = await this.boardService.createBoard(
          createBoardDto,
          userId
        );

        return res
          .status(201)
          .json(this.success(board, 'Доска успешно создана'));
      })
    );

    /**
     * T056/T058: GET /boards/:id
     * Получение доски по ID с проверкой владения
     */
    this.router.get(
      '/:id',
      createAuthenticateMiddleware(this.dataSource),
      validateBoardOwnership(this.boardService, 'id'),
      wrapAsync(async (req: Request, res: Response) => {
        // req.board уже проверен middleware
        const board = req.board!;

        return res.status(200).json(this.success(board));
      })
    );

    /**
     * T056/T058: PATCH /boards/:id
     * Обновление доски с проверкой владения
     */
    this.router.patch(
      '/:id',
      createAuthenticateMiddleware(this.dataSource),
      validateBoardOwnership(this.boardService, 'id'),
      validateDto(UpdateBoardDto),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const boardId = req.params.id;
        const updateBoardDto: UpdateBoardDto = req.body;

        const board = await this.boardService.updateBoard(
          boardId,
          updateBoardDto,
          userId
        );

        return res
          .status(200)
          .json(this.success(board, 'Доска успешно обновлена'));
      })
    );

    /**
     * T056/T058: DELETE /boards/:id
     * Удаление доски с cascade delete задач
     */
    this.router.delete(
      '/:id',
      createAuthenticateMiddleware(this.dataSource),
      validateBoardOwnership(this.boardService, 'id'),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const boardId = req.params.id;

        await this.boardService.deleteBoard(boardId, userId);

        return res
          .status(200)
          .json(this.success(null, 'Доска успешно удалена'));
      })
    );
  }

  /**
   * Получить Express router для board endpoints
   */
  getRouter(): Router {
    return this.router;
  }
}
