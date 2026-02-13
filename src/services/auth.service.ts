/**
 * Authentication Service
 *
 * Handles user authentication: registration, login, token generation and refresh.
 * Uses bcrypt for password hashing and JWT for tokens.
 */

import { UserRepository } from '../repositories/user.repository';
import { UserService } from './user.service';
import { RegisterDto, LoginDto, AuthResponseDto, TokenResponseDto } from '../dto/auth.dto';
import { AppError } from '../middleware/error-handler';
import * as jwtConfig from '../config/jwt';

/**
 * Authentication service
 */
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private userService: UserService,
  ) {}

  /**
   * Register a new user
   * @param registerDto - Registration data
   * @returns Auth response with tokens and user data
   * @throws AppError if email already exists
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password } = registerDto;

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);

      if (existingUser) {
        throw new AppError(
          409,
          'User with this email already exists',
          'Conflict'
        );
      }

      // Hash password
      const passwordHash = await jwtConfig.hashPassword(password);

      // Create user
      const user = await this.userRepository.createWithPassword(email, passwordHash);

      // Generate tokens
      const tokens = jwtConfig.generateTokenPair(user.id, user.email);

      // Return auth response
      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      // Handle database unique constraint violation
      if (error instanceof Error && 'code' in error && error.code === '23505') {
        throw new AppError(
          409,
          'User with this email already exists',
          'Conflict'
        );
      }
      throw error;
    }
  }

  /**
   * Login user
   * @param loginDto - Login data
   * @returns Auth response with tokens and user data
   * @throws AppError if credentials are invalid
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AppError(
        401,
        'Invalid email or password',
        'Unauthorized'
      );
    }

    // Verify password
    const isPasswordValid = await jwtConfig.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(
        401,
        'Invalid email or password',
        'Unauthorized'
      );
    }

    // Generate tokens
    const tokens = jwtConfig.generateTokenPair(user.id, user.email);

    // Return auth response
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * Implements refresh token rotation: issues new access token AND new refresh token
   * @param refreshToken - Refresh token
   * @returns New access token and new refresh token (rotation)
   * @throws AppError if refresh token is invalid
   */
  async refreshToken(refreshToken: string): Promise<TokenResponseDto & { refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = jwtConfig.verifyRefreshToken(refreshToken);

      // Get user to ensure they still exist
      const user = await this.userService.getById(payload.userId);

      // Generate new access token
      const accessToken = jwtConfig.generateAccessToken(user.id, user.email);
      const expiresIn = jwtConfig.getAccessTokenExpirationTime();

      // Generate new refresh token (rotation)
      const newRefreshToken = jwtConfig.generateRefreshToken(user.id, user.email);

      // TODO: Implement refresh token blacklist/invalidation
      // The old refresh token should be invalidated to prevent replay attacks
      // This can be done with:
      // 1. A Redis/DB store of blacklisted tokens
      // 2. Adding a token version/rotation counter to the user entity
      // 3. Storing issued refresh tokens and checking against them

      return {
        accessToken,
        expiresIn,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError(
        401,
        'Invalid or expired refresh token',
        'Unauthorized'
      );
    }
  }

  /**
   * Validate user access token
   * @param token - JWT access token
   * @returns User ID and email from token
   * @throws AppError if token is invalid
   */
  validateToken(token: string): { userId: string; email: string } {
    try {
      const payload = jwtConfig.verifyAccessToken(token);
      return {
        userId: payload.userId,
        email: payload.email,
      };
    } catch (error) {
      throw new AppError(
        401,
        'Invalid or expired access token',
        'Unauthorized'
      );
    }
  }
}

export default AuthService;
