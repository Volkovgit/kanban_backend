/**
 * Contract Test: PATCH /api/v1/tasks/:id
 *
 * Validates that task update endpoint conforms to OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';

const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('PATCH /api/v1/tasks/:id - Contract Tests', () => {
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
    it('should return 200 OK on successful task update', async () => {
      const { accessToken } = await authService.register({
        email: `test-update-task-${testRunId}@example.com',
        password: 'Password123!',
      });

      // Create project and task
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Test Project ${testRunId}` });

      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Original Title ${testRunId}`,
          projectId: projectResponse.body.data.id,
        });

      const taskId = taskResponse.body.data.id;

      // Update task
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: `Updated Title ${testRunId}` });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(`Updated Title ${testRunId}`);
    });

    it('should support partial updates', async () => {
      const { accessToken } = await authService.register({
        email: `test-partial-update-${testRunId}@example.com',
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
          description: 'Original description',
          projectId: projectResponse.body.data.id,
        });

      const taskId = taskResponse.body.data.id;

      // Update only description
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'New description' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe(`Test Task ${testRunId}`);
      expect(response.body.data.description).toBe('New description');
    });

    it('should update task status', async () => {
      const { accessToken } = await authService.register({
        email: `test-status-update-${testRunId}@example.com',
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
          projectId: projectResponse.body.data.id,
        });

      const taskId = taskResponse.body.data.id;

      // Update status
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'To Do' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('To Do');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent task', async () => {
      const { accessToken } = await authService.register({
        email: `test-update-not-found-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .patch(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
    });

    it('should return 403 for updating other users tasks', async () => {
      const user1 = await authService.register({
        email: `user1-update-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const user2 = await authService.register({
        email: `user2-update-${testRunId}@example.com`,
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

      // User 2 tries to update user 1's task
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ title: 'Hacked Title' });

      expect(response.status).toBe(403);
    });
  });

  describe('Authentication', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch('/api/v1/tasks/some-id')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(401);
    });
  });
});
