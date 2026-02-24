/**
 * T055: Board Ownership Middleware
 *
 * Middleware для проверки того, что аутентифицированный пользователь владеет доской.
 * Используется для защиты маршрутов, требующих владения доской.
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';
import { BoardService } from '../services/board.service';
import { Board } from '../models/board.entity';

/**
 * Расширение типа Express Request для включения проверенной доски
 */
declare global {
  namespace Express {
    interface Request {
      board?: Board;
    }
  }
}

/**
 * T055: Фабрика middleware для проверки владения доской
 * Создаёт middleware, который проверяет, что аутентифицированный пользователь владеет
 * доской, указанной в параметрах запроса.
 *
 * ID доски извлекается из параметров запроса с помощью предоставленного paramKey.
 * Если владение подтверждено, доска прикрепляется к req.board для использования
 * в последующих middleware или обработчиках маршрутов.
 *
 * @param boardService - Экземпляр BoardService для валидации
 * @param paramKey - Ключ в req.params, содержащий ID доски (по умолчанию: 'id')
 * @returns Express middleware функция
 *
 * @example
 * ```typescript
 * router.get(
 *   '/boards/:id',
 *   authenticate,
 *   validateBoardOwnership(boardService, 'id'),
 *   wrapAsync(async (req, res) => {
 *     // req.board доступен здесь, предварительно проверен
 *     const board = req.board!;
 *     // ... используем board
 *   })
 * );
 * ```
 */
export function validateBoardOwnership(
  boardService: BoardService,
  paramKey: string = 'id'
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Убеждаемся, что пользователь аутентифицирован
      if (!req.user) {
        throw new AppError(401, 'Требуется аутентификация', 'Unauthorized');
      }

      // Извлекаем ID доски из параметров запроса
      const boardId = req.params[paramKey];

      if (!boardId) {
        throw new AppError(400, `Параметр ID доски '${paramKey}' обязателен`, 'BadRequest');
      }

      // Проверяем формат UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(boardId)) {
        throw new AppError(400, 'Неверный формат ID доски', 'BadRequest');
      }

      // Проверяем владение с помощью BoardService
      const board = await boardService.findByIdWithOwnership(
        boardId,
        req.user.id
      );

      // Прикрепляем проверенную доску к запросу для использования в последующих обработчиках
      req.board = board;

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.error,
            message: error.message,
          },
        });
      } else {
        const message = error instanceof Error ? error.message : 'Ошибка проверки владения доской';
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message,
          },
        });
      }
    }
  };
}
