/**
 * T033: Authentication Service
 *
 * Обрабатывает аутентификацию пользователей: регистрация, логин, refresh токен и logout.
 * Использует bcrypt для хеширования паролей и JWT для токенов.
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { User } from '../models/user.entity';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { RefreshTokenDto } from '../dto/auth/refresh-token.dto';
import {
  AuthResponseDto,
  RegisterResponseDto,
} from '../dto/auth/auth-response.dto';
import * as bcrypt from 'bcrypt';

/**
 * T033: Сервис аутентификации
 */
@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '1h'; // 1 час
  private readonly REFRESH_TOKEN_EXPIRY = '30d'; // 30 дней
  private readonly LOCK_DURATION_MINUTES = 15;

  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  /**
   * T033: Регистрация нового пользователя
   * @param registerDto - Данные регистрации (login, password)
   * @returns Данные созданного пользователя
   * @throws ConflictException если пользователь уже существует
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { login, password } = registerDto;

    // Проверяем что пользователь не существует
    const existingUser = await this.userService.findByLogin(login);
    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким логином уже существует'
      );
    }

    // Создаём пользователя (пароль хешируется в UserService)
    const user = await this.userService.create({ login, password });

    return {
      id: user.id,
      login: user.login,
    };
  }

  /**
   * T033: Вход в систему
   * Проверяет блокировку аккаунта, валидирует пароль, генерирует JWT токены
   * @param loginDto - Данные для входа (login, password)
   * @returns Access и refresh токены
   * @throws UnauthorizedException если креденшалы невалидны или аккаунт заблокирован
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { login, password } = loginDto;

    // Находим пользователя
    const user = await this.userService.findByLogin(login);
    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // T033: Проверяем блокировку аккаунта
    const now = new Date();
    if (user.lockedUntil && new Date(user.lockedUntil) > now) {
      throw new UnauthorizedException(
        `Аккаунт заблокирован до ${new Date(user.lockedUntil).toLocaleString()}`
      );
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Увеличиваем счётчик неудачных попыток
      await this.userService.incrementFailedAttempts(user.id);

      // Проверяем нужно ли заблокировать
      const updatedUser = await this.userService.findByLogin(login);
      if (
        updatedUser &&
        updatedUser.lockedUntil &&
        new Date(updatedUser.lockedUntil) > now
      ) {
        throw new UnauthorizedException(
          `Аккаунт заблокирован после 5 неудачных попыток на ${this.LOCK_DURATION_MINUTES} минут`
        );
      }

      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Сбрасываем счётчик неудачных попыток при успешном входе
    await this.userService.resetFailedAttempts(user.id);

    // Генерируем токены
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Сохраняем refresh токен в БД
    await this.userService.setRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * T033: Обновление access токена
   * Валидирует refresh токен и генерирует новую пару токенов (ротация)
   * @param refreshTokenDto - Refresh токен
   * @returns Новая пара access и refresh токенов
   * @throws UnauthorizedException если токен невалиден
   */
  async refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Верифицируем refresh токен
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // Проверяем что это именно refresh токен
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Невалидный refresh токен');
      }

      // Находим пользователя
      const user = await this.userService.findByLogin(payload.login);
      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      // T033: Проверяем что refresh токен совпадает с сохранённым в БД
      const isTokenValid = await this.userService.verifyRefreshToken(
        user.id,
        refreshToken
      );
      if (!isTokenValid) {
        throw new UnauthorizedException('Невалидный refresh токен');
      }

      // Генерируем новую пару токенов (ротация)
      const newAccessToken = await this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user);

      // Обновляем refresh токен в БД
      await this.userService.setRefreshToken(user.id, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Невалидный или просроченный refresh токен'
      );
    }
  }

  /**
   * T033: Выход из системы
   * Удаляет refresh токен из БД (инвалидирует его)
   * @param logoutDto - Данные для выхода (refreshToken, userId)
   */
  async logout(logoutDto: {
    refreshToken: string;
    userId: string;
  }): Promise<void> {
    const { refreshToken, userId } = logoutDto;

    try {
      // Верифицируем токен
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // Проверяем что userId совпадает
      if (payload.sub !== userId) {
        throw new UnauthorizedException('Невалидный токен');
      }

      // T033: Удаляем refresh токен из БД
      await this.userService.removeRefreshToken(userId);
    } catch (error) {
      // Игнорируем ошибки при logout - токен уже мог быть удалён
      // Это позволяет безопасно логаутиться даже с просроченным токеном
    }
  }

  /**
   * T033: Проверить заблокирован ли аккаунт
   * @param user - Пользователь для проверки
   * @returns True если аккаунт заблокирован
   */
  verifyAccountLock(user: User): boolean {
    if (!user.lockedUntil) {
      return false;
    }

    // Проверяем истекла ли блокировка
    const now = new Date();
    const lockExpiry = new Date(user.lockedUntil);

    if (now > lockExpiry) {
      // Блокировка истекла - можно разблокировать
      return false;
    }

    return true;
  }

  /**
   * Сгенерировать access токен
   * @param user - Пользователь
   * @returns JWT access токен
   */
  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      login: user.login,
      // Добавляем уникальный идентификатор для каждого токена
      jti: `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Сгенерировать refresh токен
   * @param user - Пользователь
   * @returns JWT refresh токен
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      login: user.login,
      type: 'refresh' as const,
      // Добавляем уникальный идентификатор для каждого токена
      jti: `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });
  }

  /**
   * Верифицировать access токен
   * @param token - JWT токен
   * @returns Payload токена
   */
  async verifyAccessToken(
    token: string
  ): Promise<{ sub: string; login: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return {
        sub: payload.sub,
        login: payload.login,
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Невалидный или просроченный access токен'
      );
    }
  }
}

export default AuthService;
