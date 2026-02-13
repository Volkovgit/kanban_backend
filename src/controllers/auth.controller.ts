/**
 * Authentication Controller
 *
 * Handles HTTP requests for user authentication:
 * - Register new user
 * - Login
 * - Refresh access token
 * - Get current user
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto } from '../dto/auth.dto';
import { validateDto } from '../config/validation';
import { wrapAsync } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth.middleware';

/**
 * Authentication controller
 * Express router for auth endpoints
 */
export class AuthController {
  private router = Router();
  private authService: AuthService;
  private userService: UserService;

  constructor(authService: AuthService, userService: UserService) {
    this.authService = authService;
    this.userService = userService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * POST /auth/register
     * Register new user
     */
    this.router.post(
      '/register',
      validateDto(RegisterDto),
      wrapAsync(async (req: Request, res: Response) => {
        const registerDto: RegisterDto = req.body;
        const result: AuthResponseDto = await this.authService.register(registerDto);

        res.status(201).json({
          success: true,
          data: result,
        });
      })
    );

    /**
     * POST /auth/login
     * Login user
     */
    this.router.post(
      '/login',
      validateDto(LoginDto),
      wrapAsync(async (req: Request, res: Response) => {
        const loginDto: LoginDto = req.body;
        const result: AuthResponseDto = await this.authService.login(loginDto);

        res.status(200).json({
          success: true,
          data: result,
        });
      })
    );

    /**
     * POST /auth/refresh
     * Refresh access token with refresh token rotation
     */
    this.router.post(
      '/refresh',
      validateDto(RefreshTokenDto),
      wrapAsync(async (req: Request, res: Response) => {
        const { refreshToken }: RefreshTokenDto = req.body;
        const result = await this.authService.refreshToken(refreshToken);

        res.status(200).json({
          success: true,
          data: result,
        });
      })
    );

    /**
     * GET /auth/me
     * Get current authenticated user
     */
    this.router.get(
      '/me',
      authenticate,
      wrapAsync(async (req: Request, res: Response) => {
        // userId is attached to req by authenticate middleware
        const userId = req.user!.id;

        const user = await this.userService.getById(userId);

        res.status(200).json({
          success: true,
          data: user,
        });
      })
    );
  }

  /**
   * Get the router instance
   */
  getRouter(): Router {
    return this.router;
  }
}

export default AuthController;
