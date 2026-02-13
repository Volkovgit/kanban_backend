/**
 * Contract Test: DELETE /api/v1/tasks/:id
 *
 * Validates that task deletion endpoint conforms to OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';

const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('DELETE /api/v1/tasks/:id - Contract Tests', () => {
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
    it('should return 204 No Content on successful task deletion', async () => {
      const { accessToken } = await authService.register({
        email: `test-delete-task-${testRunId}@example.com',
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
          title: `Test Task ${testRunId}`,
          projectId: projectResponse.body.data.id,
        });

      const taskId = taskResponse.body.data.id;

      // Delete task
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should actually delete the task', async () => {
      const { accessToken } = await authService.register({
        email: `test-verify-delete-${testRunId}@example.com',
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

      // Delete task
      await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Verify task is deleted
      const verifyResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent task', async () => {
      const { accessToken } = await authService.register({
        email: `test-delete-not-found-${testRunId}@example.com',
        password: 'Password123!',
      });

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for deleting other users tasks', async () => {
      const user1 = await authService.register({
        email: `user1-delete-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const user2 = await authService.register({
        email: `user2-delete-${testRunId}@example.com`,
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

      // User 2 tries to delete user 1's task
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(response.status).toBe(403);

      // Verify task still exists
      const verifyResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(verifyResponse.status).toBe(200);
    });
  });

  describe('Authentication', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).delete('/api/v1/tasks/some-id');

      expect(response.status).toBe(401);
    });
  });
});
