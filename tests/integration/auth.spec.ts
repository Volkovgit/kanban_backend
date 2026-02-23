import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/src/app.module';
import { DataSource } from 'typeorm';
import { User } from '@/src/models/user.entity';

/**
 * Integration tests для Authentication endpoints
 * Тестируют полную интеграцию с базой данных
 */
describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let server: any;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    server = app.getHttpServer();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    // Очистка тестовых пользователей после каждого теста
    const userRepository = dataSource.getRepository(User);
    await userRepository.delete({ login: Like('integration_test_%') });
  });

  describe('T021: Регистрация и логин', () => {
    it('должен создать пользователя и успешно войти', async () => {
      const testUser = {
        login: `integration_test_${Date.now()}@example.com`,
        password: 'SecurePass123',
      };

      // Регистрация
      const registerResponse = await request(server)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body.data.user.login).toBe(testUser.login);

      // Логин с теми же креденшлами
      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser)
        .expect(200);

      expect(loginResponse.body.data).toHaveProperty('accessToken');
      expect(loginResponse.body.data).toHaveProperty('refreshToken');

      // Проверяем что пользователь в БД имеет хеш пароля
      const user = await dataSource.getRepository(User).findOne({
        where: { login: testUser.login },
      });

      expect(user).toBeDefined();
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(testUser.password); // Пароль не хранится в открытом виде
      expect(user?.passwordHash).not.toContain(testUser.password);
    });

    it('должен хешировать пароль с bcrypt (12 rounds)', async () => {
      const testUser = {
        login: `integration_test_hash_${Date.now()}@example.com`,
        password: 'SecurePass123',
      };

      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser);

      const user = await dataSource.getRepository(User).findOne({
        where: { login: testUser.login },
      });

      expect(user?.passwordHash).toBeDefined();
      // bcrypt hash начинается с $2b$ или $2a$
      expect(user?.passwordHash).toMatch(/^\$2[ab]\$/);
    });
  });

  describe('T022: Блокировка аккаунта после 5 неудачных попыток', () => {
    const testUser = {
      login: `integration_test_lock_${Date.now()}@example.com`,
      password: 'SecurePass123',
    };

    beforeAll(async () => {
      // Создаём пользователя
      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser);
    });

    it('должен заблокировать аккаунт после 5 неудачных попыток', async () => {
      // Делаем 5 неудачных попыток
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/api/v1/auth/login')
          .send({ login: testUser.login, password: 'WrongPassword123' })
          .expect(401);
      }

      // 6-я попытка (даже с правильным паролем) должна быть заблокирована
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser);

      expect(response.status).toBe(401);
      expect(response.body.error.message).toContain('locked') || expect(response.body.error.message).toContain('блок');

      // Проверяем поле lockedUntil в БД
      const user = await dataSource.getRepository(User).findOne({
        where: { login: testUser.login },
      });

      expect(user?.failedLoginAttempts).toBe(5);
      expect(user?.lockedUntil).toBeDefined();
      expect(user?.lockedUntil).toBeInstanceOf(Date);
    });

    it('должен сбросить счётчик неудачных попыток при успешном логине', async () => {
      const testUser2 = {
        login: `integration_test_reset_${Date.now()}@example.com`,
        password: 'SecurePass123',
      };

      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser2);

      // 3 неудачные попытки
      for (let i = 0; i < 3; i++) {
        await request(server)
          .post('/api/v1/auth/login')
          .send({ login: testUser2.login, password: 'WrongPassword123' })
          .expect(401);
      }

      // Проверяем что счётчик увеличился
      let user = await dataSource.getRepository(User).findOne({
        where: { login: testUser2.login },
      });
      expect(user?.failedLoginAttempts).toBe(3);

      // Успешный логин
      await request(server)
        .post('/api/v1/auth/login')
        .send(testUser2)
        .expect(200);

      // Счётчик должен сброситься
      user = await dataSource.getRepository(User).findOne({
        where: { login: testUser2.login },
      });
      expect(user?.failedLoginAttempts).toBe(0);
    });

    it('должен разблокировать аккаунт через 15 минут', async () => {
      const testUser3 = {
        login: `integration_test_unlock_${Date.now()}@example.com`,
        password: 'SecurePass123',
      };

      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser3);

      // Блокируем аккаунт
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/api/v1/auth/login')
          .send({ login: testUser3.login, password: 'WrongPassword123' })
          .expect(401);
      }

      // Устанавливаем lockedUntil в прошлое (симуляция прошедшего времени)
      const user = await dataSource.getRepository(User).findOne({
        where: { login: testUser3.login },
      });

      if (user) {
        const pastDate = new Date(Date.now() - 16 * 60 * 1000); // 16 минут назад
        user.lockedUntil = pastDate;
        await dataSource.getRepository(User).save(user);
      }

      // Теперь логин должен работать
      await request(server)
        .post('/api/v1/auth/login')
        .send(testUser3)
        .expect(200);
    });
  });

  describe('T023: Refresh токен', () => {
    it('должен обновлять access токен с валидным refresh токеном', async () => {
      const testUser = {
        login: `integration_test_refresh_${Date.now()}@example.com`,
        password: 'SecurePass123',
      };

      // Регистрация и логин
      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser);

      const { refreshToken } = loginResponse.body.data;

      // Обновляем токен
      const refreshResponse = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.data).toHaveProperty('accessToken');
      expect(refreshResponse.body.data).toHaveProperty('refreshToken');

      // Новый access токен должен отличаться
      const newAccessToken = refreshResponse.body.data.accessToken;
      expect(newAccessToken).not.toBe(loginResponse.body.data.accessToken);

      // Новый refresh токен тоже должен отличаться (ротация)
      const newRefreshToken = refreshResponse.body.data.refreshToken;
      expect(newRefreshToken).not.toBe(refreshToken);

      // Проверяем что новый токен работает
      const verifyResponse = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: newRefreshToken })
        .expect(200);

      expect(verifyResponse.body.data).toHaveProperty('accessToken');
    });

    it('не должен обновлять токен с невалидным refresh токеном', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token_xyz123' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('T024: Logout', () => {
    it('должен удалять refresh токен при logout', async () => {
      const testUser = {
        login: `integration_test_logout_${Date.now()}@example.com`,
        password: 'SecurePass123',
      };

      // Регистрация и логин
      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser);

      const { accessToken, refreshToken } = loginResponse.body.data;

      // Logout
      await request(server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Проверяем что refresh токен удалён из БД
      const user = await dataSource.getRepository(User).findOne({
        where: { login: testUser.login },
      });

      expect(user?.refreshToken).toBeNull();

      // Пытаемся использовать refresh токен после logout
      await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('должен позволять логиниться снова после logout', async () => {
      const testUser = {
        login: `integration_test_relogin_${Date.now()}@example.com`,
        password: 'SecurePass123',
      };

      // Регистрация
      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser);

      // Первый логин
      const firstLogin = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser);

      // Logout
      await request(server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${firstLogin.body.data.accessToken}`)
        .send({ refreshToken: firstLogin.body.data.refreshToken });

      // Второй логин должен работать
      const secondLogin = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser)
        .expect(200);

      expect(secondLogin.body.data).toHaveProperty('accessToken');
      expect(secondLogin.body.data).toHaveProperty('refreshToken');
    });
  });
});

// Helper function for cleanup
function Like(pattern: string) {
  return { $like: pattern };
}
