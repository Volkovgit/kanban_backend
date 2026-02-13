import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import 'reflect-metadata';
import { initializeDatabase, closeDatabase, AppDataSource } from './config/data-source';
import corsOptions from './config/cors';
import { errorHandler } from './middleware/error-handler';
import { jsonErrorHandler } from './middleware/json-error.middleware';
import { requestLogger } from './middleware/logger';
import { UserRepository } from './repositories/user.repository';
import { ProjectRepository } from './repositories/project.repository';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { ProjectService } from './services/project.service';
import { TaskService } from './services/task.service';
import { LabelService } from './services/label.service';
import { AuthController } from './controllers/auth.controller';
import { ProjectController } from './controllers/project.controller';
import { TaskController } from './controllers/task.controller';
import { LabelController } from './controllers/label.controller';
import { TaskRepository } from './repositories/task.repository';
import { LabelRepository } from './repositories/label.repository';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(jsonErrorHandler);
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (skip in test to reduce noise)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API server is running', database: 'connected' });
});

// Flag to track if routes have been setup
let routesSetup = false;

// Setup routes and controllers
async function setupRoutes() {
  // Only setup routes once (prevent duplicate route mounting in tests)
  if (routesSetup) {
    return;
  }
  routesSetup = true;

  // Initialize repositories
  const userRepository = new UserRepository(AppDataSource);
  const projectRepository = new ProjectRepository(AppDataSource);
  const taskRepository = new TaskRepository(AppDataSource);
  const labelRepository = new LabelRepository(AppDataSource);

  // Initialize services
  const userService = new UserService(userRepository);
  const authService = new AuthService(userRepository, userService);
  const projectService = new ProjectService(projectRepository, userRepository);
  const taskService = new TaskService(taskRepository, labelRepository, projectRepository);
  const labelService = new LabelService(labelRepository, projectRepository);

  // Initialize controllers
  const authController = new AuthController(authService, userService);
  const projectController = new ProjectController(projectService);
  const taskController = new TaskController(taskService);
  const labelController = new LabelController(labelService);

  // Mount routes
  app.use('/api/v1/auth', authController.getRouter());
  app.use('/api/v1/projects', projectController.getRouter());
  app.use('/api/v1/tasks', taskController.getRouter());
  app.use('/api/v1/labels', labelController.getRouter());

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
