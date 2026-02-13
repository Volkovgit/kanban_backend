/**
 * JWT Configuration
 *
 * Configures JSON Web Token authentication for user sessions.
 * Provides token generation, verification, and refresh utilities.
 */

import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  jti?: string; // JWT ID for uniqueness
  iat?: number;
  exp?: number;
}

/**
 * Token pair interface (access and refresh tokens)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * Generate a unique JWT ID
 */
function generateJti(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate an access token for a user
 */
export function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, jti: generateJti() },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

/**
 * Generate a refresh token for a user
 */
export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, jti: generateJti() },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, email: string): TokenPair {
  const accessToken = generateAccessToken(userId, email);
  const refreshToken = generateRefreshToken(userId, email);
  const expiresIn = getAccessTokenExpirationTime();

  return { accessToken, refreshToken, expiresIn };
}

/**
 * Verify and decode an access token
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify and decode a refresh token
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Get access token expiration time in seconds
 */
export function getAccessTokenExpirationTime(): number {
  // Parse the expiresIn string (e.g., '1h', '30m', '1d')
  const match = JWT_EXPIRES_IN.match(/^(\d+)([hmsd])$/);
  if (!match) {
    // Default to 1 hour (3600 seconds)
    return 3600;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 3600;
  }
}

/**
 * Extract token from Authorization header
 * @returns Token string or null if not found
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Decode token without verification (for getting expiration time, etc.)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  getAccessTokenExpirationTime,
  extractTokenFromHeader,
  decodeToken,
};
