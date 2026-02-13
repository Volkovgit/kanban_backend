/**
 * Unit Test: ProjectService
 *
 * Tests for ProjectService business logic including:
 * - createProject
 * - findAllByUserId
 * - findById
 * - updateProject
 * - deleteProject
 * - Ownership validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ProjectService } from '../../../src/services/project.service';
import { ProjectRepository } from '../../../src/repositories/project.repository';
import { UserRepository } from '../../../src/repositories/user.repository';
import { AppDataSource } from '../../../src/config/data-source';
import { AppError } from '../../../src/middleware/error-handler';
import { Project } from '../../../src/models/project.entity';

// Use unique test run identifier
const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('ProjectService', () => {
  let projectService: ProjectService;
  let projectRepository: ProjectRepository;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Drop and recreate schema to ensure cascade constraints are properly set
    if (AppDataSource.isInitialized) {
      await AppDataSource.dropDatabase();
      await AppDataSource.synchronize();
    } else {
      await AppDataSource.initialize();
    }

    // Create repository instance
    projectRepository = new ProjectRepository(AppDataSource);
    userRepository = new UserRepository(AppDataSource);
    projectService = new ProjectService(projectRepository, userRepository);
    // Small delay to ensure database is ready
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Clean up in correct order to avoid foreign key constraints
    await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
  });

  beforeEach(async () => {
    // Clean up before each test - delete projects first due to foreign key constraint
    try {
      await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    } catch {
      // Ignore if table doesn't exist or other errors
    }
    try {
      await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
    } catch {
      // Ignore if table doesn't exist or other errors
    }
  });

  afterEach(async () => {
    // Clean up after each test - delete projects first due to foreign key constraint
    try {
      await AppDataSource.query(`DELETE FROM project WHERE "name" LIKE '%${testRunId}%'`);
    } catch {
      // Ignore errors
    }
    try {
      await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
    } catch {
      // Ignore errors
    }
  });

  /**
   * Helper: Create a test user
   */
  async function createTestUser(suffix: string): Promise<string> {
    const result = await AppDataSource.query(
      `INSERT INTO "user" (email, "passwordHash", "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id`,
      [`user-${suffix}-${testRunId}@example.com`, 'hashedpassword']
    );
    return result[0].id;
  }

  /**
   * Helper: Create a test project directly in database
   */
  async function createTestProject(userId: string, name: string, description?: string): Promise<Project> {
    const projectData: any = {
      name,
      ownerId: userId,
    };

    if (description !== undefined) {
      projectData.description = description;
    }

    return projectRepository.create(projectData);
  }

  describe('createProject', () => {
    it('should create a project with valid data', async () => {
      const userId = await createTestUser('create-valid');
      const projectData = {
        name: `Test Project ${testRunId}`,
        description: 'A test project',
        ownerId: userId,
      };

      const result = await projectService.createProject(projectData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect(result.description).toBe(projectData.description);
      expect(result.ownerId).toBe(userId);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should create a project without description', async () => {
      const userId = await createTestUser('create-no-desc');
      const projectData = {
        name: `Minimal Project ${testRunId}`,
        ownerId: userId,
      };

      const result = await projectService.createProject(projectData);

      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect(result.description).toBeNull();
    });

    it('should reject project with empty name', async () => {
      const userId = await createTestUser('create-empty-name');

      await expect(
        projectService.createProject({
          name: '',
          ownerId: userId,
        })
      ).rejects.toThrow();
    });

    it('should reject project with name exceeding max length', async () => {
      const userId = await createTestUser('create-long-name');

      await expect(
        projectService.createProject({
          name: 'a'.repeat(300),
          ownerId: userId,
        })
      ).rejects.toThrow();
    });

    it('should generate UUID for project ID', async () => {
      const userId = await createTestUser('create-uuid');
      const result = await projectService.createProject({
        name: `UUID Project ${testRunId}`,
        ownerId: userId,
      });

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(result.id).toMatch(uuidRegex);
    });

    it('should set timestamps on creation', async () => {
      const userId = await createTestUser('create-timestamps');
      const result = await projectService.createProject({
        name: `Timestamp Project ${testRunId}`,
        ownerId: userId,
      });

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(isNaN(result.createdAt.getTime())).toBe(false);
      expect(isNaN(result.updatedAt.getTime())).toBe(false);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all projects for a user', async () => {
      const userId1 = await createTestUser('findall-user1');
      const userId2 = await createTestUser('findall-user2');

      // Create projects for user 1
      await createTestProject(userId1, `User1 Project 1 ${testRunId}`, 'Description 1');
      await createTestProject(userId1, `User1 Project 2 ${testRunId}`, 'Description 2');

      // Create project for user 2
      await createTestProject(userId2, `User2 Project 1 ${testRunId}`, 'Description 3');

      const result1 = await projectService.findAllByUserId(userId1);

      expect(result1).toBeDefined();
      expect(result1.length).toBe(2);
      expect(result1[0].ownerId).toBe(userId1);
      expect(result1[1].ownerId).toBe(userId1);

      const result2 = await projectService.findAllByUserId(userId2);

      expect(result2).toBeDefined();
      expect(result2.length).toBe(1);
      expect(result2[0].ownerId).toBe(userId2);
    });

    it('should return empty array for user with no projects', async () => {
      const userId = await createTestUser('findall-empty');

      const result = await projectService.findAllByUserId(userId);

      expect(result).toBeDefined();
      expect(result).toEqual([]);
    });

    it('should return projects ordered by creation date', async () => {
      const userId = await createTestUser('findall-ordered');

      const project1 = await createTestProject(userId, `Project 1 ${testRunId}`);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const project2 = await createTestProject(userId, `Project 2 ${testRunId}`);
      await new Promise(resolve => setTimeout(resolve, 10));
      const project3 = await createTestProject(userId, `Project 3 ${testRunId}`);

      const result = await projectService.findAllByUserId(userId);

      expect(result.length).toBe(3);
      expect(result[0].id).toBe(project1.id);
      expect(result[1].id).toBe(project2.id);
      expect(result[2].id).toBe(project3.id);
    });

    it('should not include projects from other users', async () => {
      const userId1 = await createTestUser('findall-isolated-1');
      const userId2 = await createTestUser('findall-isolated-2');

      await createTestProject(userId1, `User1 Project ${testRunId}`);
      await createTestProject(userId2, `User2 Project ${testRunId}`);

      const result1 = await projectService.findAllByUserId(userId1);
      const result2 = await projectService.findAllByUserId(userId2);

      expect(result1.length).toBe(1);
      expect(result2.length).toBe(1);
      expect(result1[0].ownerId).toBe(userId1);
      expect(result2[0].ownerId).toBe(userId2);
      expect(result1[0].id).not.toBe(result2[0].id);
    });
  });

  describe('findById', () => {
    it('should return project by ID', async () => {
      const userId = await createTestUser('findbyid-valid');
      const createdProject = await createTestProject(
        userId,
        `Find By ID Project ${testRunId}`,
        'Test description'
      );

      const result = await projectService.findById(createdProject.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(createdProject.id);
      expect(result.name).toBe(`Find By ID Project ${testRunId}`);
      expect(result.description).toBe('Test description');
      expect(result.ownerId).toBe(userId);
    });

    it('should throw AppError with 404 for non-existent ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(projectService.findById(nonExistentId)).rejects.toThrow(AppError);

      try {
        await projectService.findById(nonExistentId);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
        expect((error as AppError).error).toBe('NotFound');
      }
    });

    it('should throw AppError with 404 for invalid UUID format', async () => {
      await expect(projectService.findById('invalid-uuid')).rejects.toThrow(AppError);

      try {
        await projectService.findById('invalid-uuid');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
      }
    });

    it('should validate ownership when requested', async () => {
      const userId1 = await createTestUser('findbyid-owner-1');
      const userId2 = await createTestUser('findbyid-owner-2');

      const project = await createTestProject(userId1, `Owned Project ${testRunId}`);

      // Should succeed for owner
      const result = await projectService.findById(project.id, userId1);
      expect(result.id).toBe(project.id);

      // Should throw for non-owner
      await expect(projectService.findById(project.id, userId2)).rejects.toThrow(AppError);

      try {
        await projectService.findById(project.id, userId2);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(403);
        expect((error as AppError).error).toBe('Forbidden');
      }
    });
  });

  describe('updateProject', () => {
    it('should update project name', async () => {
      const userId = await createTestUser('update-name');
      const project = await createTestProject(userId, `Original Name ${testRunId}`, 'Original description');

      const result = await projectService.updateProject(project.id, userId, {
        name: `Updated Name ${testRunId}`,
      });

      expect(result.id).toBe(project.id);
      expect(result.name).toBe(`Updated Name ${testRunId}`);
      expect(result.description).toBe('Original description');
    });

    it('should update project description', async () => {
      const userId = await createTestUser('update-desc');
      const project = await createTestProject(userId, `Project ${testRunId}`, 'Original description');

      const result = await projectService.updateProject(project.id, userId, {
        description: 'Updated description',
      });

      expect(result.id).toBe(project.id);
      expect(result.name).toBe(`Project ${testRunId}`);
      expect(result.description).toBe('Updated description');
    });

    it('should update both name and description', async () => {
      const userId = await createTestUser('update-both');
      const project = await createTestProject(userId, `Original ${testRunId}`, 'Original description');

      const result = await projectService.updateProject(project.id, userId, {
        name: `Updated ${testRunId}`,
        description: 'Updated description',
      });

      expect(result.name).toBe(`Updated ${testRunId}`);
      expect(result.description).toBe('Updated description');
    });

    it('should update updatedAt timestamp', async () => {
      const userId = await createTestUser('update-timestamp');
      const project = await createTestProject(userId, `Project ${testRunId}`);

      const originalUpdatedAt = project.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await projectService.updateProject(project.id, userId, {
        name: `Updated ${testRunId}`,
      });

      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should throw AppError with 404 for non-existent project', async () => {
      const userId = await createTestUser('update-notfound');

      await expect(
        projectService.updateProject('00000000-0000-0000-0000-000000000000', userId, {
          name: 'Updated',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError with 403 when user does not own project', async () => {
      const ownerUserId = await createTestUser('update-owner');
      const otherUserId = await createTestUser('update-other');

      const project = await createTestProject(ownerUserId, `Protected Project ${testRunId}`);

      await expect(
        projectService.updateProject(project.id, otherUserId, { name: 'Hacked' })
      ).rejects.toThrow(AppError);

      try {
        await projectService.updateProject(project.id, otherUserId, { name: 'Hacked' });
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(403);
      }
    });

    it('should reject empty name', async () => {
      const userId = await createTestUser('update-empty-name');
      const project = await createTestProject(userId, `Project ${testRunId}`);

      await expect(projectService.updateProject(project.id, userId, { name: '' })).rejects.toThrow();
    });

    it('should reject name exceeding max length', async () => {
      const userId = await createTestUser('update-long-name');
      const project = await createTestProject(userId, `Project ${testRunId}`);

      await expect(
        projectService.updateProject(project.id, userId, { name: 'a'.repeat(300) })
      ).rejects.toThrow();
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const userId = await createTestUser('delete-valid');
      const project = await createTestProject(userId, `Delete Project ${testRunId}`);

      await projectService.deleteProject(project.id, userId);

      // Verify project is deleted
      await expect(projectService.findById(project.id)).rejects.toThrow(AppError);
    });

    it('should throw AppError with 404 for non-existent project', async () => {
      const userId = await createTestUser('delete-notfound');

      await expect(
        projectService.deleteProject('00000000-0000-0000-0000-000000000000', userId)
      ).rejects.toThrow(AppError);
    });

    it('should throw AppError with 403 when user does not own project', async () => {
      const ownerUserId = await createTestUser('delete-owner');
      const otherUserId = await createTestUser('delete-other');

      const project = await createTestProject(ownerUserId, `Protected Delete ${testRunId}`);

      await expect(projectService.deleteProject(project.id, otherUserId)).rejects.toThrow(AppError);

      try {
        await projectService.deleteProject(project.id, otherUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(403);
      }

      // Verify project still exists
      const result = await projectService.findById(project.id);
      expect(result.id).toBe(project.id);
    });
  });

  describe('validateOwnership', () => {
    it('should return true for valid owner', async () => {
      const userId = await createTestUser('ownership-valid');
      const project = await createTestProject(userId, `Ownership Project ${testRunId}`);

      const result = await projectService.validateOwnership(project.id, userId);
      expect(result).toBe(true);
    });

    it('should return false for non-owner', async () => {
      const ownerUserId = await createTestUser('ownership-owner');
      const otherUserId = await createTestUser('ownership-other');

      const project = await createTestProject(ownerUserId, `Ownership Check ${testRunId}`);

      const result = await projectService.validateOwnership(project.id, otherUserId);
      expect(result).toBe(false);
    });

    it('should return false for non-existent project', async () => {
      const userId = await createTestUser('ownership-notfound');

      const result = await projectService.validateOwnership(
        '00000000-0000-0000-0000-000000000000',
        userId
      );
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in project name', async () => {
      const userId = await createTestUser('special-chars');
      const specialName = `Project <>&"' ${testRunId}`;

      const result = await projectService.createProject({
        name: specialName,
        ownerId: userId,
      });

      expect(result.name).toBe(specialName);
    });

    it('should handle unicode characters in project name', async () => {
      const userId = await createTestUser('unicode');
      const unicodeName = `Project 日本語 🚀 ${testRunId}`;

      const result = await projectService.createProject({
        name: unicodeName,
        ownerId: userId,
      });

      expect(result.name).toBe(unicodeName);
    });

    it('should handle very long description', async () => {
      const userId = await createTestUser('long-desc');
      const longDescription = 'a'.repeat(10000);

      const result = await projectService.createProject({
        name: `Project ${testRunId}`,
        description: longDescription,
        ownerId: userId,
      });

      expect(result.description).toBe(longDescription);
    });

    it('should handle null description', async () => {
      const userId = await createTestUser('null-desc');

      const result = await projectService.createProject({
        name: `Project ${testRunId}`,
        description: null,
        ownerId: userId,
      });

      expect(result.description).toBeNull();
    });
  });
});
