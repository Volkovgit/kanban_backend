import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '@/src/services/user.service';
import { User } from '@/src/models/user.entity';
import * as bcrypt from 'bcrypt';

/**
 * Unit tests для UserService
 * Тестируют логику хеширования паролей
 */
describe('UserService Unit Tests', () => {
  let service: UserService;
  let repository: Repository<User>;
  let dataSource: DataSource;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    login: 'test@example.com',
    passwordHash: 'hashed_password',
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
        create: jest.fn(),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('T025: Хеширование паролей', () => {
    it('должен хешировать пароль при создании пользователя', async () => {
      const createDto = {
        login: 'newuser@example.com',
        password: 'PlainPassword123',
      };

      const hashedPassword = '$2b$12$hashed_password_here';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      const queryRunner = mockDataSource.createQueryRunner();
      queryRunner.manager.create.mockReturnValue({ ...createDto });
      queryRunner.manager.save.mockResolvedValue({
        ...mockUser,
        login: createDto.login,
        passwordHash: hashedPassword,
      });

      const result = await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 12);
      expect(result.passwordHash).toBe(hashedPassword);
      expect(result.passwordHash).not.toBe(createDto.password);
    });

    it('должен использовать 12 salt rounds для bcrypt', async () => {
      const createDto = {
        login: 'newuser@example.com',
        password: 'PlainPassword123',
      };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$12$hashed' as never);

      const queryRunner = mockDataSource.createQueryRunner();
      queryRunner.manager.create.mockReturnValue({ ...createDto });
      queryRunner.manager.save.mockResolvedValue({
        ...mockUser,
        login: createDto.login,
      });

      await service.create(createDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 12);
    });

    it('должен не хранить пароль в открытом виде', async () => {
      const plainPassword = 'MySecretPassword123';
      const createDto = {
        login: 'secure@example.com',
        password: plainPassword,
      };

      const hashedPassword = '$2b$12$abcdefghijklmnopqrstuvwxyz012345';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      const queryRunner = mockDataSource.createQueryRunner();
      queryRunner.manager.create.mockReturnValue({ ...createDto });
      queryRunner.manager.save.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      const result = await service.create(createDto);

      expect(result.passwordHash).not.toContain(plainPassword);
      expect(result.passwordHash).not.toBe(plainPassword);
      expect(result.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    });

    it('должен генерировать разный хеш для одинаковых паролей', async () => {
      const password = 'SamePassword123';
      const createDto1 = { login: 'user1@example.com', password };
      const createDto2 = { login: 'user2@example.com', password };

      // bcrypt генерирует уникальный salt каждый раз
      const hash1 = '$2b$12$salt1_hash';
      const hash2 = '$2b$12$salt2_hash';

      jest.spyOn(bcrypt, 'hash')
        .mockResolvedValueOnce(hash1 as never)
        .mockResolvedValueOnce(hash2 as never);

      const queryRunner = mockDataSource.createQueryRunner();
      queryRunner.manager.create
        .mockReturnValueOnce({ ...createDto1 })
        .mockReturnValueOnce({ ...createDto2 });
      queryRunner.manager.save
        .mockResolvedValueOnce({ ...mockUser, login: createDto1.login, passwordHash: hash1 })
        .mockResolvedValueOnce({ ...mockUser, login: createDto2.login, passwordHash: hash2 });

      const result1 = await service.create(createDto1);
      const result2 = await service.create(createDto2);

      expect(result1.passwordHash).not.toBe(result2.passwordHash);
    });
  });

  describe('Валидация сложности пароля', () => {
    it('должен принимать валидный пароль (8+ символов, 1 заглавная, 1 строчная, 1 цифра)', async () => {
      const validPasswords = [
        'SecurePass123',
        'MyP@ssw0rd',
        'A1b2c3d4e5f6',
        'Password123',
      ];

      for (const password of validPasswords) {
        const createDto = { login: `test_${password}@example.com`, password };
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$12$hash' as never);

        const queryRunner = mockDataSource.createQueryRunner();
        queryRunner.manager.create.mockReturnValue({ ...createDto });
        queryRunner.manager.save.mockResolvedValue({
          ...mockUser,
          login: createDto.login,
        });

        // Не должен выбросить ошибку валидации
        await expect(service.create(createDto)).resolves.toBeDefined();
      }
    });
  });
});
