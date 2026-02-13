/**
 * Unit Test: TaskService
 *
 * Tests task business logic:
 * - Task CRUD operations
 * - Status transitions
 * - Label assignment
 * - Task ownership validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TaskService } from '../../../../src/services/task.service';
import { TaskRepository } from '../../../../src/repositories/task.repository';
import { LabelRepository } from '../../../../src/repositories/label.repository';
import { ProjectRepository } from '../../../../src/repositories/project.repository';
import { AppDataSource } from '../../../../src/config/data-source';
import { CreateTaskDto, UpdateTaskDto } from '../../../../src/dto/task.dto';
import { TaskStatus } from '../../../../libs/shared-types/src/models/task.interface';
import { AppError } from '../../../../src/utils/app-error';

describe('TaskService - Unit Tests', () => {
  let taskService: TaskService;
  let taskRepository: TaskRepository;
  let labelRepository: LabelRepository;
  let projectRepository: ProjectRepository;
  let testUserId: string;
  let testProjectId: string;

  beforeEach(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    taskRepository = new TaskRepository(AppDataSource);
    labelRepository = new LabelRepository(AppDataSource);
    projectRepository = new ProjectRepository(AppDataSource);
    taskService = new TaskService(taskRepository, labelRepository, projectRepository);

    // Create test user and project
    const userResult = await AppDataSource.query(
      `INSERT INTO "user" (email, "passwordHash") VALUES ($1, $2) RETURNING id`,
      [`test-user-${Date.now()}@example.com`, 'hash']
    );
    testUserId = userResult[0].id;

    const projectResult = await AppDataSource.query(
      `INSERT INTO project ("name", "ownerId") VALUES ($1, $2) RETURNING id`,
      [`Test Project ${Date.now()}`, testUserId]
    );
    testProjectId = projectResult[0].id;
  });

  afterEach(async () => {
    await AppDataSource.query(`DELETE FROM task WHERE "projectId" = $1`, [testProjectId]);
    await AppDataSource.query(`DELETE FROM project WHERE id = $1`, [testProjectId]);
    await AppDataSource.query(`DELETE FROM "user" WHERE id = $1`, [testUserId]);
  });

  describe('create', () => {
    it('should create a task with default Backlog status', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
      };

      const task = await taskService.create(createDto, testUserId);

      expect(task).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe(TaskStatus.BACKLOG);
      expect(task.projectId).toBe(testProjectId);
    });

    it('should create a task with custom status', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        status: TaskStatus.TODO,
        projectId: testProjectId,
      };

      const task = await taskService.create(createDto, testUserId);

      expect(task.status).toBe(TaskStatus.TODO);
    });

    it('should assign labels to task', async () => {
      // Create labels
      const labelResult = await AppDataSource.query(
        `INSERT INTO label ("name", color, "projectId") VALUES ($1, $2, $3) RETURNING id`,
        ['Bug', '#FF0000', testProjectId]
      );
      const labelId = labelResult[0].id;

      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
        labelIds: [labelId],
      };

      const task = await taskService.create(createDto, testUserId);

      expect(task.labels).toBeDefined();
      expect(task.labels?.length).toBe(1);
      expect(task.labels?.[0].name).toBe('Bug');
    });

    it('should throw error if project does not exist', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: '00000000-0000-0000-0000-000000000000',
      };

      await expect(taskService.create(createDto, testUserId)).rejects.toThrow(AppError);
    });

    it('should throw error if user does not own project', async () => {
      // Create another user
      const otherUserResult = await AppDataSource.query(
        `INSERT INTO "user" (email, "passwordHash") VALUES ($1, $2) RETURNING id`,
        [`other-user-${Date.now()}@example.com`, 'hash']
      );
      const otherUserId = otherUserResult[0].id;

      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
      };

      await expect(taskService.create(createDto, otherUserId)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update task title', async () => {
      const createDto: CreateTaskDto = {
        title: 'Original Title',
        projectId: testProjectId,
      };

      const task = await taskService.create(createDto, testUserId);

      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
      };

      const updated = await taskService.update(task.id, updateDto, testUserId);

      expect(updated.title).toBe('Updated Title');
    });

    it('should update task status', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        status: TaskStatus.BACKLOG,
        projectId: testProjectId,
      };

      const task = await taskService.create(createDto, testUserId);

      const updateDto: UpdateTaskDto = {
        status: TaskStatus.TODO,
      };

      const updated = await taskService.update(task.id, updateDto, testUserId);

      expect(updated.status).toBe(TaskStatus.TODO);
    });

    it('should update task labels', async () => {
      // Create labels
      const label1Result = await AppDataSource.query(
        `INSERT INTO label ("name", color, "projectId") VALUES ($1, $2, $3) RETURNING id`,
        ['Bug', '#FF0000', testProjectId]
      );
      const label1Id = label1Result[0].id;

      const label2Result = await AppDataSource.query(
        `INSERT INTO label ("name", color, "projectId") VALUES ($1, $2, $3) RETURNING id`,
        ['Feature', '#0000FF', testProjectId]
      );
      const label2Id = label2Result[0].id;

      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
        labelIds: [label1Id],
      };

      const task = await taskService.create(createDto, testUserId);

      const updateDto: UpdateTaskDto = {
        labelIds: [label1Id, label2Id],
      };

      const updated = await taskService.update(task.id, updateDto, testUserId);

      expect(updated.labels?.length).toBe(2);
    });

    it('should throw error if task does not exist', async () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
      };

      await expect(
        taskService.update('00000000-0000-0000-0000-000000000000', updateDto, testUserId)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user does not own task', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
      };

      const task = await taskService.create(createDto, testUserId);

      // Create another user
      const otherUserResult = await AppDataSource.query(
        `INSERT INTO "user" (email, "passwordHash") VALUES ($1, $2) RETURNING id`,
        [`other-user-${Date.now()}@example.com`, 'hash']
      );
      const otherUserId = otherUserResult[0].id;

      const updateDto: UpdateTaskDto = {
        title: 'Updated Title',
      };

      await expect(taskService.update(task.id, updateDto, otherUserId)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
      };

      const task = await taskService.create(createDto, testUserId);

      await taskService.delete(task.id, testUserId);

      const found = await taskRepository.findById(task.id);
      expect(found).toBeNull();
    });

    it('should throw error if task does not exist', async () => {
      await expect(
        taskService.delete('00000000-0000-0000-0000-000000000000', testUserId)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user does not own task', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
      };

      const task = await taskService.create(createDto, testUserId);

      // Create another user
      const otherUserResult = await AppDataSource.query(
        `INSERT INTO "user" (email, "passwordHash") VALUES ($1, $2) RETURNING id`,
        [`other-user-${Date.now()}@example.com`, 'hash']
      );
      const otherUserId = otherUserResult[0].id;

      await expect(taskService.delete(task.id, otherUserId)).rejects.toThrow();
    });
  });

  describe('findByProjectId', () => {
    it('should return all tasks for a project', async () => {
      await taskService.create({ title: 'Task 1', projectId: testProjectId }, testUserId);
      await taskService.create({ title: 'Task 2', projectId: testProjectId }, testUserId);
      await taskService.create({ title: 'Task 3', projectId: testProjectId }, testUserId);

      const tasks = await taskService.findByProjectId(testProjectId, testUserId);

      expect(tasks.length).toBe(3);
    });

    it('should filter tasks by status', async () => {
      await taskService.create({ title: 'Task 1', status: TaskStatus.BACKLOG, projectId: testProjectId }, testUserId);
      await taskService.create({ title: 'Task 2', status: TaskStatus.TODO, projectId: testProjectId }, testUserId);
      await taskService.create({ title: 'Task 3', status: TaskStatus.TODO, projectId: testProjectId }, testUserId);

      const tasks = await taskService.findByProjectId(testProjectId, testUserId, TaskStatus.TODO);

      expect(tasks.length).toBe(2);
      expect(tasks.every(t => t.status === TaskStatus.TODO)).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return task by ID', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
      };

      const created = await taskService.create(createDto, testUserId);
      const found = await taskService.findById(created.id, testUserId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null if task does not exist', async () => {
      const found = await taskService.findById('00000000-0000-0000-0000-000000000000', testUserId);
      expect(found).toBeNull();
    });

    it('should return null if user does not own task', async () => {
      const createDto: CreateTaskDto = {
        title: 'Test Task',
        projectId: testProjectId,
      };

      const created = await taskService.create(createDto, testUserId);

      // Create another user
      const otherUserResult = await AppDataSource.query(
        `INSERT INTO "user" (email, "passwordHash") VALUES ($1, $2) RETURNING id`,
        [`other-user-${Date.now()}@example.com`, 'hash']
      );
      const otherUserId = otherUserResult[0].id;

      const found = await taskService.findById(created.id, otherUserId);
      expect(found).toBeNull();
    });
  });
});
