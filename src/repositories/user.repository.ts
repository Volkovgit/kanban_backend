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
   * T031: Найти пользователя по логину
   * @param login - Логин пользователя
   * @returns User или null если не найден
   */
  async findByLogin(login: string): Promise<User | null> {
    return this.repository.findOne({
      where: { login } as FindOptionsWhere<User>,
      cache: false, // Отключаем кеш для немедленной консистентности
    });
  }

  /**
   * T031: Найти пользователя по логину или выбросить ошибку
   * @param login - Логин пользователя
   * @returns User
   * @throws Error если пользователь не найден
   */
  async findByLoginOrThrow(login: string): Promise<User> {
    const user = await this.findByLogin(login);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    return user;
  }

  /**
   * T031: Проверить существует ли логин
   * @param login - Логин для проверки
   * @returns True если логин существует, иначе false
   */
  async loginExists(login: string): Promise<boolean> {
    return this.exists({ login } as FindOptionsWhere<User>);
  }

  /**
   * T031: Увеличить счётчик неудачных попыток входа
   * @param userId - ID пользователя
   * @returns Обновлённый пользователь
   */
  async incrementFailedAttempts(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Блокируем аккаунт после 5 неудачных попыток
    if (user.failedLoginAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15); // 15 минут
      user.lockedUntil = lockUntil;
    }

    return this.repository.save(user);
  }

  /**
   * T031: Заблокировать аккаунт
   * @param userId - ID пользователя
   * @param lockUntil - Дата разблокировки (null для разблокировки)
   * @returns Обновлённый пользователь
   */
  async lockAccount(userId: string, lockUntil: Date): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    user.lockedUntil = lockUntil;
    return this.repository.save(user);
  }

  /**
   * T031: Сбросить счётчик неудачных попыток
   * @param userId - ID пользователя
   * @returns Обновлённый пользователь
   */
  async resetFailedAttempts(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    return this.repository.save(user);
  }

  /**
   * T031: Установить refresh токен
   * @param userId - ID пользователя
   * @param refreshToken - Refresh токен (хешированный)
   * @returns Обновлённый пользователь
   */
  async setRefreshToken(userId: string, refreshToken: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    user.refreshToken = refreshToken;
    return this.repository.save(user);
  }

  /**
   * T031: Удалить refresh токен
   * @param userId - ID пользователя
   * @returns Обновлённый пользователь
   */
  async removeRefreshToken(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    user.refreshToken = null;
    return this.repository.save(user);
  }

  /**
   * Найти пользователя по refresh токену
   * @param refreshToken - Refresh токен
   * @returns User или null если не найден
   */
  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.repository.findOne({
      where: { refreshToken } as FindOptionsWhere<User>,
      cache: false,
    });
  }

  // ========== Backward compatibility methods (для старого кода) ==========

  /**
   * Find user by email (deprecated, используйте findByLogin)
   * @deprecated Используйте findByLogin вместо этого метода
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findByLogin(email);
  }

  /**
   * Check if email exists (deprecated, используйте loginExists)
   * @deprecated Используйте loginExists вместо этого метода
   */
  async emailExists(email: string): Promise<boolean> {
    return this.loginExists(email);
  }

  /**
   * Create user with password (deprecated)
   * @deprecated Используйте UserService.create вместо этого метода
   */
  async createWithPassword(login: string, passwordHash: string): Promise<User> {
    return this.create({
      login,
      passwordHash,
    });
  }
}

export default UserRepository;
