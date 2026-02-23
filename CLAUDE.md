# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## Language & Communication Rules

**CRITICAL: Russian Language Default**

- **User Communication Language**: Russian (Русский)
  - ALL responses, explanations, and messages to the user MUST be in Russian
  - Code comments MUST be in Russian
  - Commit messages MUST be in Russian
  - Documentation files (README, docs/*) MUST be in Russian

- **Code & Technical Terms**: English
  - Source code (variable names, function names, class names) MUST be in English
  - API endpoints, routes, and HTTP methods in English
  - Database table and column names in English
  - Technical terms (TypeScript, Express, TypeORM, etc.) remain in English
  - Error messages returned to API clients can be in English (standard practice)

**Example**:
```typescript
// Получить пользователя по ID
async getUserById(id: string): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException('Пользователь не найден');
  }
  return user;
}
```

**Output Format**:
- Speak to the user in Russian
- Write code comments in Russian
- Keep code identifiers in English
- Use Russian for commit messages: `feat: добавить эндпоинт для поиска задач`

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

### Important Implementation Details

**BaseRepository Cache Behavior**: All repository queries have `cache: false` by default to ensure data consistency. This prevents stale data issues in tests and concurrent operations.

**Service Hook Methods**: BaseService provides hooks for extending business logic:
- `validateCreate()` / `validateUpdate()` / `validateDelete()` - Override for custom validation
- `afterCreate()` / `afterUpdate()` / `afterDelete()` - Override for post-operation actions
- `validateOwnership()` - Override to implement resource ownership checks

**Response Headers**: Paginated responses include `X-Total-Count`, `X-Page-Size`, `X-Current-Page`, `X-Total-Pages` headers.

**Pagination Limits**: Max pageSize is 100 (enforced in BaseController.getPaginationParams).

## Project Scope

**CRITICAL: API-Only Backend Server**

This project provides a **REST API backend only**. No frontend or visual components are included.

**Rules**:
- All functionality exposed via REST API endpoints with JSON responses
- No HTML, CSS, or JavaScript frontend code
- Visual interface is a separate service (different server/repository)
- API must work with any HTTP client (web, mobile, CLI, other services)
- All endpoints documented with OpenAPI/Swagger specification

## API Documentation Policy

**CRITICAL: Update Documentation After Every API Change**

You MUST verify and update API documentation after completing any task that modifies the API.

### When to Update Documentation

- ✅ **AFTER** adding new endpoint
- ✅ **AFTER** modifying existing endpoint (request/response structure)
- ✅ **AFTER** adding new DTO fields
- ✅ **AFTER** changing HTTP method or path
- ✅ **AFTER** adding new error responses

### Documentation Verification Checklist

Before committing API changes, verify:

- [ ] Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) are updated
- [ ] Request DTOs have `@ApiProperty()` decorators for all fields
- [ ] Response DTOs have `@ApiProperty()` decorators for all fields
- [ ] Error responses documented (400, 401, 403, 404, 500)
- [ ] New endpoints tagged correctly in Swagger
- [ ] Run server and check `/api-docs` shows correct documentation
- [ ] Contract tests verify API matches documentation

### Swagger Documentation Example

```typescript
// DTO с документацией
export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login', description: 'Название задачи' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'BACKLOG', description: 'Статус задачи', enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;
}

// Controller с документацией
@ApiTags('Tasks')
@Controller('api/v1/projects/:projectId/tasks')
export class TaskController {
  @Post()
  @ApiOperation({ summary: 'Создать новую задачу в проекте' })
  @ApiResponse({ status: 201, description: 'Задача создана', type: TaskResponseDto })
  @ApiResponse({ status: 400, description: 'Невалидные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(@Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    // ...
  }
}
```

## Git Commit Policy

**CRITICAL: Commit Before Every Completed Task**

You MUST create a git commit after completing each logical unit of work.

### When to Commit

- ✅ **AFTER** completing a single task from tasks.md
- ✅ **AFTER** implementing a user story phase
- ✅ **AFTER** fixing a bug
- ✅ **AFTER** passing all tests for a feature
- ✅ **BEFORE** moving to the next task

### When NOT to Commit

- ❌ In the middle of implementing a task (wait until it's complete)
- ❌ When tests are failing (fix tests first, then commit)
- ❌ When code doesn't compile (fix compilation errors first)

### Commit Message Format

All commit messages MUST be in Russian and follow this format:

```
<type>: <description>

[optional detailed explanation]
```

**Types**:
- `feat` - новая функциональность
- `fix` - исправление бага
- `refactor` - рефакторинг кода
- `test` - добавление или изменение тестов
- `docs` - обновление документации
- `chore` - обновление конфигурации, зависимостей

**Examples**:
```
feat: добавить эндпоинт для поиска задач по статусу

- Реализован SearchService с фильтрацией по нескольким параметрам
- Добавлены unit и integration тесты
- Coverage: 85%
```

```
fix: исправить валидацию статуса задачи

- Добавлена проверка на валидные значения enum TaskStatus
- Добавлены тесты для невалидных статусов
```

### Commit Workflow

1. **Complete the task** (code + tests pass)
2. **Stage the changes**:
   ```bash
   git add <files>
   ```
3. **Create commit** with descriptive Russian message:
   ```bash
   git commit -m "feat: добавить эндпоинт для поиска задач"
   ```
4. **Verify**:
   ```bash
   git log -1 --stat
   ```

### Branch-Specific Rules

- **Feature branches**: Commit frequently, push after each major milestone
- **Main/Master**: Never commit directly - use pull requests
- **Hotfix branches**: One commit per fix if possible

### Pre-Commit Checklist

Before creating a commit, ensure:
- [ ] Code compiles (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Coverage is 70%+ (`npm run test:cov`)
- [ ] Commit message is in Russian
- [ ] Commit message follows the format above

## Active Technologies
- TypeScript 5.5.0 (Node.js) + Express 4.18, TypeORM 0.3.28, class-validator 0.14.3, bcrypt 5.1.1, jsonwebtoken 9.0.3, Winston 3.19.0 (001-kanban)
- PostgreSQL (через pg 8.18.0) (001-kanban)

## Recent Changes
- 001-kanban: Added TypeScript 5.5.0 (Node.js) + Express 4.18, TypeORM 0.3.28, class-validator 0.14.3, bcrypt 5.1.1, jsonwebtoken 9.0.3, Winston 3.19.0
