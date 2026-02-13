/**
 * Contract Test: POST /api/v1/tasks
 *
 * Validates that task creation endpoint conforms to OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';

const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('POST /api/v1/tasks - Contract Tests', () => {
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
    it('should return 201 Created on successful task creation', async () => {
      const { accessToken } = await authService.register({
        email: `test-create-task-${testRunId}@example.com',
        password: 'Password123!',
      });

      // First create a project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Test Project ${testRunId}` });

      expect(projectResponse.status).toBe(201);
      const projectId = projectResponse.body.data.id;

      // Create task
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Test Task ${testRunId}`,
          projectId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('projectId');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should create task with default Backlog status', async () => {
      const { accessToken } = await authService.register({
        email: `test-default-status-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Test Project ${testRunId}` });

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Test Task ${testRunId}`,
          projectId: projectResponse.body.data.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('Backlog');
    });

    it('should accept optional fields', async () => {
      const { accessToken } = await authService.register({
        email: `test-optional-fields-${testRunId}@example.com',
        password: 'Password123!',
      });

      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Test Project ${testRunId}` });

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Test Task ${testRunId}`,
          description: 'Test description',
          dueDate: '2025-12-31T23:59:59Z',
          projectId: projectResponse.body.data.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.description).toBe('Test description');
      expect(response.body.data.dueDate).toBeTruthy();
    });

    it('should return 400 Bad Request for missing title', async () => {
      const { accessToken } = await authService.register({
        email: `test-missing-title-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Test Project ${testRunId}` });

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          projectId: projectResponse.body.data.id,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should return 400 Bad Request for missing projectId', async () => {
      const { accessToken } = await authService.register({
        email: `test-missing-project-${testRunId}@example.com`,
        password: 'Password123!',
      });

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Test Task ${testRunId}`,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('Authentication', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .send({ title: 'Test Task', projectId: 'some-id' });

      expect(response.status).toBe(401);
    });
  });
});
