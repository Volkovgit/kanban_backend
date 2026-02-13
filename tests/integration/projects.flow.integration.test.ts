/**
 * Integration Test: Project CRUD Flow
 *
 * Tests complete project CRUD workflow:
 * - Create project
 * - Read projects (list and single)
 * - Update project
 * - Delete project
 * - Project ownership validation
 * - Cascading behavior with tasks
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';
import { AuthService } from '../../src/services/auth.service';
import { UserService } from '../../src/services/user.service';
import { UserRepository } from '../../src/repositories/user.repository';

// Use unique test run identifier to avoid conflicts between test files
const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('Project CRUD Flow - Integration Tests', () => {
  let authService: AuthService;
  let userTokens: Map<string, { accessToken: string; userId: string }> = new Map();

  beforeAll(async () => {
    // Drop and recreate schema to ensure cascade constraints are properly set
    if (AppDataSource.isInitialized) {
      await AppDataSource.dropDatabase();
      await AppDataSource.synchronize();
    } else {
      await AppDataSource.initialize();
    }
    // Setup routes after database is ready
    await setupRoutes();
    // Small delay to ensure database is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Initialize auth service for creating test users
    const userRepository = new UserRepository(AppDataSource);
    const userService = new UserService(userRepository);
    authService = new AuthService(userRepository, userService);
  });

  afterAll(async () => {
    // Clean up all test data
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
  });

  beforeEach(async () => {
    // Clean up before each test
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
    userTokens.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await AppDataSource.query(`DELETE FROM task WHERE "title" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
    userTokens.clear();
  });

  /**
   * Helper: Create a test user and return their auth token and user ID
   */
  async function createTestUser(userSuffix: string): Promise<{ accessToken: string; userId: string }> {
    const email = `user-${userSuffix}-${testRunId}@example.com`;
    const password = 'Password123!';

    const result = await authService.register({ email, password });
    const tokens = { accessToken: result.accessToken, userId: result.user.id };
    userTokens.set(userSuffix, tokens);
    return tokens;
  }

  /**
   * Helper: Create a test project
   */
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
    it('should successfully create, read, update, and delete a project', async () => {
      // Step 1: Create user
      const { accessToken } = await createTestUser('crud-flow');

      // Step 2: Create project
      const createResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Test Project ${testRunId}`,
          description: 'A test project for CRUD workflow',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data).toHaveProperty('id');
      expect(createResponse.body.data.name).toBe(`Test Project ${testRunId}`);
      expect(createResponse.body.data.description).toBe('A test project for CRUD workflow');
      expect(createResponse.body.data).toHaveProperty('ownerId');
      expect(createResponse.body.data).toHaveProperty('createdAt');
      expect(createResponse.body.data).toHaveProperty('updatedAt');

      const projectId = createResponse.body.data.id;

      // Step 3: Read single project
      const readResponse = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.id).toBe(projectId);
      expect(readResponse.body.data.name).toBe(`Test Project ${testRunId}`);

      // Step 4: List projects
      const listResponse = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toBeInstanceOf(Array);
      expect(listResponse.body.data.length).toBe(1);
      expect(listResponse.body.data[0].id).toBe(projectId);

      // Step 5: Update project
      const updateResponse = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Updated Project ${testRunId}`,
          description: 'Updated description',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.id).toBe(projectId);
      expect(updateResponse.body.data.name).toBe(`Updated Project ${testRunId}`);
      expect(updateResponse.body.data.description).toBe('Updated description');

      // Step 6: Delete project
      const deleteResponse = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(204);

      // Step 7: Verify project is deleted
      const verifyResponse = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(verifyResponse.status).toBe(404);
    });

    it('should handle project creation with only required fields', async () => {
      const { accessToken } = await createTestUser('minimal-project');

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Minimal Project ${testRunId}`,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(`Minimal Project ${testRunId}`);
      expect(response.body.data.description).toBeNull();
    });

    it('should handle updating only project name', async () => {
      const { accessToken } = await createTestUser('partial-update');
      const project = await createProject(accessToken, `Original Name ${testRunId}`, 'Original description');

      const response = await request(app)
        .patch(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `New Name ${testRunId}` });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(`New Name ${testRunId}`);
      expect(response.body.data.description).toBe('Original description');
    });

    it('should handle updating only project description', async () => {
      const { accessToken } = await createTestUser('partial-update-desc');
      const project = await createProject(accessToken, `Project ${testRunId}`, 'Original description');

      const response = await request(app)
        .patch(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'New description' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(`Project ${testRunId}`);
      expect(response.body.data.description).toBe('New description');
    });
  });

  describe('Project Ownership and Isolation', () => {
    it('should allow users to only see their own projects', async () => {
      // Create two users
      const user1 = await createTestUser('owner-1');
      const user2 = await createTestUser('owner-2');

      // User 1 creates a project
      await createProject(user1.accessToken, `User 1 Project ${testRunId}`, 'Owned by user 1');

      // User 2 creates a project
      await createProject(user2.accessToken, `User 2 Project ${testRunId}`, 'Owned by user 2');

      // User 1 should only see their own project
      const user1ListResponse = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(user1ListResponse.status).toBe(200);
      expect(user1ListResponse.body.data.length).toBe(1);
      expect(user1ListResponse.body.data[0].name).toBe(`User 1 Project ${testRunId}`);
      expect(user1ListResponse.body.data[0].ownerId).toBe(user1.userId);

      // User 2 should only see their own project
      const user2ListResponse = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(user2ListResponse.status).toBe(200);
      expect(user2ListResponse.body.data.length).toBe(1);
      expect(user2ListResponse.body.data[0].name).toBe(`User 2 Project ${testRunId}`);
      expect(user2ListResponse.body.data[0].ownerId).toBe(user2.userId);
    });

    it('should prevent users from accessing other users projects', async () => {
      const user1 = await createTestUser('access-1');
      const user2 = await createTestUser('access-2');

      // User 1 creates a project
      const project = await createProject(user1.accessToken, `Private Project ${testRunId}`);

      // User 2 should not be able to access user 1's project
      const response = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Forbidden');
    });

    it('should prevent users from updating other users projects', async () => {
      const user1 = await createTestUser('update-1');
      const user2 = await createTestUser('update-2');

      // User 1 creates a project
      const project = await createProject(user1.accessToken, `Protected Project ${testRunId}`);

      // User 2 should not be able to update user 1's project
      const response = await request(app)
        .patch(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(403);

      // Verify project was not modified
      const verifyResponse = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.name).toBe(`Protected Project ${testRunId}`);
    });

    it('should prevent users from deleting other users projects', async () => {
      const user1 = await createTestUser('delete-1');
      const user2 = await createTestUser('delete-2');

      // User 1 creates a project
      const project = await createProject(user1.accessToken, `Protected Delete ${testRunId}`);

      // User 2 should not be able to delete user 1's project
      const response = await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`);

      expect(response.status).toBe(403);

      // Verify project still exists
      const verifyResponse = await request(app)
        .get(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(verifyResponse.status).toBe(200);
    });
  });

  describe('Cascading Behavior with Tasks', () => {
    it('should cascade delete tasks when project is deleted', async () => {
      const { accessToken } = await createTestUser('cascade');

      // Create project
      const project = await createProject(accessToken, `Project with Tasks ${testRunId}`);

      // Create tasks in the project
      const task1Response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Task 1 ${testRunId}`,
          description: 'First task',
          projectId: project.id,
          status: 'Backlog',
        });

      expect(task1Response.status).toBe(201);
      const task1Id = task1Response.body.data.id;

      const task2Response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: `Task 2 ${testRunId}`,
          description: 'Second task',
          projectId: project.id,
          status: 'To Do',
        });

      expect(task2Response.status).toBe(201);
      const task2Id = task2Response.body.data.id;

      // Verify tasks exist
      const tasksBeforeDelete = await request(app)
        .get(`/api/v1/tasks?projectId=${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(tasksBeforeDelete.status).toBe(200);
      expect(tasksBeforeDelete.body.data.length).toBe(2);

      // Delete project
      await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Verify tasks are deleted
      const task1AfterDelete = await request(app)
        .get(`/api/v1/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(task1AfterDelete.status).toBe(404);

      const task2AfterDelete = await request(app)
        .get(`/api/v1/tasks/${task2Id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(task2AfterDelete.status).toBe(404);
    });

    it('should allow deleting project with multiple tasks', async () => {
      const { accessToken } = await createTestUser('multi-task');

      // Create project
      const project = await createProject(accessToken, `Multi Task Project ${testRunId}`);

      // Create multiple tasks
      for (let i = 1; i <= 5; i++) {
        const response = await request(app)
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: `Task ${i} ${testRunId}`,
            projectId: project.id,
            status: 'Backlog',
          });

        expect(response.status).toBe(201);
      }

      // Delete project should succeed
      const deleteResponse = await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(204);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should return 401 for requests without authentication', async () => {
      const response = await request(app).get('/api/v1/projects');
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent project', async () => {
      const { accessToken } = await createTestUser('not-found');

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid project ID format', async () => {
      const { accessToken } = await createTestUser('invalid-id');

      const response = await request(app)
        .get('/api/v1/projects/invalid-uuid-format')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });

    it('should validate project name is required', async () => {
      const { accessToken } = await createTestUser('validation');

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'Project without name' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should validate project name length', async () => {
      const { accessToken } = await createTestUser('long-name');

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'a'.repeat(300), // Exceeds typical column length
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });
  });

  describe('Project Listing and Pagination', () => {
    it('should return empty array for user with no projects', async () => {
      const { accessToken } = await createTestUser('no-projects');

      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should list projects in creation order', async () => {
      const { accessToken } = await createTestUser('ordered');

      await createProject(accessToken, `Project 1 ${testRunId}`);
      await createProject(accessToken, `Project 2 ${testRunId}`);
      await createProject(accessToken, `Project 3 ${testRunId}`);

      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0].name).toContain('Project 1');
      expect(response.body.data[1].name).toContain('Project 2');
      expect(response.body.data[2].name).toContain('Project 3');
    });

    it('should support pagination for large project lists', async () => {
      const { accessToken } = await createTestUser('pagination');

      // Create 15 projects
      for (let i = 1; i <= 15; i++) {
        await createProject(accessToken, `Project ${i} ${testRunId}`);
      }

      // Get first page
      const page1Response = await request(app)
        .get('/api/v1/projects?page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.data.length).toBe(10);
      expect(page1Response.body.total).toBe(15);
      expect(page1Response.body.page).toBe(1);
      expect(page1Response.body.pageSize).toBe(10);
      expect(page1Response.body.totalPages).toBe(2);

      // Get second page
      const page2Response = await request(app)
        .get('/api/v1/projects?page=2&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.data.length).toBe(5);
      expect(page2Response.body.page).toBe(2);
    });
  });

  describe('Timestamp and Metadata', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const { accessToken } = await createTestUser('timestamps-create');

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Timestamp Project ${testRunId}` });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');

      const createdAt = new Date(response.body.data.createdAt);
      const updatedAt = new Date(response.body.data.updatedAt);

      expect(createdAt).toBeInstanceOf(Date);
      expect(updatedAt).toBeInstanceOf(Date);
      expect(isNaN(createdAt.getTime())).toBe(false);
      expect(isNaN(updatedAt.getTime())).toBe(false);
    });

    it('should update updatedAt on modification', async () => {
      const { accessToken } = await createTestUser('timestamps-update');

      const createResponse = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Timestamp Project ${testRunId}` });

      const originalUpdatedAt = new Date(createResponse.body.data.updatedAt);

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updateResponse = await request(app)
        .patch(`/api/v1/projects/${createResponse.body.data.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Updated ${testRunId}` });

      const newUpdatedAt = new Date(updateResponse.body.data.updatedAt);

      expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should include ownerId in project response', async () => {
      const { accessToken, userId } = await createTestUser('owner-check');

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `Owner Project ${testRunId}` });

      expect(response.status).toBe(201);
      expect(response.body.data.ownerId).toBe(userId);
    });
  });
});
