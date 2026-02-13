/**
 * User Repository
 *
 * Handles database operations for User entity.
 * Extends BaseRepository with user-specific methods.
 */

import { DataSource, FindOptionsWhere } from 'typeorm';
import { User } from '../models/user.entity';
import { BaseRepository } from './base.repository';

/**
 * User repository with specialized queries
 */
export class UserRepository extends BaseRepository<User> {
  constructor(dataSource: DataSource) {
    super(dataSource, User);
  }

  /**
   * Find user by email
   * @param email - User email address
   * @returns User or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email } as FindOptionsWhere<User>,
      cache: false, // Disable query cache for immediate consistency
    });
  }

  /**
   * Find user by email or throw error
   * @param email - User email address
   * @returns User
   * @throws Error if user not found
   */
  async findByEmailOrThrow(email: string): Promise<User> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Check if email is already registered
   * @param email - Email to check
   * @returns True if email exists, false otherwise
   */
  async emailExists(email: string): Promise<boolean> {
    return this.exists({ email } as FindOptionsWhere<User>);
  }

  /**
   * Create a new user
   * @param email - User email
   * @param passwordHash - Bcrypt hash of password
   * @returns Created user
   */
  async createWithPassword(email: string, passwordHash: string): Promise<User> {
    return this.create({
      email,
      passwordHash,
    });
  }
}

export default UserRepository;
