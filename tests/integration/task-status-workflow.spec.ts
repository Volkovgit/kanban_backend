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
import { TaskStatus, TaskPriority } from '../../src/enums';

/**
 * Integration tests для Task Status Workflow (Phase 6)
 * Тестируют переходы статусов, приоритетов и валидацию
 */
describe('Task Status Workflow Integration Tests', () => {
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
      login: `task_workflow_test_${Date.now()}`,
      password: 'SecurePass123',
    };
    const user = await authService.register(testUser);
    testUserId = user.id;

    const tokens = await authService.login(testUser);
    accessToken = tokens.accessToken;

    // Создаём тестовую доску
    const board = await boardService.createBoard(
      {
        title: 'Workflow Test Board',
        description: 'Board for workflow integration tests',
      },
      testUserId
    );
    testBoardId = board.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      // Очистка тестовых данных
      await AppDataSource.query(`DELETE FROM task WHERE title LIKE 'workflow_test_%'`);
      await AppDataSource.query(`DELETE FROM board WHERE title = 'Workflow Test Board'`);
      await AppDataSource.query(`DELETE FROM "user" WHERE login LIKE 'task_workflow_test_%'`);
      await AppDataSource.destroy();
    }
  });

  afterEach(async () => {
    // Очистка задач после каждого теста
    if (AppDataSource.isInitialized) {
      await AppDataSource.query(`DELETE FROM task WHERE title LIKE 'workflow_test_%'`);
    }
  });

  const createTestTask = async (title: string) => {
    const res = await request(server)
      .post(`/api/v1/boards/${testBoardId}/tasks`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title,
        description: 'Workflow test task description',
      });
    return res.body.data.id;
  };

  describe('T080 & T081: Bi-directional Workflow', () => {
    it('should allow transitions between all statuses in any order (forward and back)', async () => {
      const taskId = await createTestTask('workflow_test_bidirectional');

      // Последовательность переходов (включая возвраты назад и прыжки)
      const statuses = [
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        TaskStatus.REVIEW,
        TaskStatus.DONE,
        TaskStatus.BACKLOG, // Прыжок назад в начало
        TaskStatus.REVIEW,  // Прыжок вперёд
        TaskStatus.TODO,    // Переход назад
        TaskStatus.DONE,    // Прыжок в конец
      ];

      for (const status of statuses) {
        const res = await request(server)
          .patch(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ status });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(status);

        // Проверяем сохранение в базе
        const getRes = await request(server)
          .get(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${accessToken}`);
        expect(getRes.body.data.status).toBe(status);
      }
    });
  });

  describe('T082: Invalid Statuses', () => {
    it('should return 400 for invalid status values', async () => {
      const taskId = await createTestTask('workflow_test_invalid_status');

      const res = await request(server)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'NON_EXISTENT_STATUS' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Validation failed');
    });
  });

  describe('T083: Priority Changes', () => {
    it('should allow changing priority between all valid values', async () => {
      const taskId = await createTestTask('workflow_test_priority');

      const priorities = [
        TaskPriority.LOW,
        TaskPriority.HIGH,
        TaskPriority.CRITICAL,
        TaskPriority.MEDIUM,
      ];

      for (const priority of priorities) {
        const res = await request(server)
          .patch(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ priority });

        expect(res.status).toBe(200);
        expect(res.body.data.priority).toBe(priority);
      }
    });

    it('should return 400 for invalid priority values', async () => {
      const taskId = await createTestTask('workflow_test_invalid_priority');

      const res = await request(server)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ priority: 'INVALID_PRIORITY_LEVEL' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
