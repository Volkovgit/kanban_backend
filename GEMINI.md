# Gemini CLI Project Context: Kanban Backend API

This file provides essential context and instructions for Gemini CLI when working on the Kanban Backend project.

## Project Overview

A RESTful API server for a Kanban Task Management System.

- **Technology Stack:**
  - **Runtime:** Node.js 20+
  - **Language:** TypeScript 5.x
  - **Framework:** Express.js 4.x
  - **Database:** PostgreSQL with TypeORM
  - **Authentication:** JWT (Access & Refresh tokens) via `@nestjs/jwt` (used in a standalone Express app)
  - **Validation:** `class-validator` and `class-transformer`
  - **Testing:** Jest, Supertest
  - **API Documentation:** Swagger/OpenAPI

- **Architecture:**
  - **Layered Architecture:** `Controller -> Service -> Repository -> Entity`
  - **Base Classes:** Standardized CRUD and common logic via `BaseController`, `BaseService`, and `BaseRepository`.
  - **Data Transfer Objects (DTOs):** Used for request validation and type safety.
  - **Error Handling:** Centralized middleware (`errorHandler`) using a custom `AppError` and NestJS-style exceptions.

## Key Directories

- `src/config/`: Configuration for database, CORS, JWT, etc.
- `src/controllers/`: HTTP request handlers (Auth, Board, Task).
- `src/services/`: Business logic layer.
- `src/repositories/`: Data access layer (TypeORM repositories).
- `src/models/`: TypeORM entities (User, Board, Task).
- `src/dto/`: Request/Response data transfer objects.
- `src/middleware/`: Express middleware (auth, logging, errors, rate limiting).
- `src/migrations/`: Database migration files.
- `tests/`: Unit, integration, and contract tests.
- `specs/001-kanban/`: Project specifications and design documents.

## Development Workflows

### Building and Running

- `npm run dev`: Start the development server with auto-reload (nodemon).
- `npm run build`: Compile TypeScript to `dist/`.
- `npm start`: Run the compiled production server.
- **Environment Check:** The server will refuse to start in `production` if `JWT_SECRET` is not set.

### Testing

- `npm test`: Run all tests (Unit, Integration, Contract).
- `npm run test:watch`: Run tests in watch mode.
- `npm run test:cov`: Generate test coverage reports.
- `npm run test:integration`: Run only integration tests.
- **Sequential Execution:** Integration tests are configured to run sequentially (maxWorkers: 1) to avoid database race conditions.

### Database Management

- `npm run migration:run`: Execute pending migrations.
- `npm run migration:generate -- name`: Generate a new migration based on entity changes.
- `npm run migration:revert`: Roll back the last migration.

## Coding Conventions & Guidelines

- **Asynchronous Code:** Use `wrapAsync` for controller methods to ensure error propagation.
- **Error Handling:** Use `AppError` or NestJS-like exceptions (e.g., `UnauthorizedException`).
- **Validation:** Use `validateDto` middleware with `class-validator` decorated DTOs.
- **Dependency Injection:** Manual DI is performed in `src/main.ts` during application bootstrap.
- **Identifiers:** All primary keys use UUID v4.
- **Workflow:** Supports bi-directional task status transitions (any status to any other status).
- **Isolation:** Strict data isolation between users; users only see and manage their own boards and tasks.

## Security & Performance

- **Rate Limiting:** IP-based limiting for Auth (10/min) and User-based limiting for API (100/min).
- **Password Hashing:** bcrypt with 12 salt rounds.
- **Database Indexes:** Critical indexes on `User.login`, `Board.ownerId`, and `Task.boardId` for performance.
- **Cleanup:** Legacy `Project` and `Label` code has been removed; `Board` is the primary container for tasks.
