/**
 * Contract Test: GET /api/v1/tasks/:id
 *
 * Validates that task detail endpoint conforms to OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';

const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('GET /api/v1/tasks/:id - Contract Tests', () => {
  let authService: AuthService;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await setupRoutes();

    const userRepository = new UserRepository(AppDataSource);
    const userService = new UserService(userRepository);
    authService = new AuthService(userRepository, userService);
  });

  afterAll(async () => {
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
  });

  beforeEach(async () => {
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%@example.com' AND "title" NOT LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%@example.com' AND "name" NOT LIKE '%${testRunId}%'`);
  });

  afterEach(async () => {
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}@example.com'`);
  });

  describe('Request/Response Format', () => {
    it('should return 200 OK on successful task retrieval', async () => {
      const { accessToken } = await authService.register({
        email: `test-get-task-${testRunId}@example.com`,
        password: 'Password123!',
      });

      // Create project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Test Project ${testRunId}` });

      // Create task
      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Test Task ${testRunId}`,
          projectId: projectResponse.body.data.id,
        });

      expect(taskResponse.status).toBe(201);
      const taskId = taskResponse.body.data.id;

      // Get task
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should return task with all fields', async () => {
      const { accessToken } = await authService.register({
        email: `test-task-fields-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Test Project ${testRunId}` });

      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Test Task ${testRunId}`,
          description: 'Test description',
          dueDate: '2025-12-31T23:59:59Z',
          projectId: projectResponse.body.data.id,
        });

      const taskId = taskResponse.body.data.id;

      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(taskId);
      expect(response.body.data.title).toBe(`Test Task ${testRunId}`);
      expect(response.body.data.description).toBe('Test description');
      expect(response.body.data.dueDate).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent task', async () => {
      const { accessToken } = await authService.register({
        email: `test-not-found-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid task ID format', async () => {
      const { accessToken } = await authService.register({
        email: `test-invalid-id-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const response = await request(app)
        .get('/api/v1/tasks/invalid-uuid-format')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it('should return 403 for accessing other users tasks', async () => {
      // User 1
      const user1 = await authService.register({
        email: `user1-${testRunId}@example.com`,
        password: 'Password123!',
      });

      // User 2
      const user2 = await authService.register({
        email: `user2-${testRunId}@example.com`,
        password: 'Password123!',
      });

      // User 1 creates project and task
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({ name: `Test Project ${testRunId}` });

      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          title: `Private Task ${testRunId}`,
          projectId: projectResponse.body.data.id,
        });

      const taskId = taskResponse.body.data.id;

      // User 2 tries to access user 1's task
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Authentication', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/tasks/some-id');

      expect(response.status).toBe(401);
    });
  });
});
