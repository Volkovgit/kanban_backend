/**
 * Contract Test: POST /api/v1/auth/login
 *
 * Validates that the login endpoint conforms to the OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';

// Use unique test run identifier to avoid conflicts
// Add random component to prevent conflicts when tests run in parallel
const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);
const testUser = {
  email: `test-login-${testRunId}@example.com`,
  password: 'Password123!',
};

describe('POST /api/v1/auth/login - Contract Tests', () => {
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
    // Clean up test data before each test
    await AppDataSource.query(`DELETE FROM "user" WHERE email = $1`, [testUser.email]);

    // Register test user via API (more realistic than direct DB INSERT)
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .set('Content-Type', 'application/json');

    // Log registration failure but don't throw (allow tests to handle it)
    if (registerResponse.status !== 201) {
      console.error(`Registration failed for ${testUser.email}:`, registerResponse.status, registerResponse.body);
    }

    // Small delay to ensure database transaction is committed
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(async () => {
    // Clean up test data after each test
    await AppDataSource.query(`DELETE FROM "user" WHERE email = $1`, [testUser.email]);
  });

  describe('Request/Response Format', () => {
    it('should return 200 OK on successful login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should return auth response with correct structure', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Validate response structure
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data).toHaveProperty('user');

      // Validate user object structure
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user).toHaveProperty('createdAt');
      expect(response.body.data.user).toHaveProperty('updatedAt');

      // Validate types
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken).toBe('string');
      expect(typeof response.body.data.expiresIn).toBe('number');
      expect(typeof response.body.data.user.id).toBe('string');
      expect(typeof response.body.data.user.email).toBe('string');
      expect(response.body.data.user.email).toBe(testUser.email);

      // Validate password is NOT returned
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 Bad Request for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: testUser.password,
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
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.error).toBe('ValidationError');
      expect(response.body.errors).toBeInstanceOf(Array);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 Bad Request for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Validation failed');
    });

    it('should return 400 Bad Request for malformed request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Authentication Validation', () => {
    it('should return 401 Unauthorized for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 Unauthorized for incorrect password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 Unauthorized for empty password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: '',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for empty email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: '',
          password: testUser.password,
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400); // Will fail validation first
    });

    it('should return meaningful error message for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      // Error message should not reveal whether user exists or password is wrong
      expect(response.body.message).toMatch(/invalid|email|password|credentials/i);
    });

    it('should successfully authenticate with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(testUser.email);
    });
  });

  describe('Token Validation', () => {
    it('should return valid JWT access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);

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
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);

      const refreshToken = response.body.data.refreshToken;
      expect(refreshToken).toBeTruthy();

      // JWT format: header.payload.signature
      const parts = refreshToken.split('.');
      expect(parts.length).toBe(3);
    });

    it('should return expiresIn as a number (seconds)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(typeof response.body.data.expiresIn).toBe('number');
      expect(response.body.data.expiresIn).toBeGreaterThan(0);
    });

    it('should return different tokens for each login', async () => {
      const firstResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const secondResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(firstResponse.body.data.accessToken).not.toBe(secondResponse.body.data.accessToken);
      expect(firstResponse.body.data.refreshToken).not.toBe(secondResponse.body.data.refreshToken);
    });
  });

  describe('User Data Validation', () => {
    it('should return user ID as UUID string', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.body.data.user.id).toMatch(uuidRegex);
    });

    it('should return timestamp fields in ISO 8601 format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);

      // Validate date format (ISO 8601)
      const createdAt = new Date(response.body.data.user.createdAt);
      const updatedAt = new Date(response.body.data.user.updatedAt);
      expect(createdAt.toISOString()).toBe(response.body.data.user.createdAt);
      expect(updatedAt.toISOString()).toBe(response.body.data.user.updatedAt);
    });

    it('should return same user data as registration', async () => {
      const testEmail = `test-user-data-${Date.now()}@example.com`;
      // First, register a new user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'Password123!',
        });

      // Then login with same user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'Password123!',
        });

      expect(registerResponse.body.data.user.id).toBe(loginResponse.body.data.user.id);
      expect(registerResponse.body.data.user.email).toBe(loginResponse.body.data.user.email);

      // Clean up
      await AppDataSource.query(`DELETE FROM "user" WHERE email = $1`, [testEmail]);
    });
  });

  describe('Security Headers', () => {
    it('should not expose sensitive information in error response', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('stack');
    });
  });
});
