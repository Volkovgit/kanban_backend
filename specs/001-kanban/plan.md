# Implementation Plan: Kanban Board Authentication and Management

**Branch**: `001-kanban` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-kanban/spec.md`

## Summary

Реализация REST API бэкенда для Kanban-доски с аутентификацией пользователей, управлением досками (проектами) и задачами. Система поддерживает би-направленный workflow статусов задач, изоляцию данных между пользователями и каскадное удаление.

**Технический подход**: Node.js/TypeScript с Express, TypeORM для PostgreSQL, JWT аутентификация, Swagger/OpenAPI документация.

## Technical Context

**Language/Version**: TypeScript 5.5.0 (Node.js)
**Primary Dependencies**: Express 4.18, TypeORM 0.3.28, class-validator 0.14.3, bcrypt 5.1.1, jsonwebtoken 9.0.3, Winston 3.19.0
**Storage**: PostgreSQL (через pg 8.18.0)
**Testing**: Jest 29.7 с ts-jest 29.4.6 (unit + integration, maxWorkers: 1)
**Target Platform**: Linux server (Node.js runtime)
**Project Type**: web (REST API backend)
**Performance Goals**:
- Вход в систему: < 5 секунд (SC-001)
- Создание доски/задачи: < 3 секунды (SC-003, SC-004)
- 1000 пользователей × 100 досок × 1000 задач без degradation (SC-008)
**Constraints**:
- 99% uptime (SC-009)
- Ответ API: < 500ms p95
- Coverage: 70%+ минимум
**Scale/Scope**:
- Максимум 100 досок на пользователя (FR-BL-013)
- Максимум 1000 задач на доску (FR-BL-014)
- 5 статусов задач (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)
- 4 приоритета задач (LOW, MEDIUM, HIGH, CRITICAL)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Project Scope - API-Only Backend**:
- [x] No frontend/UI components included (только REST API)
- [x] All functionality exposed via REST API (JSON responses)
- [x] JSON responses only (no HTML rendering)

**Principle I - Layered Architecture**:
- [x] Controller → Service → Repository separation maintained (существующая структура src/)
- [x] No direct repository access from controllers (использование BaseService/BaseRepository)
- [x] DTOs used for all input/output validation (class-validator)

**Principle II - Test Coverage Discipline**:
- [x] Test plan defined (unit + integration, Jest с maxWorkers: 1)
- [x] Coverage target: 70%+ across all modules

**Principle III - Base Class Inheritance**:
- [x] Controllers extend BaseController (существующий базовый класс)
- [x] Services extend BaseService (существующий базовый класс)
- [x] Repositories extend BaseRepository (существующий базовый класс)

**Principle IV - Manual Dependency Injection**:
- [x] No DI frameworks used (вручную в src/main.ts setupRoutes)
- [x] Dependencies wired in src/main.ts

**Principle V - Ownership & Authorization**:
- [x] Protected routes use authenticate middleware (JWT валидация)
- [x] Project resources use validateProjectOwnership middleware (для Board/Task)
- [x] User/project isolation enforced (каскадное удаление User → Boards → Tasks)

**API Documentation Synchronization**:
- [x] Swagger decorators updated for new endpoints (swagger-ui-express)
- [x] Request/Response DTOs documented with @ApiProperty()
- [x] Error responses documented (400, 401, 403, 404, 500)
- [x] Documentation verification before commit

**Task Status Workflow**:
- [x] Bi-directional status transitions supported (любой → любой)
- [x] Status enum values validated (TaskStatus enum)

## Project Structure

### Documentation (this feature)

```text
specs/001-kanban/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth.yaml        # Authentication endpoints OpenAPI
│   ├── boards.yaml      # Board endpoints OpenAPI
│   └── tasks.yaml       # Task endpoints OpenAPI
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── config/              # Configuration modules
│   ├── database.ts      # TypeORM DataSource
│   ├── cors.ts          # CORS configuration
│   ├── jwt.ts           # JWT configuration
│   ├── swagger.ts       # Swagger/OpenAPI setup
│   └── winston.ts       # Winston logger
├── controllers/         # HTTP handlers extending BaseController
│   ├── auth.controller.ts
│   ├── board.controller.ts
│   └── task.controller.ts
├── dto/                 # Request/response validation with class-validator
│   ├── auth/
│   │   ├── register.dto.ts
│   │   ├── login.dto.ts
│   │   └── tokens.dto.ts
│   ├── board/
│   │   ├── create-board.dto.ts
│   │   ├── update-board.dto.ts
│   │   └── board-response.dto.ts
│   └── task/
│       ├── create-task.dto.ts
│       ├── update-task.dto.ts
│       └── task-response.dto.ts
├── middleware/          # Express middleware
│   ├── authenticate.ts      # JWT validation
│   ├── validate-project-ownership.ts
│   ├── error-handler.ts
│   ├── request-logger.ts
│   └── rate-limiter.ts
├── models/              # TypeORM entities
│   ├── user.entity.ts
│   ├── board.entity.ts
│   └── task.entity.ts
├── repositories/        # Data access layer extending BaseRepository
│   ├── user.repository.ts
│   ├── board.repository.ts
│   └── task.repository.ts
├── services/            # Business logic layer extending BaseService
│   ├── auth.service.ts
│   ├── board.service.ts
│   └── task.service.ts
└── main.ts              # Application entry point, DI wiring

