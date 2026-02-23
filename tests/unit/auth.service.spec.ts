import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'type orm';
import { AuthService } from '@/src/services/auth.service';
import { UserService } from '@/src/services/user.service';
import { User } from '@/src/models/user.entity';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

/**
 * Unit tests для AuthService
 * Тестируют JWT генерацию и логику аутентификации
 */
describe('AuthService Unit Tests', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    login: 'test@example.com',
    passwordHash: '$2b$12$abcdefghijklmnopqrstuvwxyz0123456789',
    failedLoginAttempts: 0,
    lockedUntil: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        save: jest.fn(),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByLogin: jest.fn(),
            create: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            lockAccount: jest.fn(),
            resetFailedAttempts: jest.fn(),
            setRefreshToken: jest.fn(),
            removeRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('T026: JWT генерация', () => {
    it('должен генерировать access токен при логине', async () => {
      const loginDto = { login: 'test@example.com', password: 'Password123' };

      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('access_token_123');

      const result = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        login: mockUser.login,
      });
      expect(result.accessToken).toBe('access_token_123');
    });

    it('должен генерировать refresh токен при логине', async () => {
      const loginDto = { login: 'test@example.com', password: 'Password123' };

      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const result = await service.login(loginDto);

      expect(result.refreshToken).toBe('refresh_token');
      expect(userService.setRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String)
      );
    });

    it('должен включать sub (user id) в JWT payload', async () => {
      const loginDto = { login: 'test@example.com', password: 'Password123' };

      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
        })
      );
    });

    it('должен включать login в JWT payload', async () => {
      const loginDto = { login: 'test@example.com', password: 'Password123' };

      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          login: mockUser.login,
        })
      );
    });

    it('должен генерировать токен с истечением (expiry)', async () => {
      const loginDto = { login: 'test@example.com', password: 'Password123' };

      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await service.login(loginDto);

      // Access токен: 1 час (3600 секунд)
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          login: mockUser.login,
        }),
        expect.objectContaining({
          expiresIn: '1h',
        })
      );
    });

    it('должен генерировать refresh токен с истечением 30 дней', async () => {
      const loginDto = { login: 'test@example.com', password: 'Password123' };

      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await service.login(loginDto);

      // Refresh токен: 30 дней
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(jwtService.sign).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          type: 'refresh',
        }),
        expect.objectContaining({
          expiresIn: '30d',
        })
      );
    });
  });

  describe('Валидация пароля', () => {
    it('должен сравнивать хеш пароля с bcrypt', async () => {
      const loginDto = { login: 'test@example.com', password: 'Password123' };

      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      await service.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash
      );
    });

    it('должен вернуть ошибку при неверном пароле', async () => {
      const loginDto = { login: 'test@example.com', password: 'WrongPassword' };

      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Refresh токен', () => {
    it('должен валидировать refresh токен', async () => {
      const refreshTokenDto = { refreshToken: 'valid_refresh_token' };

      const payload = { sub: mockUser.id, login: mockUser.login, type: 'refresh' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new_access_token');

      await service.refresh(refreshTokenDto);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });

    it('должен генерировать новый access токен при refresh', async () => {
      const refreshTokenDto = { refreshToken: 'valid_refresh_token' };

      const payload = { sub: mockUser.id, login: mockUser.login, type: 'refresh' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign').mockReturnValue('new_access_token');

      const result = await service.refresh(refreshTokenDto);

      expect(result.accessToken).toBe('new_access_token');
    });

    it('должен ротировать refresh токен при обновлении', async () => {
      const refreshTokenDto = { refreshToken: 'old_refresh_token' };

      const payload = { sub: mockUser.id, login: mockUser.login, type: 'refresh' };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payload);
      jest.spyOn(userService, 'findByLogin').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce('new_access_token')
        .mockReturnValueOnce('new_refresh_token');

      const result = await service.refresh(refreshTokenDto);

      expect(result.refreshToken).toBe('new_refresh_token');
      expect(userService.setRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'new_refresh_token'
      );
    });
  });

  describe('Logout', () => {
    it('должен удалять refresh токен из БД', async () => {
      const logoutDto = { refreshToken: 'valid_token', userId: mockUser.id };

      jest.spyOn(userService, 'removeRefreshToken').mockResolvedValue(undefined);

      await service.logout(logoutDto);

      expect(userService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
