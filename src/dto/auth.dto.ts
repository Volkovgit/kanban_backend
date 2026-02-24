/**
 * Authentication Data Transfer Objects
 *
 * DTOs for user registration, login, and authentication responses.
 * Uses class-validator for input validation.
 */

import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

/**
 * Register DTO
 * Validates user registration input
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;
}

/**
 * Login DTO
 * Validates user login input
 */
export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  password!: string;
}

/**
 * Refresh Token DTO
 * Validates refresh token input
 */
export class RefreshTokenDto {
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken!: string;
}

/**
 * Auth Response DTO
 * Response structure for successful authentication
 */
export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserResponseDto;
}

/**
 * User Response DTO
 * Public user information returned in auth response
 */
export interface UserResponseDto {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Token Response DTO
 * Response for token refresh (includes new refresh token for rotation)
 */
export interface TokenResponseDto {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

export default RegisterDto;
