# Quickstart Guide: Kanban Board Backend

**Feature**: 001-kanban | **Date**: 2026-02-23

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (локальный или Docker контейнер)
- Git

---

## 1. Installation

### Clone Repository

```bash
git clone <repository-url>
cd kanban_backend
git checkout 001-kanban
```

### Install Dependencies

```bash
npm install
```

**Key Dependencies**:
- `express@4.18` — Web framework
- `typeorm@0.3.28` — ORM
- `pg@8.18` — PostgreSQL driver
- `class-validator@0.14.3` — Input validation
- `bcrypt@5.1.1` — Password hashing
- `jsonwebtoken@9.0.3` — JWT tokens
- `winston@3.19.0` — Logging

---

## 2. Configuration

### Environment Variables

Создайте файл `.env` в корне проекта:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=kanban_db
DB_USERNAME=kanban_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_min_32_characters_long

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:4200

# Logging
LOG_LEVEL=info
```

### Database Setup

**Option A: Local PostgreSQL**

```bash
# Создать базу данных
createdb kanban_db

# Создать пользователя (опционально)
createuser kanban_user -P
psql -c "GRANT ALL PRIVILEGES ON DATABASE kanban_db TO kanban_user;"
```

**Option B: Docker**

```bash
docker run -d \
  --name kanban-postgres \
  -e POSTGRES_DB=kanban_db \
  -e POSTGRES_USER=kanban_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  postgres:14-alpine
```

---

## 3. Database Migration

### Generate Migration (после создания entities)

```bash
npm run migration:generate -- -n Init
```

### Run Migration

```bash
npm run migration:run
```

### Verify Migration

```bash
npm run migration:show
```

**Expected Tables**:
- `user` (id, login, passwordHash, failedLoginAttempts, lockedUntil, refreshToken)
- `board` (id, title, description, ownerId, createdAt, updatedAt)
- `task` (id, title, description, status, priority, boardId, createdAt, updatedAt)

---

## 4. Development Server

### Start Server

```bash
npm run dev
```

**Output**:
```
Server is running on port 3000
[Database] Connected to PostgreSQL
[Swagger] Documentation available at http://localhost:3000/api-docs
```

### Verify Health Check

```bash
curl http://localhost:3000/api/v1/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-23T10:00:00.000Z"
}
```

### Access Swagger Documentation

Откройте в браузере: http://localhost:3000/api-docs

---

## 5. Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Check Coverage

```bash
npm run test:cov
```

**Expected**: Coverage 70%+ across all modules

### Test Configuration

- **maxWorkers: 1** — Sequential execution prevents database race conditions
- **Coverage target**: 70% branches, functions, lines, statements

---

## 6. API Usage Examples

### Register User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "login": "johndoe",
    "password": "SecurePass123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "johndoe",
    "password": "SecurePass123"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Create Board

```bash
curl -X POST http://localhost:3000/api/v1/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "title": "My Kanban Board",
    "description": "Project board"
  }'
```

### Create Task

```bash
curl -X POST http://localhost:3000/api/v1/boards/<board_id>/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "title": "Implement login",
    "description": "Create login form",
    "priority": "HIGH"
  }'
```

**Note**: Статус автоматически установится в BACKLOG.

### Update Task Status

```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/<task_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

**Note**: Любой статус может быть установлен на любой другой (би-направленный workflow).

---

## 7. Build for Production

### Compile TypeScript

```bash
npm run build
```

**Output**: `dist/` directory с compiled JavaScript.

### Start Production Server

```bash
NODE_ENV=production npm start
```

---

## 8. Troubleshooting

### Database Connection Error

**Error**: `connection refused`

**Solution**:
1. Проверьте что PostgreSQL запущен: `pg_isready`
2. Проверьте credentials в `.env`
3. Убедитесь что база данных создана: `psql -l | grep kanban`

### JWT Secret Error

**Error**: `JWT_SECRET must be at least 32 characters`

**Solution**:
```bash
# Сгенерировать secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Migration Error

**Error**: `QueryFailedError: relation "user" does not exist`

**Solution**:
```bash
# Пересоздать базу данных
dropdb kanban_db && createdb kanban_db
npm run migration:run
```

### Test Database Pollution

**Error**: Тесты interfere с друг другом

**Solution**:
- Убедитесь что `maxWorkers: 1` в `jest.config.js`
- Каждый тест использует отдельную транзакцию с откатом

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Найти процесс
lsof -i :3000

# Убить процесс
kill -9 <PID>

# Или использовать другой PORT
PORT=3001 npm run dev
```

---

## 9. Development Workflow

### Adding New Feature

1. **Создать DTO** в `src/dto/`
2. **Создать Repository** (если новый entity) extending `BaseRepository`
3. **Создать Service** extending `BaseService`
4. **Создать Controller** extending `BaseController`
5. **Wire Dependencies** в `src/main.ts` `setupRoutes()`
6. **Mount Router** с префиксом `/api/v1/resource`
7. **Add Tests** (unit + integration)
8. **Verify Coverage** (70%+)
9. **Update Swagger** decorators

### Code Quality Gates

```bash
# Линтинг
npm run lint

# Форматирование
npm run format

# Type checking
npm run build

# Тесты + coverage
npm run test:cov
```

---

## 10. Useful Commands

```bash
# Development
npm run dev              # Запуск dev server с auto-reload
npm run build            # Compile TypeScript
npm start                # Production server

# Testing
npm test                 # All tests
npm run test:watch       # Watch mode
npm run test:integration # Integration tests only
npm run test:cov         # Coverage report

# Database
npm run migration:generate -n MigrationName  # Generate migration
npm run migration:run                         # Run migrations
npm run migration:revert                     # Revert last migration
npm run migration:show                       # Show migrations

# Linting/Formatting
npm run lint            # ESLint check
npm run lint:fix        # ESLint auto-fix
npm run format          # Prettier format
```

---

## 11. Architecture Overview

```
Request → Controller → Service → Repository → Database
         ↓            ↓           ↓
      Response    DTO        Entity
```

**Key Points**:
- **Controllers** handle HTTP only (request parsing, response formatting)
- **Services** contain business logic (validation, orchestration)
- **Repositories** handle data access (CRUD, queries, transactions)
- **DTOs** validate input/output with class-validator decorators

**Base Classes**:
- `BaseController` → response formatting, pagination, UUID validation
- `BaseService` → CRUD helpers, lifecycle hooks
- `BaseRepository` → TypeORM wrapper, standard queries

---

## 12. Next Steps

1. **Review API Documentation**: http://localhost:3000/api-docs
2. **Run Tests**: Убедитесь что все тесты проходят
3. **Check Coverage**: Убедитесь что 70%+ coverage
4. **Read Data Model**: `specs/001-kanban/data-model.md`
5. **Review Contracts**: `specs/001-kanban/contracts/*.yaml`

---

## Support

**Issues**: Создайте GitHub issue с описанием проблемы

**Documentation**:
- [Constitution](.specify/memory/constitution.md)
- [Implementation Plan](specs/001-kanban/plan.md)
- [Data Model](specs/001-kanban/data-model.md)
- [API Contracts](specs/001-kanban/contracts/)
