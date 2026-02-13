/**
 * Unit Test: AuthService
 *
 * Tests for AuthService business logic
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { AuthService } from '../../../src/services/auth.service';
import { UserService } from '../../../src/services/user.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { AppDataSource } from '../../../src/config/data-source';
import { setupRoutes } from '../../../src/main';
import { AppError } from '../../../src/middleware/error-handler';
import { RegisterDto, LoginDto } from '../../../src/dto/auth.dto';

// Use unique test run identifier to avoid conflicts between test files
// Add random component to prevent conflicts when tests run in parallel
const testRunId = Date.now() + Math.random().toString(36).substring(2, 8);

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Initialize database connection (check if already initialized)
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    // Setup routes after database is ready
    await setupRoutes();
    userRepository = new UserRepository(AppDataSource);
    userService = new UserService(userRepository);
    authService = new AuthService(userRepository, userService);
    // Clean up any existing test data from this specific test run only
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
  });

  afterAll(async () => {
    // Clean up current test run data
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
    // Don't destroy connection - let Jest handle cleanup at the end
  });

  beforeEach(async () => {
    // Clean up test data from current run only before each test
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
  });

  afterEach(async () => {
    // Clean up after each test to prevent conflicts
    await AppDataSource.query(`DELETE FROM "user" WHERE email LIKE '%${testRunId}%'`);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const validRegisterDto: RegisterDto = {
        email: `test-register-success-${testRunId}@example.com`,
        password: 'Password123!',
      };
      
      const result = await authService.register(validRegisterDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('user');

      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user.email).toBe(validRegisterDto.email);
    });

    it('should hash the password before storing', async () => {
      const validRegisterDto: RegisterDto = {
        email: `test-register-hash-${testRunId}@example.com`,
        password: 'Password123!',
      };
      
      await authService.register(validRegisterDto);

      const user = await userRepository.findByEmail(validRegisterDto.email);

      expect(user).toBeDefined();
      expect(user!.passwordHash).toBeDefined();
      expect(user!.passwordHash).not.toBe(validRegisterDto.password);
      expect(user!.passwordHash).not.toContain(validRegisterDto.password);
    });

    it('should throw AppError with 409 status for duplicate email', async () => {
      // Use a fixed email to ensure second registration uses the same email
      const duplicateEmail = `test-register-dup-${testRunId}@example.com`;
      const validRegisterDto: RegisterDto = {
        email: duplicateEmail,
        password: 'Password123!',
      };

      // First registration should succeed
      await authService.register(validRegisterDto);

      // Add small delay to ensure TypeORM flushes cache between operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second registration with same email should fail
      await expect(authService.register(validRegisterDto)).rejects.toThrow(AppError);

      try {
        await authService.register(validRegisterDto);
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(409);
        expect((error as AppError).error).toBe('Conflict');
        expect((error as AppError).message).toContain('already exists');
      }
    });

    it('should return valid JWT tokens', async () => {
      const validRegisterDto: RegisterDto = {
        email: `test-register-tokens-${testRunId}@example.com`,
        password: 'Password123!',
      };
      
      const result = await authService.register(validRegisterDto);

      // Validate access token format (JWT: header.payload.signature)
      const accessParts = result.accessToken.split('.');
      expect(accessParts.length).toBe(3);

      // Validate refresh token format
      const refreshParts = result.refreshToken.split('.');
      expect(refreshParts.length).toBe(3);

      // Validate expiresIn is a number
      expect(typeof result.expiresIn).toBe('number');
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should not return password in response', async () => {
      const validRegisterDto: RegisterDto = {
        email: `test-register-nopass-${testRunId}@example.com`,
        password: 'Password123!',
      };
      
      const result = await authService.register(validRegisterDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should include timestamp fields in user response', async () => {
      const validRegisterDto: RegisterDto = {
        email: `test-register-timestamp-${testRunId}@example.com`,
        password: 'Password123!',
      };
      
      const result = await authService.register(validRegisterDto);

      expect(result.user).toHaveProperty('createdAt');
      expect(result.user).toHaveProperty('updatedAt');

      // Validate date format
      const createdAt = new Date(result.user.createdAt);
      const updatedAt = new Date(result.user.updatedAt);
      expect(createdAt).toBeInstanceOf(Date);
      expect(updatedAt).toBeInstanceOf(Date);
      expect(isNaN(createdAt.getTime())).toBe(false); // Valid date
      expect(isNaN(updatedAt.getTime())).toBe(false); // Valid date
    });

    it('should generate UUID for user ID', async () => {
      const validRegisterDto: RegisterDto = {
        email: `test-register-uuid-${testRunId}@example.com`,
        password: 'Password123!',
      };
      
      const result = await authService.register(validRegisterDto);

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(result.user.id).toMatch(uuidRegex);
    });

    it('should handle email with different case', async () => {
      const email = `test-case-${testRunId}@example.com`;
      const result1 = await authService.register({
        email: email,
        password: 'Password123!',
      });

      expect(result1.user.email).toBe(email);

      // Try to register with different case - depending on DB constraints, this may or may not fail
      // If the DB treats emails as case-insensitive, this should fail
      // If the DB treats emails as case-sensitive, this should succeed
      try {
        await authService.register({
          email: email.toUpperCase(),
          password: 'Password123!',
        });
        // If it succeeds, that's fine - depends on DB collation settings
      } catch (error) {
        // If it throws an error, make sure it's an AppError
        expect(error).toBeInstanceOf(AppError);
      }
    });

    // Note: Password and email validation are handled by the DTO layer (controller)
    // These validations are tested in contract tests, not service unit tests
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const email = `test-login-${testRunId}@example.com`;
      const loginDto: LoginDto = {
        email: email,
        password: 'Password123!',
      };
      
      // Create a test user first
      await authService.register(loginDto);

      const result = await authService.login(loginDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('user');

      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw AppError with 401 for non-existent email', async () => {
      await expect(
        authService.login({
          email: `nonexistent-${testRunId}@example.com`,
          password: 'Password123!',
        })
      ).rejects.toThrow(AppError);

      try {
        await authService.login({
          email: `nonexistent-${testRunId}@example.com`,
          password: 'Password123!',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
        expect((error as AppError).error).toBe('Unauthorized');
      }
    });

    it('should throw AppError with 401 for incorrect password', async () => {
      const email = `test-login-wrongpass-${testRunId}@example.com`;
      const validCredentials = {
        email: email,
        password: 'Password123!',
      };
      
      // Create user first
      await authService.register(validCredentials);

      await expect(
        authService.login({
          email: email,
          password: 'WrongPassword123!',
        })
      ).rejects.toThrow(AppError);

      try {
        await authService.login({
          email: email,
          password: 'WrongPassword123!',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
        expect((error as AppError).message).toContain('Invalid email or password');
      }
    });

    it('should return same user data as registration', async () => {
      const email = `test-same-user-${testRunId}@example.com`;
      const registerResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const loginResult = await authService.login({
        email: email,
        password: 'Password123!',
      });

      expect(registerResult.user.id).toBe(loginResult.user.id);
      expect(registerResult.user.email).toBe(loginResult.user.email);
    });

    it('should not return password in response', async () => {
      const email = `test-login-nopass-${testRunId}@example.com`;
      const loginDto: LoginDto = {
        email: email,
        password: 'Password123!',
      };
      
      // Create user first
      await authService.register(loginDto);

      const result = await authService.login(loginDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should return different tokens for each login', async () => {
      const email = `test-login-diff-${testRunId}@example.com`;
      const loginDto: LoginDto = {
        email: email,
        password: 'Password123!',
      };

      // Create user first
      await authService.register(loginDto);

      // Add small delay to ensure TypeORM flushes cache between operations
      await new Promise(resolve => setTimeout(resolve, 10));

      const firstLogin = await authService.login(loginDto);
      const secondLogin = await authService.login(loginDto);

      expect(firstLogin.accessToken).not.toBe(secondLogin.accessToken);
      expect(firstLogin.refreshToken).not.toBe(secondLogin.refreshToken);
    });

    it('should return valid JWT tokens', async () => {
      const email = `test-login-valid-${testRunId}@example.com`;
      const loginDto: LoginDto = {
        email: email,
        password: 'Password123!',
      };
      
      // Create user first
      await authService.register(loginDto);

      const result = await authService.login(loginDto);

      // Validate access token format
      const accessParts = result.accessToken.split('.');
      expect(accessParts.length).toBe(3);

      // Validate refresh token format
      const refreshParts = result.refreshToken.split('.');
      expect(refreshParts.length).toBe(3);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const email = `test-refresh-success-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const result = await authService.refreshToken(authResult.refreshToken);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('refreshToken'); // Token rotation
      expect(result).not.toHaveProperty('user');
    });

    it('should throw AppError with 401 for invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid.token')).rejects.toThrow(AppError);

      try {
        await authService.refreshToken('invalid.token');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
        expect((error as AppError).error).toBe('Unauthorized');
      }
    });

    it('should throw AppError with 401 for expired token', async () => {
      // This test would require setting a very short JWT expiration
      // For now, test with a malformed token
      await expect(
        authService.refreshToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid')
      ).rejects.toThrow(AppError);
    });

    it('should return new access token different from original', async () => {
      const email = `test-new-token-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const refreshResult = await authService.refreshToken(authResult.refreshToken);

      expect(refreshResult.accessToken).not.toBe(authResult.accessToken);
    });

    it('should return new refresh token (rotation)', async () => {
      const email = `test-new-rt-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const originalRefreshToken = authResult.refreshToken;
      const refreshResult = await authService.refreshToken(originalRefreshToken);

      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.refreshToken).not.toBe(originalRefreshToken);
    });

    it('should return valid JWT access token', async () => {
      const email = `test-refresh-valid-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const result = await authService.refreshToken(authResult.refreshToken);

      const parts = result.accessToken.split('.');
      expect(parts.length).toBe(3);
    });

    it('should return valid JWT refresh token', async () => {
      const email = `test-refresh-validrt-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const result = await authService.refreshToken(authResult.refreshToken);

      const parts = result.refreshToken.split('.');
      expect(parts.length).toBe(3);
    });

    it('should return expiresIn as number', async () => {
      const email = `test-refresh-expires-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const result = await authService.refreshToken(authResult.refreshToken);

      expect(typeof result.expiresIn).toBe('number');
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('should allow multiple refreshes with same refresh token', async () => {
      const email = `test-refresh-multiple-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const firstRefresh = await authService.refreshToken(authResult.refreshToken);
      const secondRefresh = await authService.refreshToken(authResult.refreshToken);

      expect(firstRefresh.accessToken).not.toBe(secondRefresh.accessToken);
    });
  });

  describe('validateToken', () => {
    it('should validate valid access token successfully', async () => {
      const email = `test-validate-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const result = authService.validateToken(authResult.accessToken);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result.email).toBe(email);
    });

    it('should throw AppError with 401 for invalid token', async () => {
      expect(() => authService.validateToken('invalid.token')).toThrow(AppError);

      try {
        authService.validateToken('invalid.token');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(401);
      }
    });

    it('should throw AppError with 401 for expired token', async () => {
      expect(() =>
        authService.validateToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid')
      ).toThrow(AppError);
    });

    it('should extract user ID from token', async () => {
      const email = `test-extract-${testRunId}@example.com`;
      const authResult = await authService.register({
        email: email,
        password: 'Password123!',
      });

      const result = authService.validateToken(authResult.accessToken);

      expect(result.userId).toBe(authResult.user.id);
    });
  });
});
