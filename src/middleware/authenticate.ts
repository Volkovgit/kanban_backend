/**
 * T034: Authenticate Middleware
 *
 * Валидирует JWT Bearer токен из заголовка Authorization.
 * Присоединяет decoded user к req.user.
 */

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';

/**
 * Расширение интерфейса Request для включения user
 */
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      login: string;
    };
  }
}

/**
 * T034: Middleware для аутентификации JWT токенов
 */
@Injectable()
export class AuthenticateMiddleware implements NestMiddleware {
  constructor() {
    // Создаём экземпляр AuthService (ручная инъекция зависимостей)
    // В Nest это будет обрабатываться через dependency injection
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    // Извлекаем токен из заголовка Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Требуется Authorization заголовок');
    }

    // Проверяем формат "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Невалидный формат Authorization заголовка. Ожидается: Bearer <token>'
      );
    }

    const token = parts[1];

    try {
      // Динамический импорт для избежания circular dependency
      // const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'your-secret-key';

      const payload = jwt.verify(token, secret) as {
        sub: string;
        login: string;
      };

      // Присоединяем user к request
      req.user = {
        id: payload.sub,
        login: payload.login,
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Невалидный или просроченный токен');
    }
  }
}

/**
 * T034: Factory функция для создания middleware (для Express без Nest)
 */
export function createAuthenticateMiddleware(_dataSource: DataSource) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Требуется Authorization заголовок',
        },
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Невалидный формат Authorization заголовка',
        },
      });
    }

    const token = parts[1];

    try {
      // Динамический импорт для избежания circular dependency
      // const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'your-secret-key';

      const payload = jwt.verify(token, secret) as {
        sub: string;
        login: string;
      };

      req.user = {
        id: payload.sub,
        login: payload.login,
      };

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Невалидный или просроченный токен',
        },
      });
    }
  };
}

export default AuthenticateMiddleware;
