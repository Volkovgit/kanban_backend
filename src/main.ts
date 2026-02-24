import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import 'reflect-metadata';
import { initializeDatabase, closeDatabase, AppDataSource } from './config/data-source';
import corsOptions from './config/cors';
import { errorHandler } from './middleware/error-handler';
import { jsonErrorHandler } from './middleware/json-error.middleware';
import { requestLogger } from './middleware/logger';
import { correlationIdMiddleware } from './middleware/correlation-id';
import { UserRepository } from './repositories/user.repository';
import { BoardRepository } from './repositories/board.repository';
import { TaskRepository } from './repositories/task.repository';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { BoardService } from './services/board.service';
import { TaskService } from './services/task.service';
import { AuthController } from './controllers/auth.controller';
import { BoardController } from './controllers/board.controller';
import { TaskController } from './controllers/task.controller';
import { HealthController } from './controllers/health.controller';
import { JwtService } from '@nestjs/jwt';

const app = express();
const PORT = process.env.PORT || 3000;

// Validate essential environment variables in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set in production!');
  process.exit(1);
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(jsonErrorHandler);
app.use(express.urlencoded({ extended: true }));

// Correlation ID middleware
app.use(correlationIdMiddleware);

// Request logging middleware (skip in test to reduce noise)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Global flag to track if routes have been setup (persists across test files)
declare global {
  var _kanbanRoutesSetup: boolean;
}
// @ts-ignore
global._kanbanRoutesSetup = global._kanbanRoutesSetup || false;

// T037: Setup routes and controllers
async function setupRoutes() {
  // Only setup routes once (prevent duplicate route mounting in tests)
  // @ts-ignore
  if (global._kanbanRoutesSetup) {
    return;
  }
  // @ts-ignore
  global._kanbanRoutesSetup = true;

  // Initialize repositories
  const userRepository = new UserRepository(AppDataSource);
  const boardRepository = new BoardRepository(AppDataSource);
  const taskRepository = new TaskRepository(AppDataSource);

  // T037: Initialize services
  const userService = new UserService(userRepository);
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  });
  const authService = new AuthService(userService, jwtService);
  const boardService = new BoardService(boardRepository);
  const taskService = new TaskService(taskRepository, boardRepository);

  // T037: Initialize controllers
  const authController = new AuthController(authService, AppDataSource);
  const boardController = new BoardController(boardService, AppDataSource);
  const taskController = new TaskController(taskService, AppDataSource);
  const healthController = new HealthController();

  // T037: Mount routes
  app.use('/api/v1/auth', authController.getRouter());
  app.use('/api/v1/boards', boardController.getRouter());
  app.use('/api/v1', taskController.getRouter());
  app.use('/api/v1/health', healthController.getRouter());

  // Global error handler (must be LAST)
  app.use(errorHandler);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeDatabase();
  process.exit(0);
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Setup routes and controllers
    await setupRoutes();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`📊 Database: ${process.env.DB_DATABASE || 'kanban_dev'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export for testing
export { setupRoutes };

// Export app for testing
export { app };
export default app;
