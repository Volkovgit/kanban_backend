import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { JwtService } from '@nestjs/jwt';

/**
 * Contract tests для Board endpoints
 * Тестируют API контракт согласно specs/001-kanban/contracts/boards.yaml
 */
describe('Board Contract Tests', () => {
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

    // Инициализируем auth service для тестов
    const userRepository = new UserRepository(AppDataSource);
    const userService = new UserService(userRepository);
    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });
    authService = new AuthService(userService, jwtService);

    server = app;

    // Создаём тестового пользователя и получаем токен
    const testUser = {
      login: `board_contract_test_${Date.now()}`,
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
      await AppDataSource.query(`DELETE FROM task WHERE "boardId" IN (SELECT id FROM board WHERE title LIKE 'board_contract_%')`);
      await AppDataSource.query(`DELETE FROM board WHERE title LIKE 'board_contract_%'`);
    }
  });

  describe('GET /api/v1/boards', () => {
    it('T040: должен вернуть 200 и список досок авторизованного пользователя', async () => {
      // Сначала создадём тестовую доску
      await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_contract_test_list',
          description: 'Test description',
        });

      const response = await request(server)
        .get('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Проверяем заголовки пагинации
      expect(response.headers).toHaveProperty('x-total-count');
      expect(response.headers).toHaveProperty('x-page-size');
      expect(response.headers).toHaveProperty('x-current-page');
      expect(response.headers).toHaveProperty('x-total-pages');
    });

    it('T040: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .get('/api/v1/boards')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T040: должен поддерживать пагинацию', async () => {
      const response = await request(server)
        .get('/api/v1/boards?page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.headers['x-page-size']).toBe('10');
      expect(response.headers['x-current-page']).toBe('1');
    });
  });

  describe('POST /api/v1/boards', () => {
    it('T041: должен вернуть 201 при успешном создании доски', async () => {
      const newBoard = {
        title: 'board_contract_test_create',
        description: 'Test board description',
      };

      const response = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newBoard)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', newBoard.title);
      expect(response.body.data).toHaveProperty('description', newBoard.description);
      expect(response.body.data).toHaveProperty('ownerId', testUserId);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('T041: должен вернуть 400 при пустом title', async () => {
      const response = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
          description: 'Description',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T041: должен вернуть 400 при title длиннее 255 символов', async () => {
      const response = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'a'.repeat(256),
          description: 'Description',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T041: должен вернуть 400 при description длиннее 5000 символов', async () => {
      const response = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Valid Title',
          description: 'a'.repeat(5001),
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T041: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .post('/api/v1/boards')
        .send({
          title: 'Test Board',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T041: должен создать доску с null description', async () => {
      const newBoard = {
        title: 'board_contract_test_no_desc',
        description: null,
      };

      const response = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newBoard)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('description', null);
    });
  });

  describe('GET /api/v1/boards/:id', () => {
    it('T042: должен вернуть 200 при запросе существующей доски пользователя', async () => {
      // Создаём доску
      const createResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_contract_test_get',
          description: 'Test description',
        });

      const boardId = createResponse.body.data.id;

      const response = await request(server)
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', boardId);
      expect(response.body.data).toHaveProperty('title', 'board_contract_test_get');
    });

    it('T042: должен вернуть 404 при запросе несуществующей доски', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .get(`/api/v1/boards/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T042: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .get('/api/v1/boards/some-id')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T042: должен вернуть 400 при невалидном UUID', async () => {
      const response = await request(server)
        .get('/api/v1/boards/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/v1/boards/:id', () => {
    it('T043: должен вернуть 200 при успешном обновлении доски', async () => {
      // Создаём доску
      const createResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_contract_test_update',
          description: 'Original description',
        });

      const boardId = createResponse.body.data.id;

      const response = await request(server)
        .patch(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', boardId);
      expect(response.body.data).toHaveProperty('title', 'Updated Title');
      expect(response.body.data).toHaveProperty('description', 'Updated description');
    });

    it('T043: должен вернуть 200 при обновлении только title', async () => {
      // Создаём доску
      const createResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_contract_test_patch_title',
          description: 'Original description',
        });

      const boardId = createResponse.body.data.id;

      const response = await request(server)
        .patch(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Only title updated',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', 'Only title updated');
      expect(response.body.data).toHaveProperty('description', 'Original description');
    });

    it('T043: должен вернуть 400 при пустом title', async () => {
      const createResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_contract_test_validation',
        });

      const boardId = createResponse.body.data.id;

      const response = await request(server)
        .patch(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T043: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .patch('/api/v1/boards/some-id')
        .send({ title: 'Updated' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T043: должен вернуть 404 при попытке обновить несуществующую доску', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .patch(`/api/v1/boards/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/boards/:id', () => {
    it('T044: должен вернуть 200 при успешном удалении доски', async () => {
      // Создаём доску
      const createResponse = await request(server)
        .post('/api/v1/boards')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'board_contract_test_delete',
          description: 'To be deleted',
        });

      const boardId = createResponse.body.data.id;

      const response = await request(server)
        .delete(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Проверяем, что доска действительно удалена
      await request(server)
        .get(`/api/v1/boards/${boardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('T044: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .delete('/api/v1/boards/some-id')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T044: должен вернуть 404 при попытке удалить несуществующую доску', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .delete(`/api/v1/boards/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T044: должен вернуть 400 при невалидном UUID', async () => {
      const response = await request(server)
        .delete('/api/v1/boards/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
