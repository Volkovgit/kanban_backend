import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { BoardService } from '../../src/services/board.service';
import { BoardRepository } from '../../src/repositories/board.repository';
import { JwtService } from '@nestjs/jwt';

/**
 * Contract tests для Task endpoints
 * Тестируют API контракт согласно specs/001-kanban/contracts/tasks.yaml
 */
describe('Task Contract Tests', () => {
  let server: any;
  let authService: AuthService;
  let boardService: BoardService;
  let accessToken: string;
  let testUserId: string;
  let testBoardId: string;

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
    const boardRepository = new BoardRepository(AppDataSource);
    boardService = new BoardService(boardRepository);

    server = app;

    // Создаём тестового пользователя
    const testUser = {
      login: `task_contract_test_${Date.now()}`,
      password: 'SecurePass123',
    };
    const user = await authService.register(testUser);
    testUserId = user.id;

    const tokens = await authService.login(testUser);
    accessToken = tokens.accessToken;

    // Создаём тестовую доску
    const board = await boardService.createBoard(
      {
        title: 'Task Contract Test Board',
        description: 'Board for task contract tests',
      },
      testUserId
    );
    testBoardId = board.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  afterEach(async () => {
    // Очистка после каждого теста
    if (AppDataSource.isInitialized) {
      await AppDataSource.query(`DELETE FROM task WHERE title LIKE 'task_contract_%'`);
    }
  });

  describe('GET /api/v1/boards/:boardId/tasks', () => {
    it('T060: должен вернуть 200 и список задач доски', async () => {
      // Сначала создадим тестовую задачу
      await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'task_contract_test_list',
        });

      const response = await request(server)
        .get(`/api/v1/boards/${testBoardId}/tasks`)
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

    it('T060: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .get(`/api/v1/boards/${testBoardId}/tasks`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T060: должен поддерживать фильтрацию по статусу', async () => {
      const response = await request(server)
        .get(`/api/v1/boards/${testBoardId}/tasks?status=BACKLOG`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((task: any) => {
        expect(task.status).toBe('BACKLOG');
      });
    });

    it('T060: должен поддерживать фильтрацию по приоритету', async () => {
      const response = await request(server)
        .get(`/api/v1/boards/${testBoardId}/tasks?priority=HIGH`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.forEach((task: any) => {
        expect(task.priority).toBe('HIGH');
      });
    });
  });

  describe('POST /api/v1/boards/:boardId/tasks', () => {
    it('T061: должен вернуть 201 при успешном создании задачи', async () => {
      const newTask = {
        title: 'task_contract_test_create',
        description: 'Test task description',
      };

      const response = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newTask)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', newTask.title);
      expect(response.body.data).toHaveProperty('description', newTask.description);
      expect(response.body.data).toHaveProperty('status', 'BACKLOG'); // default
      expect(response.body.data).toHaveProperty('priority', 'MEDIUM'); // default
      expect(response.body.data).toHaveProperty('boardId', testBoardId);
    });

    it('T061: должен вернуть 400 при пустом title', async () => {
      const response = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
          description: 'Description',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T061: должен вернуть 400 при title длиннее 255 символов', async () => {
      const response = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'a'.repeat(256),
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T061: должен установить дефолтные значения для status и priority', async () => {
      const response = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'task_contract_test_defaults',
        })
        .expect(201);

      expect(response.body.data.status).toBe('BACKLOG');
      expect(response.body.data.priority).toBe('MEDIUM');
    });

    it('T061: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .send({
          title: 'Test Task',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T061: должен вернуть 403/404 для несуществующей доски', async () => {
      const fakeBoardId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .post(`/api/v1/boards/${fakeBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task',
        });

      // Может быть 403 (forbidden) или 404 (not found)
      expect([403, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('T062: должен вернуть 200 при запросе существующей задачи', async () => {
      // Создаём задачу
      const createResponse = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'task_contract_test_get',
          description: 'Test description',
        });

      const taskId = createResponse.body.data.id;

      const response = await request(server)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', taskId);
      expect(response.body.data).toHaveProperty('title', 'task_contract_test_get');
    });

    it('T062: должен вернуть 404 при запросе несуществующей задачи', async () => {
      const fakeTaskId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .get(`/api/v1/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T062: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .get('/api/v1/tasks/some-id')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T062: должен вернуть 404 при невалидном UUID (NotFound)', async () => {
      const response = await request(server)
        .get('/api/v1/tasks/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('T063: должен вернуть 200 при успешном обновлении задачи', async () => {
      // Создаём задачу
      const createResponse = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'task_contract_test_update',
          status: 'BACKLOG',
          priority: 'LOW',
        });

      const taskId = createResponse.body.data.id;

      const response = await request(server)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Task',
          description: 'Updated description',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', taskId);
      expect(response.body.data).toHaveProperty('title', 'Updated Task');
      expect(response.body.data).toHaveProperty('status', 'IN_PROGRESS');
      expect(response.body.data).toHaveProperty('priority', 'HIGH');
    });

    it('T063: должен вернуть 200 при обновлении только title', async () => {
      const createResponse = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'task_contract_test_patch_title',
        });

      const taskId = createResponse.body.data.id;

      const response = await request(server)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Only title updated',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('title', 'Only title updated');
      expect(response.body.data).toHaveProperty('status', 'BACKLOG'); // unchanged
    });

    it('T063: должен вернуть 400 при пустом title', async () => {
      const createResponse = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'task_contract_test_validation',
        });

      const taskId = createResponse.body.data.id;

      const response = await request(server)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T063: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .patch('/api/v1/tasks/some-id')
        .send({ title: 'Updated' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T063: должен вернуть 404 при попытке обновить несуществующую задачу', async () => {
      const fakeTaskId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .patch(`/api/v1/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T063: должен вернуть 404 при попытке обновить несуществующую задачу', async () => {
      const fakeTaskId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .patch(`/api/v1/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('T064: должен вернуть 200 при успешном удалении задачи', async () => {
      // Создаём задачу
      const createResponse = await request(server)
        .post(`/api/v1/boards/${testBoardId}/tasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'task_contract_test_delete',
          description: 'To be deleted',
        });

      const taskId = createResponse.body.data.id;

      const response = await request(server)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Проверяем, что задача действительно удалена
      await request(server)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('T064: должен вернуть 401 при отсутствии авторизации', async () => {
      const response = await request(server)
        .delete('/api/v1/tasks/some-id')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T064: должен вернуть 404 при попытке удалить несуществующую задачу', async () => {
      const fakeTaskId = '00000000-0000-0000-0000-000000000000';

      const response = await request(server)
        .delete(`/api/v1/tasks/${fakeTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T064: должен вернуть 404 при невалидном UUID (NotFound)', async () => {
      const response = await request(server)
        .delete('/api/v1/tasks/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
