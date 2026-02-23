/**
 * T036/T038: Authentication Controller
 *
 * Обрабатывает HTTP запросы для аутентификации пользователей:
 * - Регистрация нового пользователя
 * - Вход в систему
 * - Обновление токена (refresh)
 * - Выход из системы (logout)
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { RefreshTokenDto } from '../dto/auth/refresh-token.dto';
import { wrapAsync } from '../middleware/error-handler';
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { authRateLimiterMiddleware } from '../middleware/auth-rate-limit';
import { BaseController } from './base.controller';

/**
 * T036: Контроллер аутентификации
 * Express router для auth endpoints
 */
export class AuthController extends BaseController {
  private router = Router();
  private authService: AuthService;
  private dataSource: any;

  constructor(authService: AuthService, dataSource: any) {
    super();
    this.authService = authService;
    this.dataSource = dataSource;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * T036/T038: POST /auth/register
     * Регистрация нового пользователя
     */
    this.router.post(
      '/register',
      authRateLimiterMiddleware,
      wrapAsync(async (req: Request, res: Response) => {
        const registerDto: RegisterDto = req.body;
        const result = await this.authService.register(registerDto);

        return res.status(201).json(this.success(result, 'Пользователь успешно зарегистрирован'));
      })
    );

    /**
     * T036/T038: POST /auth/login
     * Вход в систему с проверкой блокировки аккаунта
     */
    this.router.post(
      '/login',
      authRateLimiterMiddleware,
      wrapAsync(async (req: Request, res: Response) => {
        const loginDto: LoginDto = req.body;
        const result = await this.authService.login(loginDto);

        return res.status(200).json(this.success(result, 'Успешный вход'));
      })
    );

    /**
     * T036/T038: POST /auth/refresh
     * Обновление access токена с ротацией refresh токена
     */
    this.router.post(
      '/refresh',
      wrapAsync(async (req: Request, res: Response) => {
        const refreshTokenDto: RefreshTokenDto = req.body;
        const result = await this.authService.refresh(refreshTokenDto);

        return res.status(200).json(this.success(result, 'Токен успешно обновлён'));
      })
    );

    /**
     * T036/T038: POST /auth/logout
     * Выход из системы с инвалидацией refresh токена
     */
    this.router.post(
      '/logout',
      createAuthenticateMiddleware(this.dataSource),
      wrapAsync(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        const userId = req.user!.id;

        await this.authService.logout({ refreshToken, userId });

        return res.status(200).json(this.success(null, 'Успешный выход'));
      })
    );
  }

  /**
   * Получить router instance для монтирования в app
   */
  getRouter(): Router {
    return this.router;
  }
}

export default AuthController;