tests/
├── contract/            # API contract tests
├── integration/         # Integration tests with database
└── unit/                # Unit tests for services
```

**Structure Decision**: Single project (backend-only REST API). Структура соответствует существующей архитектуре проекта с Layered Architecture (Controller → Service → Repository).

## Complexity Tracking

> **Не требуется** — Constitution Check пройден без нарушений.

---

## Phase 0: Research & Technology Decisions

### Research Tasks

1. **JWT Refresh Token Strategy**
   - Decision: Refresh tokens хранятся в БД (User.refreshToken) с возможностью отзыва
   - Ротация: новый refresh токен выдаётся при каждом обновлении
   - Logout: удаление refresh токена из БД

2. **Rate Limiting Implementation**
   - Decision: express-rate-limit с настраиваемыми лимитами
   - Auth endpoints: 10 запросов/мин на IP
   - API endpoints: 100 запросов/мин на пользователя (по JWT)

3. **Password Hashing Configuration**
   - Decision: bcrypt с 12 salt rounds (FR-SEC-005)
   - Асинхронное хеширование для производительности

4. **Cascade Delete Implementation**
   - Decision: TypeORM cascade options на уровне entity
   - Транзакционное удаление через QueryRunner для all-or-nothing

5. **UUID Generation Strategy**
   - Decision: uuid v4 для всех сущностей (User, Board, Task)
   - Генерация на уровне entity через @BeforeInsert

6. **Error Response Format**
   - Decision: Единый формат через BaseController.error()
   - Структура: `{ success: false, error: { code, message, details? } }`

7. **Pagination Strategy**
   - Decision: Offset-based (page/pageSize) для simplicity
   - Заголовки ответа: X-Total-Count, X-Page-Size, X-Current-Page, X-Total-Pages

8. **Audit Logging Strategy**
   - Decision: Winston logger с middleware для request/response
   - Уровни: error для security событий, info для business events

---

## Phase 1: Design Artifacts

### Data Model (data-model.md)

**Entities**:
- User (id, login, passwordHash, failedLoginAttempts, lockedUntil, refreshToken)
- Board (id, title, description, ownerId, createdAt, updatedAt)
- Task (id, title, description, status, priority, boardId, createdAt, updatedAt)

**Relationships**:
- User (1) → (N) Board (ownerId)
- Board (1) → (N) Task (boardId)
- Cascade: Board delete → Task delete
- Cascade: User delete → Board delete → Task delete

**Enums**:
- TaskStatus: BACKLOG | TODO | IN_PROGRESS | REVIEW | DONE
- TaskPriority: LOW | MEDIUM | HIGH | CRITICAL

### API Contracts (contracts/)

- **auth.yaml**: POST /auth/register, /auth/login, /auth/refresh, /auth/logout
- **boards.yaml**: GET/POST /boards, GET/PATCH/DELETE /boards/:id
- **tasks.yaml**: GET/POST /boards/:boardId/tasks, GET/PATCH/DELETE /tasks/:id

### Quickstart Guide (quickstart.md)

- Установка зависимостей: `npm install`
- Настройка .env (DB credentials, JWT secrets)
- Миграции БД: `npm run migration:run`
- Запуск: `npm run dev`
- Тесты: `npm test`

---

## Phase 2: Implementation Tasks (Generated by /speckit.tasks)

> **Note**: This section is filled by the `/speckit.tasks` command, not by `/speckit.plan`.

Tasks will be generated as:
1. Setup & Configuration
2. Authentication (register, login, refresh, logout)
3. Board Management (CRUD)
4. Task Management (CRUD + status workflow)
5. Testing (unit + integration)
6. Documentation (Swagger)

---

## Dependencies

**External Services**: PostgreSQL database (локальный или контейнер)

**Integration Points**:
- Database: TypeORM DataSource инициализация
- JWT: jsonwebtoken для подписи токенов
- CORS: cors middleware для origin validation
- Rate Limiting: express-rate-limit для защиты endpoint'ов

**Sequential Requirements**:
1. Database setup → Entity creation → Migration generation
2. Auth service → Auth controller → Protected routes
3. Board service → Task service (зависимость от Board)
4. All services → Tests → Documentation update

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Password security | bcrypt с 12 rounds, no plaintext logging |
| JWT secret exposure | Environment variables, min 32 chars |
| SQL injection | TypeORM parameterized queries only |
| XSS in user input | class-validator sanitization, escaping |
| Cascade delete failure | Transaction wrapping, rollback on error |
| Race conditions | Last Write Wins semantics, audit logging |
| Rate limit bypass | IP-based for auth, token-based for API |
| Test database pollution | Separate test database, cleanup after each test |

---

## Success Criteria Mapping

| Criterion | Verification Method |
|-----------|---------------------|
| SC-001: Login < 5s | Integration test с измерением времени |
| SC-002: 99% auth success | Integration test, coverage of error paths |
| SC-003: Create board < 3s | Integration test с измерением времени |
| SC-004: Create task < 3s | Integration test с измерением времени |
| SC-005: 100% isolation | Integration test для cross-user access |
| SC-006: 100% status update | Unit test для всех переходов статуса |
| SC-007: Cascade delete | Integration test для board delete → task delete |
| SC-008: 1000×100×1000 | Performance test (или оценка по запросам) |
| SC-009: 99% uptime | Мониторинг (или planned downtime strategy) |
