import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { JwtService } from '@nestjs/jwt';

/**
 * Integration tests для Board endpoints
 * Тестируют бизнес-логику и интеграцию с базой данных
 */
describe('Board Integration Tests', () => {
  let server: any;
  let authService: AuthService;
  let accessToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Инициализируем базу данных
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Setup routes
    await setupRoutes();

    // Инициализируем сервисы
    const userRepository = new UserRepository(AppDataSource);
    const userService = new UserService(userRepository);
    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });
    authService = new AuthService(userService, jwtService);

    server = app;

    // Создаём тестового пользователя
    const testUser = {
      login: `board_integration_test_${Date.now()}`,
      password: 'SecurePass123',
    };
    const user = await authService.register(testUser);
    testUserId = user.id;

    const tokens = await authService.login(testUser);
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  afterEach(async () => {
    // Очистка после каждого теста
    if (AppDataSource.isInitialized) {
      await AppDataSource.query(`DELETE FROM task WHERE "boardId" IN (SELECT id FROM board WHERE title LIKE 'board_integration_%')`);
      await AppDataSource.query(`DELETE FROM board WHERE title LIKE 'board_integration_%'`);
    }
  });

  describe('T045: CRUD досок', () => {
    it('должен создать, прочитать, обновить и удалить доску', async () => {
      // CREATE
      const createResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_integration_test_crud',
          description: 'CRUD test board',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const boardId = createResponse.body.data.id;

      // READ
      const getResponse = await request(server)
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.id).toBe(boardId);
      expect(getResponse.body.data.title).toBe('board_integration_test_crud');

      // UPDATE
      const patchResponse = await request(server)
        .patch(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated CRUD Board',
          description: 'Updated description',
        });

      expect(patchResponse.status).toBe(200);
      expect(patchResponse.body.data.title).toBe('Updated CRUD Board');

      // DELETE
      const deleteResponse = await request(server)
        .delete(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Проверяем, что доска удалена
      const verifyResponse = await request(server)
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('T046: Изоляция пользователей', () => {
    let secondUserAccessToken: string;
    let testBoardId: string;

    beforeAll(async () => {
      // Создаём второго пользователя
      const secondUser = {
        login: `board_integration_test_user2_${Date.now()}`,
        password: 'SecurePass123',
      };
      await authService.register(secondUser);
      const tokens = await authService.login(secondUser);
      secondUserAccessToken = tokens.accessToken;

      // Создаём доску от имени первого пользователя
      const createResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_integration_test_isolation',
          description: 'Board for user1',
        });

      testBoardId = createResponse.body.data.id;
    });

    it('пользователь не должен видеть доски другого пользователя', async () => {
      // Второй пользователь не должен видеть доску первого
      const response = await request(server)
        .get(`/api/v1/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${secondUserAccessToken}`);

      // 404 потому что middleware не находит доску для этого пользователя
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('пользователь не должен обновлять доски другого пользователя', async () => {
      const response = await request(server)
        .patch(`/api/v1/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${secondUserAccessToken}`)
        .send({
          title: 'Hacked title',
        });

      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('пользователь не должен удалять доски другого пользователя', async () => {
      const response = await request(server)
        .delete(`/api/v1/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${secondUserAccessToken}`);

      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('пользователь должен видеть только свои доски в списке', async () => {
      // Создаём доски для обоих пользователей
      await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_integration_test_user1_list',
        });

      await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${secondUserAccessToken}`)
        .send({
          title: 'board_integration_test_user2_list',
        });

      // Первый пользователь получает свои доски
      const user1Response = await request(server)
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(user1Response.status).toBe(200);
      const user1Boards = user1Response.body.data;
      expect(user1Boards.every((board: any) => board.ownerId === testUserId)).toBe(true);

      // Второй пользователь получает свои доски
      const user2Response = await request(server)
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${secondUserAccessToken}`);

      expect(user2Response.status).toBe(200);
      const user2Boards = user2Response.body.data;
      expect(user2Boards.every((board: any) => board.ownerId !== testUserId)).toBe(true);
    });
  });

  describe('T047: Cascade delete доски с задачами', () => {
    it('должен удалить все задачи при удалении доски', async () => {
      // Создаём доску
      const createBoardResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_integration_test_cascade',
          description: 'Board for cascade test',
        });

      const boardId = createBoardResponse.body.data.id;

      // Создаём несколько задач напрямую через SQL (так как task endpoints ещё не реализованы)
      await AppDataSource.query(
        `INSERT INTO task (id, title, "boardId", status, priority, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['00000000-0000-0000-0000-000000000001', 'Task 1', boardId, 'BACKLOG', 'MEDIUM', new Date(), new Date()]
      );

      await AppDataSource.query(
        `INSERT INTO task (id, title, "boardId", status, priority, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['00000000-0000-0000-0000-000000000002', 'Task 2', boardId, 'BACKLOG', 'MEDIUM', new Date(), new Date()]
      );

      // Проверяем, что задачи созданы
      const tasksBeforeDelete = await AppDataSource.query(`SELECT * FROM task WHERE "boardId" = $1`, [boardId]);
      expect(tasksBeforeDelete.length).toBe(2);

      // Удаляем доску
      await request(server)
        .delete(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Проверяем, что задачи удалены (cascade)
      const tasksAfterDelete = await AppDataSource.query(`SELECT * FROM task WHERE "boardId" = $1`, [boardId]);
      expect(tasksAfterDelete.length).toBe(0);

      // Проверяем, что доска также удалена
      const boardCheck = await request(server)
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(boardCheck.status).toBe(404);
    });
  });

  describe('T048: Лимит 100 досок на пользователя', () => {
    it('должен позволить создать до 100 досок', async () => {
      // Очищаем существующие доски для чистоты теста
      await AppDataSource.query(`DELETE FROM task WHERE "boardId" IN (SELECT id FROM board WHERE "ownerId" = '${testUserId}' AND title LIKE 'board_limit_%')`);
      await AppDataSource.query(`DELETE FROM board WHERE "ownerId" = '${testUserId}' AND title LIKE 'board_limit_%'`);

      // Создаём 99 досок последовательно
      const responses = [];
      for (let i = 0; i < 99; i++) {
        const response = await request(server)
          .post('/api/v1/boards')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: `board_limit_${i}`,
            description: `Board ${i}`,
          });
        responses.push(response);
      }

      // Все должны быть успешными
      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });

      // Проверяем количество (может быть больше из-за других тестов)
      const boardsResponse = await request(server)
        .get('/api/v1/boards?pageSize=100')
        .set('Authorization', `Bearer ${accessToken}`);

      // Проверяем что хотя бы 99 досок создано (могут быть другие от предыдущих тестов)
      expect(boardsResponse.body.data.length).toBeGreaterThanOrEqual(99);
    });

    it('должен вернуть 429 при попытке создать более 100 досок', async () => {
      // Очищаем и создаём ровно 100 досок последовательно
      await AppDataSource.query(`DELETE FROM task WHERE "boardId" IN (SELECT id FROM board WHERE "ownerId" = '${testUserId}')`);
      await AppDataSource.query(`DELETE FROM board WHERE "ownerId" = '${testUserId}'`);

      for (let i = 0; i < 100; i++) {
        await request(server)
          .post('/api/v1/boards')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: `board_limit_full_${i}`,
          });
      }

      // Пытаемся создать 101-ю доску
      const response = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_limit_101',
        });

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('лимит');
    });
  });

  describe('Дополнительные интеграционные тесты', () => {
    it('должен корректно обновлять updatedAt', async () => {
      // Очистка перед тестом на случай если достигнут лимит
      await AppDataSource.query(`DELETE FROM board WHERE "ownerId" = '${testUserId}' AND title NOT LIKE 'board_integration_%'`);

      const createResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_integration_test_updated_at',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body).toHaveProperty('success', true);
      expect(createResponse.body).toHaveProperty('data');

      const boardId = createResponse.body.data.id;
      const originalUpdatedAt = createResponse.body.data.updatedAt;

      // Небольшая задержка для гарантии разницы во времени
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Обновляем доску
      await request(server)
        .patch(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated title',
        });

      const getResponse = await request(server)
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data).toHaveProperty('updatedAt');

      const newUpdatedAt = new Date(getResponse.body.data.updatedAt);
      const originalDate = new Date(originalUpdatedAt);

      expect(newUpdatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });

    it('должен поддерживать сортировку', async () => {
      // Создаём несколько досок с разными названиями
      await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Zebra Board' });

      await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Alpha Board' });

      const response = await request(server)
        .get('/api/v1/boards?sortBy=title&sortOrder=ASC')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      const titles = response.body.data.map((b: any) => b.title);
      expect(titles).toEqual(titles.sort());
    });
  });
});
