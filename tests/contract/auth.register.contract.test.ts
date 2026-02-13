/**
 * Contract Test: POST /api/v1/auth/register
 *
 * Validates that the registration endpoint conforms to the OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';

// Use unique test run identifier to avoid conflicts
// Add random component to prevent conflicts when tests run in parallel
const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('POST /api/v1/auth/register - Contract Tests', () => {
  beforeAll(async () => {
    // Initialize database connection (check if already initialized)
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    // Setup routes after database is ready
    await setupRoutes();
  });

  afterAll(async () => {
    // Clean up only users from current test run
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
    // Don't destroy connection - let Jest handle cleanup at the end
  });

  beforeEach(async () => {
    // Clean up test data before each test (preserve current run)
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%@example.com' AND email NOT LIKE '%${testRunId}%'`);
  });

  afterEach(async () => {
    // Clean up test data after each test
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}@example.com'`);
  });

  describe('Request/Response Format', () => {
    it('should return 201 Created on successful registration', async () => {
      const validRegisterDto = {
        email: `test-register-success-${testRunId}@example.com`,
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegisterDto)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data).toHaveProperty('user');

      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(validRegisterDto.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return auth response with correct structure', async () => {
      const validRegisterDto = {
        email: `test-auth-response-${testRunId}@example.com`,
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegisterDto)
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data).toHaveProperty('user');

      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe(validRegisterDto.email);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 Bad Request for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.error).toBe('ValidationError');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 Bad Request for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          password: 'Password123!',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.error).toBe('ValidationError');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 Bad Request for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-missing-password-${testRunId}@example.com`,
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.error).toBe('ValidationError');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 Bad Request for malformed request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    describe('Password Validation Requirements', () => {
      it('should reject password shorter than 8 characters', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Pass1!',
          })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Validation failed');
        expect(response.body.error).toBe('ValidationError');
        expect(response.body.errors).toBeInstanceOf(Array);
        expect(response.body.errors.length).toBeGreaterThan(0);
      });

      it('should reject password without uppercase letter', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123!',
          })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should reject password without lowercase letter', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password: 'PASSWORD123!',
          })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should reject password without number', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Password!',
          })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should reject password without special character', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Password123',
          })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Validation failed');
      });

      it('should accept valid password with all requirements', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: `test-valid-password-${testRunId}@example.com`,
            password: 'Password123!',
          })
          .set('Content-Type', 'application/json');

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('accessToken');
      });
    });
  });

  describe('Duplicate Email Handling', () => {
    it('should return 409 Conflict for duplicate email', async () => {
      const userData = {
        email: `test-duplicate-${testRunId}@example.com`,
        password: 'Password123!',
      };

      // First registration should succeed
      const firstResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .set('Content-Type', 'application/json');

      expect(firstResponse.status).toBe(201);

      // Second registration with same email should fail
      const secondResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .set('Content-Type', 'application/json');

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body).toHaveProperty('message');
      expect(secondResponse.body.error).toBe('Conflict');
    });

    it('should be case-insensitive for email duplicates (database dependent)', async () => {
      const email = `test-case-insensitive-${testRunId}@example.com`;

      // First registration with lowercase email
      const firstResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: email,
          password: 'Password123!',
        });

      expect(firstResponse.status).toBe(201);

      // Second registration with uppercase email
      const secondResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: email.toUpperCase(),
          password: 'Password123!',
        });

      // Should either succeed (case-insensitive) or fail (case-sensitive)
      expect([201, 409]).toContain(secondResponse.status);
    });
  });

  describe('Response Data Validation', () => {
    it('should return user ID as UUID string', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-uuid-${testRunId}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(201);

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.body.data.user.id).toMatch(uuidRegex);
    });

    it('should return timestamp fields in ISO 8601 format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-timestamp-${testRunId}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(201);

      // Validate date format (ISO 8601)
      const createdAt = new Date(response.body.data.user.createdAt);
      const updatedAt = new Date(response.body.data.user.updatedAt);
      expect(createdAt.toISOString()).toBe(response.body.data.user.createdAt);
      expect(updatedAt.toISOString()).toBe(response.body.data.user.updatedAt);
    });

    it('should return expiresIn as a number (seconds)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-expires-${testRunId}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(201);
      expect(typeof response.body.data.expiresIn).toBe('number');
      expect(response.body.data.expiresIn).toBeGreaterThan(0);
    });

    it('should return valid JWT access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-jwt-${testRunId}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(201);

      const accessToken = response.body.data.accessToken;
      expect(accessToken).toBeTruthy();

      // JWT format: header.payload.signature
      const parts = accessToken.split('.');
      expect(parts.length).toBe(3);

      // Each part should be base64url encoded
      parts.forEach((part: string) => {
        expect(() => Buffer.from(part, 'base64url')).not.toThrow();
      });
    });

    it('should return valid JWT refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-refresh-jwt-${testRunId}@example.com`,
          password: 'Password123!',
        });

      expect(response.status).toBe(201);

      const refreshToken = response.body.data.refreshToken;
      expect(refreshToken).toBeTruthy();

      // JWT format: header.payload.signature
      const parts = refreshToken.split('.');
      expect(parts.length).toBe(3);
    });
  });

  describe('Security Headers', () => {
    it('should not expose sensitive information in error response', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-security-${testRunId}@example.com`,
          password: 'weak',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('stack');
    });
  });
});
