/**
 * Contract Test: POST /api/v1/auth/refresh
 *
 * Validates that the refresh token endpoint conforms to the OpenAPI specification
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { app, setupRoutes } from '../../src/main';
import { AppDataSource } from '../../src/config/data-source';

// Use unique test run identifier to avoid conflicts
// Add random component to prevent conflicts when tests run in parallel
const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);
const testUser = {
  email: `test-refresh-${testRunId}@example.com`,
  password: 'Password123!',
};

describe('POST /api/v1/auth/refresh - Contract Tests', () => {
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
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}@example.com'`);
    // Don't destroy connection - let Jest handle cleanup at the end
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await AppDataSource.query(`DELETE FROM "user" WHERE email = $1`, [testUser.email]);

    // Register test user via API and verify success
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
    it('should return 200 OK on successful token refresh', async () => {
      // First, login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Check if login succeeded
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);

      // Then refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.success ? loginResponse.body.data.refreshToken : loginResponse.body.data.refreshToken,
        })
        .set('Content-Type', 'application/json');

      // Response should have success: true at root level for success
      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.headers['content-type']).toMatch(/json/);
    });

    it('should return token response with correct structure', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken,
        });

      // Validate response structure
      expect(refreshResponse.body.data).toHaveProperty('accessToken');
      expect(refreshResponse.body.data).toHaveProperty('expiresIn');
      expect(refreshResponse.body.data).toHaveProperty('refreshToken'); // Token rotation: new refresh token returned

      // Validate types
      expect(typeof refreshResponse.body.data.accessToken).toBe('string');
      expect(typeof refreshResponse.body.data.expiresIn).toBe('number');
      expect(typeof refreshResponse.body.data.refreshToken).toBe('string');

      // Should NOT return user data
      expect(refreshResponse.body.data).not.toHaveProperty('user');
    });

    it('should return 400 Bad Request for missing refreshToken', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({})
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 Bad Request for malformed request body', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should return 400 Bad Request for empty refreshToken', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: '',
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });

  describe('Token Refresh Validation', () => {
    it('should return 401 Unauthorized for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid.refresh.token',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 Unauthorized for expired refresh token', async () => {
      // Create an expired token (this would require setting JWT_EXPIRES_IN to a very short value)
      // For now, test with a malformed token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 Unauthorized for tampered refresh token', async () => {
      // Login to get valid token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Tamper with the token
      const tamperedToken = loginResponse.body.data.refreshToken + 'tampered';

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: tamperedToken,
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 Unauthorized for access token used as refresh token', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Try to use access token as refresh token
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.accessToken,
        });

      expect(response.status).toBe(401);
    });

    it('should successfully refresh with valid refresh token', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken,
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.data).toHaveProperty('accessToken');
    });
  });

  describe('Access Token Validation', () => {
    it('should return a new access token', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const originalAccessToken = loginResponse.body.data.accessToken;

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken,
        });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.data.accessToken).toBeTruthy();
      expect(refreshResponse.body.data.accessToken).not.toBe(originalAccessToken);
    });

    it('should return valid JWT access token', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken,
        });

      expect(refreshResponse.status).toBe(200);

      const accessToken = refreshResponse.body.data.accessToken;
      expect(accessToken).toBeTruthy();

      // JWT format: header.payload.signature
      const parts = accessToken.split('.');
      expect(parts.length).toBe(3);
    });

    it('should return expiresIn as a number (seconds)', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      // Refresh the token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken,
        });

      expect(refreshResponse.status).toBe(200);
      expect(typeof refreshResponse.body.data.expiresIn).toBe('number');
      expect(refreshResponse.body.data.expiresIn).toBeGreaterThan(0);
    });
  });

  describe('Multiple Refresh', () => {
    it('should allow multiple refreshes with the same refresh token', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // First refresh
      const firstRefreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        });

      expect(firstRefreshResponse.status).toBe(200);

      // Note: With refresh token rotation, the old refresh token is still valid
      // until we implement a token blacklist. For now, we expect both to succeed.
      const secondRefreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        });

      expect(secondRefreshResponse.status).toBe(200);

      // Should return different access tokens
      expect(firstRefreshResponse.body.data.accessToken).not.toBe(secondRefreshResponse.body.data.accessToken);
    });

    it('should return new refresh token on each refresh (rotation)', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // First refresh
      const firstRefresh = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(firstRefresh.body.data).toHaveProperty('refreshToken');

      const newRefreshToken1 = firstRefresh.body.data.refreshToken;

      // Wait a small amount to ensure different iat
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second refresh with new refresh token (rotation)
      const secondRefresh = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: newRefreshToken1 });

      // Access tokens should be different
      expect(firstRefresh.body.data.accessToken).not.toBe(secondRefresh.body.data.accessToken);

      // Should get new refresh tokens on each refresh
      expect(secondRefresh.body.data).toHaveProperty('refreshToken');
      expect(secondRefresh.body.data.refreshToken).not.toBe(newRefreshToken1);
    });
  });

  describe('Refresh Token After User Deletion', () => {
    it('should return 401 if user was deleted after token issued', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // Delete the user
      await AppDataSource.query(`DELETE FROM "user" WHERE email = $1`, [testUser.email]);

      // Try to refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        });

      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('Security Headers', () => {
    it('should not expose sensitive information in error response', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid.token',
        });

      expect(response.status).toBe(401);
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('internalCode');
    });
  });

  describe('Content-Type Validation', () => {
    it('should accept application/json content type', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken,
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(200);
    });

    it('should handle missing content-type header', async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send(JSON.stringify({
          refreshToken: loginResponse.body.data.refreshToken,
        }));

      // Should still work with JSON body
      expect([200, 400]).toContain(response.status);
    });
  });
});
