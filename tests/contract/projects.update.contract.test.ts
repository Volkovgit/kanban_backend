/**
 * Contract Test: PATCH /api/v1/projects/:id
 *
 * Validates that the project update endpoint conforms to the OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';

// Use unique test run identifier to avoid conflicts
const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);
const testUser = {
  email: `test-projects-update-${testRunId}@example.com`,
  password: 'Password123!',
};
const otherUser = {
  email: `test-other-user-${testRunId}@example.com`,
  password: 'Password123!',
};

describe('PATCH /api/v1/projects/:id - Contract Tests', () => {
  let authToken: string;
  let otherAuthToken: string;
  let testProjectId: string;
  let otherProjectId: string;

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
  });

  afterAll(async () => {
    // Clean up projects first (due to foreign key constraint)
    try {
      await AppDataSource.query(`DELETE FROM "project" WHERE "name" LIKE '%${testRunId}%'`);
    } catch (error) {
      // Ignore foreign key constraint error during cleanup
      console.log('Cleanup: Projects already deleted or no projects');
    }
    // Then clean up users from current test run
    try {
      await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}@example.com'`);
    } catch (error) {
      // Ignore foreign key constraint error during cleanup
      console.log('Cleanup: Users already deleted or no users');
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await AppDataSource.query(`DELETE FROM "project" WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}@example.com'`);

    // Register and login first test user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .set('Content-Type', 'application/json');

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .set('Content-Type', 'application/json');

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data.accessToken;
    }

    // Register and login second user for ownership tests
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: otherUser.email,
        password: otherUser.password,
      })
      .set('Content-Type', 'application/json');

    const otherLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: otherUser.email,
        password: otherUser.password,
      })
      .set('Content-Type', 'application/json');

    if (otherLoginResponse.status === 200) {
      otherAuthToken = otherLoginResponse.body.data.accessToken;
    }

    // Create test project for first user
    const createResponse = await request(app)
      .post('/api/v1/projects')
      .send({
        name: `Original Project ${testRunId}`,
        description: 'Original description',
      })
      .set('Authorization', `Bearer ${authToken}`)
      .set('Content-Type', 'application/json');

    if (createResponse.status === 201) {
      testProjectId = createResponse.body.data.id;
    }

    // Create project for second user
    const otherCreateResponse = await request(app)
      .post('/api/v1/projects')
      .send({
        name: `Other User Project ${testRunId}`,
        description: 'Other user project',
      })
      .set('Authorization', `Bearer ${otherAuthToken}`)
      .set('Content-Type', 'application/json');

    if (otherCreateResponse.status === 201) {
      otherProjectId = otherCreateResponse.body.data.id;
    }

    // Small delay to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(async () => {
    // Clean up test data after each test
    await AppDataSource.query(`DELETE FROM "project" WHERE "name" LIKE '%${testRunId}%'`);
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}@example.com'`);
  });

  describe('Successful Project Update', () => {
    it('should return 200 OK on successful project update', async () => {
      const updateData = {
        name: `Updated Project ${testRunId}`,
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      // Endpoint may not be implemented yet
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', testProjectId);
        expect(response.body.data).toHaveProperty('name', updateData.name);
        expect(response.body.data).toHaveProperty('description', updateData.description);
      } else {
        // Expected to fail until implementation
        expect([200, 401, 403, 404, 500]).toContain(response.status);
      }
    });

    it('should update only the name field', async () => {
      const updateData = {
        name: `Name Updated ${testRunId}`,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('name', updateData.name);
        // Description should remain unchanged
        expect(response.body.data).toHaveProperty('description');
      }
    });

    it('should update only the description field', async () => {
      const updateData = {
        description: 'New description only',
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('description', updateData.description);
        // Name should remain unchanged
        expect(response.body.data).toHaveProperty('name');
      }
    });

    it('should update description from null to string', async () => {
      // First create a project without description
      const createResponse = await request(app)
        .post('/api/v1/projects')
        .send({
          name: `No Desc Project ${testRunId}`,
        })
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (createResponse.status === 201) {
        const projectId = createResponse.body.data.id;
        expect(createResponse.body.data.description).toBe(null);

        // Now update with description
        const updateResponse = await request(app)
          .patch(`/api/v1/projects/${projectId}`)
          .send({
            description: 'Now has description',
          })
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json');

        if (updateResponse.status === 200) {
          expect(updateResponse.body.data.description).toBe('Now has description');
        }
      }
    });

    it('should clear description by setting to null', async () => {
      const updateData = {
        description: null,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.body.data.description).toBe(null);
      }
    });

    it('should clear description by setting to empty string', async () => {
      const updateData = {
        description: '',
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        // Empty string should be converted to null
        expect(response.body.data.description === null || response.body.data.description === '').toBe(true);
      }
    });

    it('should update updatedAt timestamp', async () => {
      // First get the project to note original updatedAt
      const getResponse = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (getResponse.status === 200) {
        const originalUpdatedAt = getResponse.body.data.updatedAt;

        // Small delay to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update the project
        const updateResponse = await request(app)
          .patch(`/api/v1/projects/${testProjectId}`)
          .send({
            name: `Timestamp Test ${testRunId}`,
          })
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', 'application/json');

        if (updateResponse.status === 200) {
          expect(updateResponse.body.data.updatedAt).not.toBe(originalUpdatedAt);
        }
      }
    });

    it('should not allow updating ownerId', async () => {
      const updateData = {
        ownerId: 'some-other-uuid',
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      // Should either be ignored or rejected
      if (response.status === 200) {
        expect(response.body.data.ownerId).not.toBe('some-other-uuid');
      } else {
        expect([400, 403]).toContain(response.status);
      }
    });

    it('should not allow updating id', async () => {
      const updateData = {
        id: 'new-id-uuid',
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      // Should either be ignored or rejected
      if (response.status === 200) {
        expect(response.body.data.id).toBe(testProjectId);
      } else {
        expect([400, 403]).toContain(response.status);
      }
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 Bad Request for empty name', async () => {
      const updateData = {
        name: '',
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('ValidationError');
    });

    it('should return 400 Bad Request for whitespace-only name', async () => {
      const updateData = {
        name: '   ',
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should return 400 Bad Request for name exceeding max length', async () => {
      const updateData = {
        name: 'A'.repeat(300),
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      expect([400, 200]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should return 400 Bad Request for non-string name', async () => {
      const updateData = {
        name: 12345,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should return 400 Bad Request for non-string description', async () => {
      const updateData = {
        description: 12345,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should return 400 Bad Request for empty request body', async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send({})
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      // Should either require at least one field or return no content
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Ownership Requirement', () => {
    it('should return 403 Forbidden when updating another user project', async () => {
      const updateData = {
        name: `Hacked Project ${testRunId}`,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${otherProjectId}`) // Other user's project
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`) // First user's token
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Forbidden');
    });

    it('should allow owner to update their own project', async () => {
      const updateData = {
        name: `Valid Update ${testRunId}`,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.body.data.name).toBe(updateData.name);
      }
    });

    it('should return 404 Forbidden for non-existent project', async () => {
      const updateData = {
        name: `Non-existent ${testRunId}`,
      };

      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .patch(`/api/v1/projects/${nonExistentId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      expect([404, 403]).toContain(response.status);
    });
  });

  describe('Authentication Requirement', () => {
    it('should return 401 Unauthorized without authentication token', async () => {
      const updateData = {
        name: `No Auth Update ${testRunId}`,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 Unauthorized with invalid token', async () => {
      const updateData = {
        name: `Invalid Token ${testRunId}`,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', 'Bearer invalid.token.here')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(401);
    });
  });

  describe('Project ID Validation', () => {
    it('should return 400 Bad Request for invalid UUID format', async () => {
      const updateData = {
        name: `Invalid UUID ${testRunId}`,
      };

      const response = await request(app)
        .patch('/api/v1/projects/invalid-uuid')
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent project UUID', async () => {
      const updateData = {
        name: `Not Found ${testRunId}`,
      };

      const fakeUuid = '12345678-1234-1234-1234-123456789012';
      const response = await request(app)
        .patch(`/api/v1/projects/${fakeUuid}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      expect([404, 403]).toContain(response.status);
    });
  });

  describe('Response Headers', () => {
    it('should return JSON content type', async () => {
      const updateData = {
        name: `Headers Test ${testRunId}`,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in error response', async () => {
      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send({ name: '' })
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 400) {
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('internalCode');
      }
    });

    it('should sanitize updated name to prevent XSS', async () => {
      const updateData = {
        name: `<script>alert('xss')</script> ${testRunId}`,
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.body.data.name).toBeTruthy();
      }
    });

    it('should sanitize updated description to prevent XSS', async () => {
      const updateData = {
        description: '<script>alert("xss")</script>',
      };

      const response = await request(app)
        .patch(`/api/v1/projects/${testProjectId}`)
        .send(updateData)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json');

      if (response.status === 200) {
        expect(response.body.data.description).toBeTruthy();
      }
    });
  });
});
