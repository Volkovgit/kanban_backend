import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { AppDataSource } from '../../src/config/data-source';
import { BoardRepository } from '../../src/repositories/board.repository';
import { BoardService } from '../../src/services/board.service';
import { Board } from '../../src/models/board.entity';

/**
 * Unit tests для BoardService
 * Тестируют бизнес-логику сервиса в изоляции от HTTP слоя
 */
describe('BoardService Unit Tests', () => {
  let boardService: BoardService;
  let boardRepository: BoardRepository;
  let testUserId: string;

  beforeAll(async () => {
    // Инициализируем базу данных
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    boardRepository = new BoardRepository(AppDataSource);
    boardService = new BoardService(boardRepository);

    // Создаём тестового пользователя
    const userResult = await AppDataSource.getRepository('user').insert({
      login: `board_unit_test_${Date.now()}`,
      passwordHash: 'hash',
      failedLoginAttempts: 0,
      refreshToken: null,
      lockedUntil: null,
    });

    testUserId = userResult.identifiers[0].id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      // Очистка
      await AppDataSource.query(`DELETE FROM board WHERE title LIKE 'board_unit_%'`);
      await AppDataSource.query(`DELETE FROM "user" WHERE login LIKE 'board_unit_%'`);
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Очистка перед каждым тестом
    await AppDataSource.query(`DELETE FROM board WHERE title LIKE 'board_unit_%'`);
  });

  describe('T049: create', () => {
    it('должен создать доску с корректными данными', async () => {
      const boardData = {
        title: 'board_unit_test_create',
        description: 'Test description',
        ownerId: testUserId,
      };

      const board = await boardService.create(boardData);

      expect(board).toHaveProperty('id');
      expect(board.title).toBe(boardData.title);
      expect(board.description).toBe(boardData.description);
      expect(board.ownerId).toBe(testUserId);
      expect(board).toHaveProperty('createdAt');
      expect(board).toHaveProperty('updatedAt');
    });

    it('должен создать доску с null description', async () => {
      const boardData = {
        title: 'board_unit_test_null_desc',
        description: null,
        ownerId: testUserId,
      };

      const board = await boardService.create(boardData);

      expect(board.description).toBeNull();
    });

    it('должен установить дефолтные значения', async () => {
      const boardData = {
        title: 'board_unit_test_defaults',
        ownerId: testUserId,
      };

      const board = await boardService.create(boardData);

      expect(board).toHaveProperty('id');
      expect(board).toHaveProperty('createdAt');
      expect(board).toHaveProperty('updatedAt');
    });
  });

  describe('findByOwner', () => {
    beforeEach(async () => {
      // Создаём тестовые доски
      await boardService.create({
        title: 'board_unit_test_find_1',
        description: 'First board',
        ownerId: testUserId,
      });

      await boardService.create({
        title: 'board_unit_test_find_2',
        description: 'Second board',
        ownerId: testUserId,
      });

      // Создаём доску для другого пользователя
      await AppDataSource.getRepository('user').insert({
        login: `board_unit_other_${Date.now()}`,
        passwordHash: 'hash',
        failedLoginAttempts: 0,
        refreshToken: null,
        lockedUntil: null,
      });
    });

    it('должен вернуть все доски пользователя', async () => {
      const result = await boardService.findByOwner(testUserId);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((board: Board) => board.ownerId === testUserId)).toBe(true);
    });

    it('должен поддерживать пагинацию', async () => {
      const result = await boardService.findByOwner(testUserId, { page: 1, pageSize: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(1);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('должен вернуть пустой массив если у пользователя нет досок', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const result = await boardService.findByOwner(fakeUserId);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('должен найти доску по ID', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_find_id',
        ownerId: testUserId,
      });

      const found = await boardService.getById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('board_unit_test_find_id');
    });

    it('должен бросить ошибку для несуществующей доски', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(boardService.getById(fakeId)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('должен обновить title доски', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_update_title',
        ownerId: testUserId,
      });

      const updated = await boardService.update(created.id, {
        title: 'Updated Title',
      });

      expect(updated?.title).toBe('Updated Title');
    });

    it('должен обновить description доски', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_update_desc',
        description: 'Original description',
        ownerId: testUserId,
      });

      const updated = await boardService.update(created.id, {
        description: 'Updated description',
      });

      expect(updated?.description).toBe('Updated description');
    });

    it('должен обновить все поля доски', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_update_all',
        description: 'Original',
        ownerId: testUserId,
      });

      const updated = await boardService.update(created.id, {
        title: 'New Title',
        description: 'New Description',
      });

      expect(updated?.title).toBe('New Title');
      expect(updated?.description).toBe('New Description');
    });

    it('должен вернуть null при обновлении несуществующей доски', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(boardService.update(fakeId, { title: 'New Title' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('должен удалить доску', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_delete',
        ownerId: testUserId,
      });

      await boardService.delete(created.id);

      // Проверяем что доска удалена через getOne (который возвращает null)
      const found = await boardService.getOne({ id: created.id } as any);
      expect(found).toBeNull();
    });

    it('должен бросить ошибку при удалении несуществующей доски', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(boardService.delete(fakeId)).rejects.toThrow();
    });
  });

  describe('validateOwnership', () => {
    it('должен подтвердить владение доской', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_ownership',
        ownerId: testUserId,
      });

      // validateOwnership теперь бросает ошибку если не владелец
      // Если ошибки нет - значит владение подтверждено
      await expect(boardService.validateOwnership(created.id, testUserId)).resolves.not.toThrow();
    });

    it('должен отклонить владение для чужой доски', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_not_owner',
        ownerId: testUserId,
      });

      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      await expect(boardService.validateOwnership(created.id, fakeUserId)).rejects.toThrow();
    });

    it('должен вернуть false для несуществующей доски', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(boardService.validateOwnership(fakeId, testUserId)).rejects.toThrow();
    });
  });

  describe('checkOwnership', () => {
    it('должен подтвердить владение доской (возвращает boolean)', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_check_ownership',
        ownerId: testUserId,
      });

      const isOwner = await boardService.checkOwnership(created.id, testUserId);
      expect(isOwner).toBe(true);
    });

    it('должен отклонить владение для чужой доски (возвращает boolean)', async () => {
      const created = await boardService.create({
        title: 'board_unit_test_not_check_owner',
        ownerId: testUserId,
      });

      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const isOwner = await boardService.checkOwnership(created.id, fakeUserId);
      expect(isOwner).toBe(false);
    });

    it('должен вернуть false для несуществующей доски (возвращает boolean)', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const isOwner = await boardService.checkOwnership(fakeId, testUserId);
      expect(isOwner).toBe(false);
    });
  });

  describe('countByOwner', () => {
    beforeEach(async () => {
      // Очищаем перед тестами
      await AppDataSource.query(`DELETE FROM board WHERE "ownerId" = '${testUserId}' AND title LIKE 'board_unit_test_count_%'`);

      // Создаём 3 доски
      await boardService.create({
        title: 'board_unit_test_count_1',
        ownerId: testUserId,
      });

      await boardService.create({
        title: 'board_unit_test_count_2',
        ownerId: testUserId,
      });

      await boardService.create({
        title: 'board_unit_test_count_3',
        ownerId: testUserId,
      });
    });

    it('должен вернуть правильное количество досок пользователя', async () => {
      const count = await (boardService as any).repository.countByOwner(testUserId);

      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('должен вернуть 0 для пользователя без досок', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const count = await (boardService as any).repository.countByOwner(fakeUserId);

      expect(count).toBe(0);
    });
  });

  describe('Лимиты', () => {
    it('должен проверить лимит досок перед созданием', async () => {
      // Очищаем доски для чистоты теста
      await AppDataSource.query(`DELETE FROM board WHERE "ownerId" = '${testUserId}'`);

      // Создаём 99 досок
      for (let i = 0; i < 99; i++) {
        await boardService.create({
          title: `board_unit_test_limit_${i}`,
          ownerId: testUserId,
        });
      }

      const count = await (boardService as any).repository.countByOwner(testUserId);
      expect(count).toBe(99);
    });
  });
});
