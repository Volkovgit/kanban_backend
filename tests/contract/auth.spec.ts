import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/src/app.module';

/**
 * Contract tests для Authentication endpoints
 * Тестируют API контракт согласно specs/001-kanban/contracts/auth.yaml
 */
describe('Auth Contract Tests', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    const testUser = {
      login: `contract_test_${Date.now()}@example.com`,
      password: 'SecurePass123',
    };

    it('T017: должен вернуть 201 при успешной регистрации', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user).toHaveProperty('login', testUser.login);
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('T017: должен вернуть 400 при невалидном login (менее 3 символов)', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({ login: 'ab', password: 'SecurePass123' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T017: должен вернуть 400 при невалидном пароле (менее 8 символов)', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({ login: 'testuser', password: 'Short1' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T017: должен вернуть 400 при отсутствии обязательных полей', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({ login: 'testuser' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T017: должен вернуть 409 при дубликате login', async () => {
      // Первый запрос должен успешно создать пользователя
      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      // Второй запрос с тем же login должен вернуть 409
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const testUser = {
      login: `login_test_${Date.now()}@example.com`,
      password: 'SecurePass123',
    };

    beforeAll(async () => {
      // Создаём пользователя для тестов логина
      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser);
    });

    it('T018: должен вернуть 200 и токены при успешном логине', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken).toBe('string');
      expect(response.body.data.accessToken.length).toBeGreaterThan(0);
      expect(response.body.data.refreshToken.length).toBeGreaterThan(0);
    });

    it('T018: должен вернуть 400 при невалидных данных', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ login: 'testuser' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T018: должен вернуть 401 при неверном пароле', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ login: testUser.login, password: 'WrongPassword123' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('T018: должен вернуть 401 при несуществующем пользователе', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ login: 'nonexistent@example.com', password: 'SecurePass123' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;
    const testUser = {
      login: `refresh_test_${Date.now()}@example.com`,
      password: 'SecurePass123',
    };

    beforeAll(async () => {
      // Создаём пользователя и получаем токены
      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser);

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('T019: должен вернуть 200 и новый access токен', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(response.body.data.accessToken.length).toBeGreaterThan(0);
    });

    it('T019: должен вернуть новый refresh токен (ротация)', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data).toHaveProperty('refreshToken');
      expect(typeof response.body.data.refreshToken).toBe('string');
      // Новый refresh токен должен отличаться от старого
      expect(response.body.data.refreshToken).not.toBe(refreshToken);
    });

    it('T019: должен вернуть 400 при отсутствии refreshToken', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('T019: должен вернуть 401 при невалидном refreshToken', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid_refresh_token' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;
    const testUser = {
      login: `logout_test_${Date.now()}@example.com`,
      password: 'SecurePass123',
    };

    beforeAll(async () => {
      // Создаём пользователя и получаем токены
      await request(server)
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(server)
        .post('/api/v1/auth/login')
        .send(testUser);

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('T020: должен вернуть 200 при успешном logout', async () => {
      const response = await request(server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('T020: должен вернуть 401 без токена авторизации', async () => {
      const response = await request(server)
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T020: должен вернуть 401 при невалидном токене', async () => {
      const response = await request(server)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid_token')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('T020: должен инвалидировать refresh токен (после logout refresh не работает)', async () => {
      // Сначала логаутимся
      await request(server)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Пытаемся использовать refresh токен после logout
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
