/**
 * T088: Health Check Controller
 */

import { Router, Request, Response } from 'express';
import { BaseController } from './base.controller';
import { isDatabaseConnected } from '../config/data-source';

export class HealthController extends BaseController {
  private router = Router();

  constructor() {
    super();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * GET /
     * Returns the health status of the application
     */
    this.router.get('/', (_req: Request, res: Response) => {
      const isDbConnected = isDatabaseConnected();
      const status = isDbConnected ? 'ok' : 'error';
      const statusCode = isDbConnected ? 200 : 503;

      const healthStatus = {
        status,
        timestamp: new Date().toISOString(),
        services: {
          api: 'ok',
          database: isDbConnected ? 'connected' : 'disconnected',
        },
        uptime: process.uptime(),
      };

      return res.status(statusCode).json(healthStatus);
    });
  }

  getRouter(): Router {
    return this.router;
  }
}

export default HealthController;
