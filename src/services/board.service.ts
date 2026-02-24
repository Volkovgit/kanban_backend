/**
 * T054: Board Service
 *
 * Бизнес-логика для управления канбан-досками.
 * Обеспечивает изоляцию данных между пользователями и проверку лимитов.
 */

import { Injectable } from '@nestjs/common';
import { Board } from '../models/board.entity';
import { BoardRepository } from '../repositories/board.repository';
import { BaseService } from './base.service';
import { AppError } from '../middleware/error-handler';
import { CreateBoardDto } from '../dto/board/create-board.dto';
import { UpdateBoardDto } from '../dto/board/update-board.dto';

/**
 * T054: Сервис для управления досками
 */
@Injectable()
export class BoardService extends BaseService<Board> {
  constructor(repository: BoardRepository) {
    super(repository);
  }

  /**
   * T054: Создание доски для пользователя с проверкой лимита 100
   * @param createBoardDto - Данные для создания доски
   * @param userId - ID владельца доски
   * @throws AppError если достигнут лимит досок (100 на пользователя)
   */
  async createBoard(
    createBoardDto: CreateBoardDto,
    userId: string
  ): Promise<Board> {
    // Проверяем лимит досок (100 на пользователя)
    const boardCount = await (this.repository as BoardRepository).countByOwner(
      userId
    );

    if (boardCount >= 100) {
      throw new AppError(
        429,
        `Достигнут лимит досок (максимум 100 на пользователя)`,
        'BOARD_LIMIT_EXCEEDED'
      );
    }

    // Создаём доску
    const boardData = {
      ...createBoardDto,
      ownerId: userId,
    };

    return this.create(boardData);
  }

  /**
   * T054: Получение досок пользователя с пагинацией
   * @param userId - ID пользователя
   * @param options - Параметры пагинации
   * @returns Список досок с метаданными пагинации
   */
  async findByOwner(
    userId: string,
    options?: { page?: number; pageSize?: number }
  ): Promise<{
    data: Board[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    return (this.repository as BoardRepository).findByOwner(userId, options);
  }

  /**
   * T054: Получение доски по ID с проверкой владения
   * @param boardId - ID доски
   * @param userId - ID пользователя
   * @throws AppError если доска не найдена или не принадлежит пользователю
   */
  async findByIdWithOwnership(boardId: string, userId: string): Promise<Board> {
    const board = await this.getOne({
      id: boardId,
    } as import('typeorm').FindOptionsWhere<Board>);

    if (!board) {
      throw new AppError(404, 'Доска не найдена', 'BOARD_NOT_FOUND');
    }

    if (board.ownerId !== userId) {
      throw new AppError(
        403,
        'Доска принадлежит другому пользователю',
        'FORBIDDEN'
      );
    }

    return board;
  }

  /**
   * T054: Обновление доски с проверкой владения
   * @param boardId - ID доски
   * @param updateBoardDto - Данные для обновления
   * @param userId - ID пользователя
   * @throws AppError если доска не найдена или не принадлежит пользователю
   */
  async updateBoard(
    boardId: string,
    updateBoardDto: UpdateBoardDto,
    userId: string
  ): Promise<Board> {
    // Сначала проверяем владение
    await this.findByIdWithOwnership(boardId, userId);

    // Обновляем доску
    return this.update(boardId, updateBoardDto);
  }

  /**
   * T054: Удаление доски с cascade delete задач в транзакции
   * @param boardId - ID доски
   * @param userId - ID пользователя
   * @throws AppError если доска не найдена или не принадлежит пользователю
   */
  async deleteBoard(boardId: string, userId: string): Promise<void> {
    // Сначала проверяем владение
    await this.findByIdWithOwnership(boardId, userId);

    // Удаляем доску (cascade delete задач произойдёт автоматически через TypeORM)
    await this.delete(boardId);
  }

  /**
   * T054: Проверка что доска принадлежит пользователю
   * Переопределяет базовый метод validateOwnership
   * @param boardId - ID доски
   * @param userId - ID пользователя
   * @throws AppError если доска не принадлежит пользователю
   */
  override async validateOwnership(
    boardId: string,
    userId: string
  ): Promise<void> {
    const board = await this.getOne({
      id: boardId,
    } as import('typeorm').FindOptionsWhere<Board>);

    if (!board) {
      throw new AppError(404, 'Доска не найдена', 'BOARD_NOT_FOUND');
    }

    if (board.ownerId !== userId) {
      throw new AppError(
        403,
        'Доска принадлежит другому пользователю',
        'FORBIDDEN'
      );
    }
  }

  /**
   * T054: Проверка владения без выброса ошибки (возвращает boolean)
   * @param boardId - ID доски
   * @param userId - ID пользователя
   * @returns true если доска принадлежит пользователю, иначе false
   */
  async checkOwnership(boardId: string, userId: string): Promise<boolean> {
    try {
      const board = await this.getOne({
        id: boardId,
      } as import('typeorm').FindOptionsWhere<Board>);

      if (!board) {
        return false;
      }

      return board.ownerId === userId;
    } catch (error) {
      return false;
    }
  }

  /**
   * T054: Проверка лимита досок
   * @param userId - ID пользователя
   * @returns true если лимит не превышен, иначе false
   */
  async isUnderLimit(userId: string): Promise<boolean> {
    const count = await (this.repository as BoardRepository).countByOwner(
      userId
    );
    return count < 100;
  }
}
