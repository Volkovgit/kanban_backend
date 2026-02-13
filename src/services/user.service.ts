/**
 * User Service
 *
 * Business logic for user operations.
 */

import { UserRepository } from '../repositories/user.repository';
import { User } from '../models/user.entity';
import { comparePassword, hashPassword } from '../config/jwt';
import { instanceToPlain } from 'class-transformer';

/**
 * User service
 */
export class UserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Get user by ID (excludes passwordHash)
   * @param id - User ID
   * @returns User without password hash
   * @throws AppError if user not found
   */
  async getById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    // Use instanceToPlain to apply @Exclude decorator
    return instanceToPlain(user) as User;
  }

  /**
   * Get user by email
   * @param email - User email
   * @returns User or null if not found
   */
  async getByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Get all users as array (excludes passwordHash)
   * @returns Array of users without password hashes
   */
  async getAll(): Promise<User[]> {
    const result = await this.userRepository.findAll();
    // Use instanceToPlain to apply @Exclude decorator
    return instanceToPlain(result.data) as User[];
  }

  /**
   * Check if user exists by email
   * @param email - User email
   * @returns true if user exists, false otherwise
   */
  async exists(email: string): Promise<boolean> {
    return this.userRepository.emailExists(email);
  }

  /**
   * Create a new user with password
   * @param email - User email
   * @param password - Plain text password
   * @returns Created user without password hash
   */
  async create(email: string, password: string): Promise<User> {
    const passwordHash = await hashPassword(password);
    return this.userRepository.createWithPassword(email, passwordHash);
  }

  /**
   * Update user by ID
   * @param id - User ID
   * @param data - Partial user data to update
   * @returns Updated user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    // Check if updating email and if it conflicts with existing user
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('User with this email already exists');
      }
    }
    return this.userRepository.update(id, data);
  }

  /**
   * Delete user by ID
   * @param id - User ID
   */
  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  /**
   * Verify password against user's password hash
   * @param user - User object
   * @param password - Plain text password to verify
   * @returns true if password matches, false otherwise
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) {
      return false;
    }
    return comparePassword(password, user.passwordHash);
  }

  /**
   * Validate user ownership
   * @param resourceId - ID of user who owns the resource
   * @param userId - ID of currently authenticated user
   * @throws AppError if user doesn't own the resource
   */
  async validateOwnership(resourceId: string, userId: string): Promise<void> {
    if (resourceId !== userId) {
      throw new Error('You do not have permission to access this resource');
    }
  }
}

export default UserService;
