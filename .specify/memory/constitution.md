<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 1.1.0 → 1.2.0
  Modified Principles: None
  Added Sections:
    - Project Scope (API-Only Backend)
    - API Documentation Synchronization
  Removed Sections: None
  Templates Status:
    ✅ .specify/templates/plan-template.md - Reviewed, aligns with principles
    ✅ .specify/templates/spec-template.md - Reviewed, aligns with principles
    ✅ .specify/templates/tasks-template.md - Reviewed, aligns with principles
    ✅ README.md - Reviewed, references architecture patterns
    ✅ CLAUDE.md - Reviewed, primary implementation guidance
    ✅ .claude/commands/*.md - Reviewed, no agent-specific references
  Follow-up TODOs: None
-->

# Kanban Backend Constitution

## Project Scope (NON-NEGOTIABLE)

This is an **API-only backend server**. No frontend or visual components are included.

**Rules**:
- **API-Only**: All functionality exposed via REST API endpoints
- **No UI Components**: No HTML, CSS, JavaScript frontend code - visual interface is a separate service
- **JSON Responses**: All endpoints return JSON (no HTML rendering, no server-side templates)
- **API-First Design**: All features designed as API contracts first
- **Client Agnostic**: API must work with any HTTP client (web, mobile, CLI, other services)
- **OpenAPI Documentation**: All endpoints documented with Swagger/OpenAPI specification

**Rationale**: Separation of concerns enables independent development and deployment. Frontend teams can work with any technology without affecting backend. API-first approach ensures consistent interface regardless of client implementation.

## Core Principles

### I. Layered Architecture (NON-NEGOTIABLE)

All code MUST follow strict layer separation: Controller → Service → Repository → Database.

**Rules**:
- Controllers handle HTTP only (request parsing, response formatting, status codes)
- Services contain business logic (validation, calculations, orchestration)
- Repositories handle data access only (CRUD, queries, transactions)
- DTOs validate input/output (class-validator decorators, transformation)
- NO layer skipping: Controllers CANNOT access repositories directly
- NO cross-layer bleeding: Services CANNOT access HTTP request/response objects

**Rationale**: Separation enables independent testing, clear responsibility boundaries, and maintainable codebases. Violations create tightly coupled, untestable code.

### II. Test Coverage Discipline

All features MUST achieve 70%+ test coverage across modules before merge.

**Rules**:
- Unit tests for services (business logic in isolation)
- Integration tests for API endpoints (database + HTTP)
- Contract tests for API interface compliance
- Tests MUST be written before implementation for new features (TDD encouraged)
- `maxWorkers: 1` in Jest config (sequential execution prevents database race conditions)
- Coverage reports run automatically: `npm run test:cov`

**Rationale**: Automated tests prevent regressions, document expected behavior, and enable confident refactoring. Coverage below 70% indicates insufficient validation.

### III. Base Class Inheritance

All controllers, services, and repositories MUST extend their respective base classes.

**Rules**:
- Controllers extend `BaseController` (response formatting, pagination, UUID validation, ownership checks)
- Services extend `BaseService` (CRUD helpers, lifecycle hooks like `afterCreate()`/`afterUpdate()`)
- Repositories extend `BaseRepository` (TypeORM wrapper, standard query patterns)
- Base classes provide common functionality - DO NOT duplicate
- Override base methods only when behavior must change (document why)

**Rationale**: Base classes eliminate code duplication, ensure consistent patterns, and reduce boilerplate. Bypassing base classes creates inconsistency.

### IV. Dependency Injection Manual Wiring

All dependencies MUST be manually instantiated and wired in `src/main.ts`.

**Rules**:
- NO dependency injection frameworks (no Inversify, no Awilix, no auto-wiring)
- All repositories, services, controllers instantiated explicitly in `setupRoutes()`
- Constructor injection only (no property injection, no service locator pattern)
- Dependency graph MUST be visible in main.ts wiring
- Circular dependencies indicate architectural flaws - refactor to eliminate

**Rationale**: Manual wiring makes dependency relationships explicit, transparent, and debuggable. DI frameworks hide complexity and create opaque initialization.

### V. Ownership & Authorization Enforcement

All operations MUST validate user ownership before data access or modification.

**Rules**:
- `authenticate` middleware REQUIRED on all protected routes (validates JWT, attaches `req.user`)
- `validateProjectOwnership` middleware REQUIRED for project-scoped resources (attaches `req.project`)
- Controllers MUST verify `req.user.id === resource.userId` before modifications
- Repositories MUST filter queries by user/project ID (no cross-user data leaks)
- Search endpoints MUST filter results to authenticated user's data only
- Cascade deletes configured: User → Projects → Tasks/Labels (prevent orphaned data)

**Rationale**: Multi-user systems require strict isolation. Ownership validation prevents data leakage and unauthorized access between users.

## Architecture Standards

### Module Structure

```
src/
├── config/          # Configuration modules (database, CORS, JWT, Swagger, Winston)
├── controllers/     # HTTP handlers extending BaseController
├── dto/            # Request/response validation with class-validator decorators
├── middleware/      # Express middleware (auth, error handling, logging, project ownership)
├── models/          # TypeORM entities (User, Project, Task, Label, TaskLabel)
├── repositories/     # Data access layer extending BaseRepository
├── services/        # Business logic layer extending BaseService
└── main.ts         # Application entry point, DI wiring

tests/
├── contract/        # API contract tests
├── integration/     # Integration tests with database
└── unit/           # Unit tests for services (isolated)
```

### Entity Relationships (TypeORM)

- User (1) → (N) Project
- Project (1) → (N) Task, (1) → (N) Label
- Task (N) ↔ (N) Label (through TaskLabel junction table)
- Cascade deletes: User deletion cascades to Projects → Tasks/Labels
- Foreign keys MUST be indexed for query performance

### Task Status Workflow (NON-NEGOTIABLE)

Tasks follow a bi-directional status workflow - any status can transition to any other status.

**Rules**:
- Valid statuses: `BACKLOG`, `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`
- Bi-directional transitions allowed: Tasks can move forward OR backward
- No restrictions on status changes (e.g., REVIEW → TODO is valid for revision)
- Status is stored as enum in Task entity
- Services MUST validate status enum values on updates
- Status changes MUST be logged for audit trail

**Rationale**: Kanban workflow requires flexibility. Tasks often need to move backward (e.g., from REVIEW back to TODO) when changes are requested. Restricting workflow reduces agility.

### TypeScript Configuration

- `strict: true` mode enforced (no implicit any, strict null checks)
- Path alias `@/*` resolves to `src/*` (use imports like `@/services/user.service`)
- No `any` types without explicit justification comment

## Development Workflow

### Feature Addition Process

1. **Create DTO** in `src/dto/` with class-validator decorators
2. **Create Repository** (if new entity) extending `BaseRepository`
3. **Create Service** (if business logic needed) extending `BaseService`
4. **Create Controller** extending `BaseController`
5. **Wire Dependencies** in `src/main.ts` `setupRoutes()`
6. **Mount Router** (e.g., `app.use('/api/v1/resource', controller.getRouter())`)
7. **Add Tests** (unit + integration) before implementation
8. **Verify Coverage** meets 70%+ threshold
9. **Update API Documentation** (MANDATORY for API changes - see API Documentation Synchronization)

### Testing Workflow

- **Unit Tests**: Mock dependencies, test service methods in isolation
- **Integration Tests**: Use test database, test HTTP endpoints end-to-end
- **Contract Tests**: Verify API responses match OpenAPI spec
- **Sequential Execution**: `maxWorkers: 1` prevents database conflicts
- **Before Commit**: Run `npm test` and `npm run test:cov`

### Code Quality Gates

- **Linting**: `npm run lint` must pass (ESLint rules)
- **Formatting**: `npm run format` applies Prettier standards
- **Type Checking**: `npm run build` must compile without errors
- **Coverage**: `npm run test:cov` must show 70%+ across all modules
- **Breaking Changes**: Increment major version, document migration path

## Quality Standards

### Error Handling

- **Centralized Handler**: `errorHandler` middleware catches all errors (must be last middleware)
- **Consistent Format**: `{ statusCode, message, error, timestamp, path }`
- **HTTP Status Codes**: Use semantically correct codes (400, 401, 403, 404, 500, etc.)
- **Logging**: All errors logged with context (Winston structured logging)
- **No Stack Traces in Production**: Stack details logged server-side only

### Response Formatting

- **Success**: `BaseController.success()` wraps successful responses
- **Error**: `BaseController.error()` formats error responses
- **Pagination**: `BaseController.paginated()` handles paginated lists with metadata
- **Validation Errors**: Return 400 with field-level error details
- **UUID Validation**: `BaseController.validateUuid()` checks UUID format

### Performance Requirements

- **Database Queries**: Use indexed columns, N+1 queries prohibited
- **Caching**: Disabled by default in repositories (data consistency prioritized)
- **Connection Pooling**: Configured in `dbConfig` for PostgreSQL
- **Response Time**: API endpoints should respond within 500ms p95 (measure, optimize if exceeded)
- **Search Queries**: MUST use database indexes on searchable fields (title, description, status, labels)

## Security Requirements

### Authentication

- **JWT Strategy**: Access tokens (1h expiry) + Refresh tokens (7d expiry)
- **Secret Keys**: `JWT_SECRET` and `JWT_REFRESH_SECRET` MUST be 32+ characters in production
- **Password Hashing**: bcrypt with salt rounds from config (default: 10)
- **Token Storage**: Refresh tokens stored in database (revocation support)

### Input Validation

- **All Input**: Validated via DTOs with class-validator decorators
- **No SQL Injection**: TypeORM parameterized queries enforced (no raw SQL without explicit approval)
- **No XSS**: User input sanitized, no unescaped echoes in responses
- **File Uploads**: Validate file type, size limits, scan if enabled
- **Search Input**: Sanitize search parameters to prevent injection attacks

### CORS & Headers

- **CORS Origin**: Configured via `CORS_ORIGIN` env var (default: http://localhost:4200)
- **Rate Limiting**: Consider implementing on authentication endpoints (future enhancement)
- **Security Headers**: Use Helmet middleware (future enhancement)

### Environment Variables

- **No Secrets in Code**: All secrets via `.env` file (`.env.example` as template)
- **Required Variables**: Database config, JWT secrets, PORT, CORS_ORIGIN
- **Validation**: App fails fast if required environment variables missing

## API Documentation Synchronization (NON-NEGOTIABLE)

API documentation MUST be synchronized with implementation after every API-modifying task.

**Rules**:
- **After Each API Change**: Update Swagger/OpenAPI decorators to reflect actual implementation
- **Documentation Check**: Before committing API changes, verify documentation matches implementation
- **Breaking Changes**: Update API version and document migration path
- **Examples**: Provide request/response examples for all endpoints
- **Deprecated Endpoints**: Mark with deprecation notice and sunset date
- **Access Documentation**: Swagger UI available at `/api-docs` when server is running

**Verification Checklist** (complete before committing API changes):
- [ ] Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) updated
- [ ] Request DTOs documented with `@ApiProperty()` decorators
- [ ] Response DTOs documented with `@ApiProperty()` decorators
- [ ] Error responses documented (400, 401, 403, 404, 500)
- [ ] New endpoints tagged correctly in Swagger
- [ ] Deprecated endpoints marked with `@Deprecated()`
- [ ] Run server and verify `/api-docs` shows correct documentation
- [ ] Contract tests verify API matches documentation

**Rationale**: API documentation is the contract between backend and frontend. Outdated documentation causes integration issues and developer confusion. Synchronized documentation enables frontend teams to work independently without needing backend team clarification.

## Search & Filtering Requirements

### Multi-Parameter Search (NON-NEGOTIABLE)

The search endpoint MUST support filtering tasks by multiple parameters simultaneously.

**Rules**:
- Searchable fields: `title`, `description`, `status`, `assignee`, `labels`, `priority`
- Parameters MUST be composable (search by status + label + assignee)
- All searches MUST be scoped to authenticated user's projects only
- Partial matching on text fields (title, description)
- Exact matching on enum fields (status, priority)
- Label search uses tag intersection (tasks with ALL specified labels)
- Results MUST be paginated (max 100 items per page)
- Search endpoints MUST validate project ownership before querying

**Rationale**: Kanban boards require flexible filtering. Users need to find tasks by multiple criteria (e.g., "all high-priority tasks in BACKLOG for user X"). Complex search reduces manual filtering overhead.

### Search Implementation Pattern

```
GET /api/v1/search/tasks?status=BACKLOG&label=bug&assignee=user-id
  → Returns tasks matching ALL criteria
  → Scoped to user's accessible projects
  → Paginated response with metadata
```

## Governance

### Amendment Process

1. **Proposal**: Document proposed change with rationale in GitHub issue
2. **Review**: Team discusses impact on existing codebase
3. **Approval**: Consensus required (or tech lead decision)
4. **Version Bump**: Update constitution version per semantic versioning
5. **Migration Plan**: Document transition steps for breaking changes
6. **Update Artifacts**: Sync changes to templates (plan, spec, tasks)

### Versioning Policy

- **MAJOR**: Backward-incompatible changes (removed principle, redefined architecture, new mandatory requirements)
- **MINOR**: New principle added, expanded guidance, new section (backward compatible)
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

### Compliance Review

- **Code Reviews**: All PRs MUST verify constitution compliance
- **Architectural Review**: Violations of Layered Architecture or Base Class Inheritance block merge
- **Test Coverage**: PRs dropping coverage below 70% require additional tests
- **Security Audit**: Authentication, authorization, and input validation reviewed on sensitive changes
- **Workflow Review**: Task Status Workflow changes require explicit justification
- **API Documentation Review**: API changes MUST include documentation updates
- **Scope Review**: No frontend/UI components allowed in backend

### Complexity Justification

- **Violations**: Architecture violations require explicit justification in PR description
- **Simpler Alternatives**: Explorers must document why simpler approaches were rejected
- **Approval**: Tech lead must sign off on constitution exceptions

### Runtime Guidance

- **CLAUDE.md**: Primary implementation guidance for AI assistants
- **README.md**: Developer onboarding, architecture overview, commands
- **DATABASE.md**: Entity relationships, schema documentation
- **API Docs**: OpenAPI/Swagger at `/api-docs` when server running

### Enforcement

- **Pre-Merge Hooks**: Configure CI to run tests, linting, coverage checks (future)
- **Manual Review**: No bypassing architecture rules without explicit approval
- **Documentation**: All exceptions documented in code comments with constitution reference

**Version**: 1.2.0 | **Ratified**: 2026-02-13 | **Last Amended**: 2026-02-21
