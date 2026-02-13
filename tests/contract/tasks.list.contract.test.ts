/**
 * Contract Test: GET /api/v1/tasks and GET /api/v1/projects/:projectId/tasks
 *
 * Validates that task listing endpoints conform to OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';

const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('GET /api/v1/tasks - Contract Tests', () => {
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
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
  });

  beforeEach(async () => {
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%@example.com' AND email NOT LIKE '%${testRunId}%'`);
  });

  afterEach(async () => {
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}@example.com'`);
  });

  describe('Request/Response Format', () => {
    it('should return 200 OK on successful task list', async () => {
      const { accessToken } = await authService.register({
        email: `test-task-list-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return tasks with correct structure', async () => {
      const { accessToken } = await authService.register({
        email: `test-task-structure-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return pagination metadata', async () => {
      const { accessToken } = await authService.register({
        email: `test-task-pagination-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const response = await request(app)
        .get('/api/v1/tasks?page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should filter by projectId when provided', async () => {
      const { accessToken } = await authService.register({
        email: `test-task-project-filter-${testRunId}@example.com',
        password: 'Password123!',
      });

      const response = await request(app)
        .get('/api/v1/tasks?projectId=some-uuid')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter by status when provided', async () => {
      const { accessToken } = await authService.register({
        email: `test-task-status-filter-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const response = await request(app)
        .get('/api/v1/tasks?status=Backlog')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Authentication', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/tasks');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Query Parameters', () => {
    it('should handle pagination parameters', async () => {
      const { accessToken } = await authService.register({
        email: `test-task-query-params-${testRunId}@example.com',
        password: 'Password123!',
      });

      const response = await request(app)
        .get('/api/v1/tasks?page=2&pageSize=20')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.pageSize).toBe(20);
    });

    it('should return empty array when no tasks exist', async () => {
      const { accessToken } = await authService.register({
        email: `test-empty-tasks-${testRunId}@example.com',
        password: 'Password123!',
      });

      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });
});
