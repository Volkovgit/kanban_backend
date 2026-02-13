# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## Development Commands

```bash
# Development server (auto-reload)
npm run dev

# Build TypeScript to dist/
npm run build

# Run production server
npm start

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Run integration tests only
npm run test:integration

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Database migrations
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
npm run migration:show

# Seed default labels
npm run seed:labels
```

## Running Single Tests

```bash
# Run a specific test file
npm test -- tests/unit/auth.service.spec.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should create user"
```

## Architecture Overview

This is a **layered architecture** backend with strict separation of concerns:

```
Request → Controller → Service → Repository → Database
         ↓            ↓           ↓
      Response    DTO        Entity
```

### Key Architectural Patterns

1. **Base Classes**: All controllers, services, and repositories extend base classes that provide common functionality
   - `BaseController`: Response formatting (`success()`, `error()`, `paginated()`), pagination helpers, UUID validation, ownership checks
   - `BaseService`: CRUD operations, hooks (`afterCreate()`, `afterUpdate()`), validation hooks
   - `BaseRepository`: TypeORM wrapper with standard queries, caching disabled by default for data consistency

2. **Dependency Injection**: Manual DI in `src/main.ts` - all repositories, services, and controllers are instantiated and wired together in `setupRoutes()`

3. **Middleware Stack** (applied in order):
   - CORS configuration
   - `express.json()` body parser
   - `jsonErrorHandler` - catches malformed JSON
   - `requestLogger` - skipped in test environment
   - Route handlers
   - `errorHandler` - global error handler (must be last)

4. **Authentication Flow**:
   - JWT-based with access + refresh tokens
   - `authenticate` middleware verifies Bearer token, attaches `req.user`
   - `validateProjectOwnership` middleware validates project access, attaches `req.project`

5. **Entity Relationships** (TypeORM):
   - User (1) → (N) Project
   - Project (1) → (N) Task, (N) Label
   - Task (N) ↔ (N) Label (through TaskLabel junction)
   - Cascade deletes: Deleting User → Projects → Tasks/Labels

### Module Organization

- **Config**: `src/config/` - Database, CORS, JWT, Swagger, Winston logger
- **Controllers**: `src/controllers/` - HTTP handlers, extend `BaseController`, return formatted responses
- **DTOs**: `src/dto/` - Request/response validation with class-validator decorators
- **Middleware**: `src/middleware/` - Auth, error handling, logging, project ownership validation
- **Models**: `src/models/` - TypeORM entities (User, Project, Task, Label, TaskLabel)
- **Repositories**: `src/repositories/` - Data access layer, extend `BaseRepository`
- **Services**: `src/services/` - Business logic layer, extend `BaseService`

### TypeScript Path Aliases

The project uses `@/*` path mapping (tsconfig.json):
```typescript
import { UserService } from '@/services/user.service'; // resolves to src/services/user.service
```

### Task Status Workflow

Tasks can move to any status (forward or backward): `BACKLOG` → `TODO` → `IN_PROGRESS` → `REVIEW` → `DONE`

- The workflow is **bi-directional** - tasks can move backward (e.g., from `REVIEW` back to `TODO` if changes are needed)
- No restrictions on status transitions - any status can be changed to any other status
- Task statuses are in `src/models/task.entity.ts` as TaskStatus enum

### Testing Setup

- Jest with `ts-jest` transformer
- Test files: `**/*.spec.ts` or `**/*.test.ts`
- `maxWorkers: 1` - sequential test execution to avoid database race conditions
- Setup file: `tests/setup.ts`
- Coverage target: 70%+

### Environment Variables

Required in `.env`:
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (min 32 chars in production)
- `PORT` (default: 3000)
- `CORS_ORIGIN` (default: http://localhost:4200)

### Database Connection

TypeORM DataSource initialized in `src/config/data-source.ts` - exports `AppDataSource` for use in repositories. Connection pooling configured in `dbConfig`.

### Adding New Features

1. Create DTO in `src/dto/` with class-validator decorators
2. Create/extend Repository in `src/repositories/`
3. Create/extend Service in `src/services/` (business logic)
4. Create/extend Controller in `src/controllers/` (HTTP handlers)
5. Wire dependencies in `src/main.ts` `setupRoutes()`
6. Mount router path (e.g., `app.use('/api/v1/resource', controller.getRouter())`)
