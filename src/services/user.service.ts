/**
 * User Service
 *
 * Business logic for user operations.
 */

import { UserRepository } from '../repositories/user.repository';
import { User } from '../models/user.entity';
import { comparePassword } from '../config/jwt';
import * as bcrypt from 'bcrypt';
import { instanceToPlain } from 'class-transformer';

/**
 * T032: User service с поддержкой аутентификации
 */
export class UserService {
  // T032: Используем 12 salt rounds для bcrypt (согласно требованиям безопасности)
  private readonly BCRYPT_SALT_ROUNDS = 12;

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
   * T032: Найти пользователя по логину
   * @param login - Логин пользователя
   * @returns User или null если не найден
   */
  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findByLogin(login);
  }

  /**
   * T032: Создать нового пользователя с bcrypt хешированием пароля (12 rounds)
   * @param createDto - Данные для создания пользователя (login, password)
   * @returns Созданный пользователь без пароля
   */
  async create(createDto: { login: string; password: string }): Promise<User> {
    const { login, password } = createDto;

    // Проверяем что логин уникален
    const existingUser = await this.userRepository.findByLogin(login);
    if (existingUser) {
      throw new Error('Пользователь с таким логином уже существует');
    }

    // T032: Хешируем пароль с bcrypt (12 rounds)
    const passwordHash = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);

    // Создаём пользователя
    const user = await this.userRepository.create({
      login,
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      refreshToken: null,
    });

    // Возвращаем пользователя без хеша пароля
    return instanceToPlain(user) as User;
  }

  /**
   * T032: Увеличить счётчик неудачных попыток входа
   * @param userId - ID пользователя
   */
  async incrementFailedAttempts(userId: string): Promise<void> {
    await this.userRepository.incrementFailedAttempts(userId);
  }

  /**
   * T032: Заблокировать аккаунт
   * @param userId - ID пользователя
   * @param lockUntil - Дата разблокировки (null для разблокировки)
   */
  async lockAccount(userId: string, lockUntil: Date | null): Promise<void> {
    if (lockUntil) {
      await this.userRepository.lockAccount(userId, lockUntil);
    } else {
      // Разблокировка - сбрасываем lockedUntil и failedLoginAttempts
      await this.userRepository.resetFailedAttempts(userId);
    }
  }

  /**
   * T032: Сбросить счётчик неудачных попыток (после успешного входа)
   * @param userId - ID пользователя
   */
  async resetFailedAttempts(userId: string): Promise<void> {
    await this.userRepository.resetFailedAttempts(userId);
  }

  /**
   * T032: Установить refresh токен
   * @param userId - ID пользователя
   * @param refreshToken - Refresh токен (не хешированный, будет хеширован)
   */
  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // Хешируем refresh токен перед сохранением
    const hashedToken = await bcrypt.hash(refreshToken, this.BCRYPT_SALT_ROUNDS);
    await this.userRepository.setRefreshToken(userId, hashedToken);
  }

  /**
   * T032: Удалить refresh токен (logout)
   * @param userId - ID пользователя
   */
  async removeRefreshToken(userId: string): Promise<void> {
    await this.userRepository.removeRefreshToken(userId);
  }

  /**
   * T032: Проверить валидность refresh токена
   * @param userId - ID пользователя
   * @param refreshToken - Refresh токен для проверки
   * @returns True если токен валиден
   */
  async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.refreshToken) {
      return false;
    }

    // Сравниваем хешированный токен
    return bcrypt.compare(refreshToken, user.refreshToken);
  }

  // ========== Существующие методы (backward compatibility) ==========
  /**
   * Check if user exists by email
   * @param email - User email
   * @returns true if user exists, false otherwise
   */
  async exists(email: string): Promise<boolean> {
    return this.userRepository.loginExists(email);
  }

  /**
   * Update user by ID
   * @param id - User ID
   * @param data - Partial user data to update
   * @returns Updated user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    // Check if updating login and if it conflicts with existing user
    if (data.login) {
      const existingUser = await this.userRepository.findByLogin(data.login);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Пользователь с таким логином уже существует');
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
