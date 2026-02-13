/**
 * Integration Test: Task CRUD Flow
 *
 * Tests complete task CRUD workflow:
 * - Create task
 * - Read tasks (list and single)
 * - Update task
 * - Delete task
 * - Task ownership validation
 * - Label assignment
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';

const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('Task CRUD Flow - Integration Tests', () => {
  let authService: AuthService;
  let userTokens: Map<string, { accessToken: string; userId: string }> = new Map();

  beforeAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.dropDatabase();
      await AppDataSource.synchronize();
    } else {
      await AppDataSource.initialize();
    }
    await setupRoutes();
    await new Promise(resolve => setTimeout(resolve, 100));

    const userRepository = new UserRepository(AppDataSource);
    const userService = new UserService(userRepository);
    authService = new AuthService(userRepository, userService);
  });

  afterAll(async () => {
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
  });

  beforeEach(async () => {
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
    userTokens.clear();
  });

  afterEach(async () => {
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
    userTokens.clear();
  });

  async function createTestUser(userSuffix: string): Promise<{ accessToken: string; userId: string }> {
    const email = `user-${userSuffix}-${testRunId}@example.com`;
    const password = 'Password123!';

    const result = await authService.register({ email, password });
    const tokens = { accessToken: result.accessToken, userId: result.user.id };
    userTokens.set(userSuffix, tokens);
    return tokens;
  }

  async function createProject(
    accessToken: string,
    name: string,
    description?: string
  ): Promise<{ id: string; name: string; description: string | null; ownerId: string }> {
    const response = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description });

    expect(response.status).toBe(201);
    return response.body.data;
  }

  describe('Complete CRUD Workflow', () => {
    it('should successfully create, read, update, and delete a task', async () => {
      // Create user
      const { accessToken } = await createTestUser('crud-flow');

      // Create project
      const project = await createProject(accessToken, `Test Project ${testRunId}`);

      // Create task
      const createResponse = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Test Task ${testRunId}`,
          description: 'A test task for CRUD workflow',
          projectId: project.id,
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data).toHaveProperty('id');
      expect(createResponse.body.data.title).toBe(`Test Task ${testRunId}`);
      expect(createResponse.body.data.description).toBe('A test task for CRUD workflow');
      expect(createResponse.body.data.status).toBe('Backlog');

      const taskId = createResponse.body.data.id;

      // Read single task
      const readResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.id).toBe(taskId);
      expect(readResponse.body.data.title).toBe(`Test Task ${testRunId}`);

      // Update task
      const updateResponse = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Updated Task ${testRunId}`,
          description: 'Updated description',
          status: 'To Do',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.title).toBe(`Updated Task ${testRunId}`);
      expect(updateResponse.body.data.description).toBe('Updated description');
      expect(updateResponse.body.data.status).toBe('To Do');

      // Delete task
      const deleteResponse = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify task is deleted
      const verifyResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(verifyResponse.status).toBe(404);
    });
  });

  describe('Task Ownership and Isolation', () => {
    it('should allow users to only see their own tasks', async () => {
      const user1 = await createTestUser('owner-1');
      const user2 = await createTestUser('owner-2');

      const project1 = await createProject(user1.accessToken, `User 1 Project ${testRunId}`);
      const project2 = await createProject(user2.accessToken, `User 2 Project ${testRunId}`);

      // User 1 creates a task
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          title: `User 1 Task ${testRunId}`,
          projectId: project1.id,
        });

      // User 2 creates a task
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({
          title: `User 2 Task ${testRunId}`,
          projectId: project2.id,
        });

      // User 1 should only see their own task
      const user1ListResponse = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(user1ListResponse.status).toBe(200);
      expect(user1ListResponse.body.data.length).toBe(1);
      expect(user1ListResponse.body.data[0].title).toBe(`User 1 Task ${testRunId}`);
    });

    it('should prevent users from accessing other users tasks', async () => {
      const user1 = await createTestUser('access-1');
      const user2 = await createTestUser('access-2');

      const project = await createProject(user1.accessToken, `Private Project ${testRunId}`);

      // User 1 creates a task
      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          title: `Private Task ${testRunId}`,
          projectId: project.id,
        });

      const taskId = taskResponse.body.data.id;

      // User 2 should not be able to access user 1's task
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Label Assignment', () => {
    it('should allow creating labels for a project', async () => {
      const { accessToken } = await createTestUser('labels');

      const project = await createProject(accessToken, `Label Project ${testRunId}`);

      const response = await request(app)
        .post('/api/v1/labels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Bug',
          color: '#FF0000',
          projectId: project.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Bug');
      expect(response.body.data.color).toBe('#FF0000');
    });

    it('should list labels for a project', async () => {
      const { accessToken } = await createTestUser('list-labels');

      const project = await createProject(accessToken, `List Labels Project ${testRunId}`);

      // Create multiple labels
      await request(app)
        .post('/api/v1/labels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Bug', color: '#FF0000', projectId: project.id });

      await request(app)
        .post('/api/v1/labels')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Feature', color: '#0000FF', projectId: project.id });

      const response = await request(app)
        .get(`/api/v1/labels?projectId=${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('Project-level Task Filtering', () => {
    it('should filter tasks by project', async () => {
      const { accessToken } = await createTestUser('project-filter');

      const project1 = await createProject(accessToken, `Project 1 ${testRunId}`);
      const project2 = await createProject(accessToken, `Project 2 ${testRunId}`);

      // Create tasks in both projects
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: `Task in P1 ${testRunId}`, projectId: project1.id });

      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: `Task in P2 ${testRunId}`, projectId: project2.id });

      // Filter by project 1
      const response = await request(app)
        .get(`/api/v1/tasks?projectId=${project1.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe(`Task in P1 ${testRunId}`);
    });
  });
});
