# Tasks: Kanban Task Management System

**Input**: Design documents from `/specs/001-kanban/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md
**Checklists Integration**: Updated with gaps from api.md, test.md, ux.md

**Tests**: Test tasks included - specification emphasizes quality and comprehensive testing

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- **[CHK]**: Task generated from checklist gap (api.md, test.md, ux.md)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo with Nx**: `apps/`, `libs/` at repository root
- **Web client**: `apps/web/src/`
- **API server**: `apps/api/src/`
- **Shared types**: `libs/shared-types/src/`

---

## Phase 0: Research & Gap Analysis

**Purpose**: Resolve all NEEDS CLARIFICATION items from checklists before implementation begins

**Status**: ✅ COMPLETE

### API Design Research Tasks

- [X] T001 [P] [CHK-api] Research RESTful API endpoint patterns for Kanban resources (Projects, Tasks, Labels, Search, Archive)
- [X] T002 [P] [CHK-api] Research JSON request/response format standards (field naming, null handling, date format)
- [X] T003 [P] [CHK-api] Research error response format and HTTP status code usage guidelines
- [X] T004 [P] [CHK-api] Research JWT authentication mechanism best practices (Bearer token format, refresh strategy, token transmission)
- [X] T005 [P] [CHK-api] Research API versioning strategies for monorepo web applications
- [X] T006 [P] [CHK-api] Research pagination, filtering, and sorting patterns for TypeORM + PostgreSQL
- [X] T007 [P] [CHK-api] Research input validation patterns with class-validator + class-transformer
- [X] T008 [P] [CHK-api] Research caching strategies for Angular + Express applications (ETag, Cache-Control)
- [X] T009 [P] [CHK-api] Research rate limiting middleware for Express.js
- [X] T010 [P] [CHK-api] Research idempotency patterns for PUT operations and safe operation guidelines
- [X] T011 [P] [CHK-api] Research API performance targets and measurement strategies (p95, p99 latencies)

### Testing Research Tasks

- [X] T012 [P] [CHK-test] Research unit testing best practices for layered architecture (Controllers, Services, Repositories)
- [X] T013 [P] [CHK-test] Research integration testing patterns for API endpoints and database operations
- [X] T014 [P] [CHK-test] Research E2E testing with Cypress for authentication and task workflows
- [X] T015 [P] [CHK-test] Research performance testing strategies for drag-drop operations and search
- [X] T016 [P] [CHK-test] Research security testing for authentication, authorization, and input sanitization
- [X] T017 [P] [CHK-test] Research test automation and CI/CD integration patterns for Nx monorepo
- [X] T018 [P] [CHK-test] Research test data requirements for edge cases (overdue, long titles, special characters)
- [X] T019 [P] [CHK-test] Research test coverage targets and quality thresholds (unit, integration, E2E)

### UX Research Tasks

- [X] T020 [P] [CHK-ux] Research visual hierarchy and information density best practices for Kanban boards
- [X] T021 [P] [CHK-ux] Research loading, empty, and error state UX patterns for Angular applications
- [X] T022 [P] [CHK-ux] Research keyboard navigation and focus management standards (WCAG 2.1 compliance)
- [X] T023 [P] [CHK-ux] Research context preservation strategies for Angular Router navigation

### Research Documentation

- [X] T024 Create research.md with all research items R001-R023 documented with decisions and rationale
- [X] T025 Verify all NEEDS CLARIFICATION items from plan.md are resolved
- [X] T026 Verify constitution alignment post-research ( Principle IV: API contract types defined)

**Checkpoint**: ✅ Research complete - Phase 1 design can now begin

---

## Phase 1: Design & Contract Generation

**Purpose**: Generate design artifacts from research findings and feature spec

**Status**: ✅ COMPLETE

### Data Model Design

- [X] T026 [P] Create data-model.md with entity definitions (User, Project, Task, Label, TaskLabel, TaskArchive)
- [X] T027 [P] Document entity fields, types, validation rules in data-model.md
- [X] T028 [P] Document entity relationships (one-to-many, many-to-many) in data-model.md
- [X] T029 [P] Document database indexes for query performance in data-model.md
- [X] T030 [P] Document task status workflow and state transitions in data-model.md

### API Contract Generation

- [X] T031 [P] Create specs/001-kanban/contracts/ directory
- [X] T032 Generate contracts/openapi.yaml with OpenAPI 3.1 specification
- [X] T033 [P] Document authentication endpoints (register, login, refresh, logout) in openapi.yaml
- [X] T034 [P] Document project CRUD endpoints in openapi.yaml
- [X] T035 [P] Document task CRUD endpoints (including status update, complete, reactivate) in openapi.yaml
- [X] T036 [P] Document label CRUD endpoints (project-scoped) in openapi.yaml
- [X] T037 [P] Document search endpoint with pagination in openapi.yaml
- [X] T038 [P] Document archive endpoints (completed tasks list) in openapi.yaml
- [X] T039 [P] Define request/response DTOs for all endpoints in openapi.yaml
- [X] T040 [P] Define error response formats (400, 401, 403, 404, 409, 500) in openapi.yaml
- [X] T041 [P] Define authentication requirements for all endpoints in openapi.yaml
- [X] T042 [P] Define rate limiting specifications in openapi.yaml
- [X] T043 [P] Define pagination parameters for list endpoints in openapi.yaml

### Quickstart Guide

- [X] T044 Create quickstart.md with developer onboarding guide
- [X] T045 [P] Document prerequisites (Node.js, Docker, PostgreSQL) in quickstart.md
- [X] T046 [P] Document environment setup steps in quickstart.md
- [X] T047 [P] Document database setup (migration:run) in quickstart.md
- [X] T048 [P] Document development server startup (npm run dev) in quickstart.md
- [X] T049 [P] Document testing workflow (npm test, npm run test:e2e) in quickstart.md
- [X] T050 [P] Document common development tasks in quickstart.md
- [X] T051 [P] Document troubleshooting steps in quickstart.md

### Agent Context Update

- [X] T052 Run .specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
- [X] T053 Verify agent context file updated with new technologies from research

**Checkpoint**: ✅ Design artifacts complete - Phase 2 task generation can begin

---

## Phase 2: Setup (Shared Infrastructure)

**Purpose**: Nx monorepo initialization, TypeScript configuration, and basic project structure

**Status**: IN PROGRESS (T001-T012 already complete per git status)

- [X] T053 Initialize Nx workspace with Angular and Node.js applications at repository root
- [X] T054 Create apps/web Angular application with standalone components configuration in apps/web/
- [X] T055 Create apps/api Node.js/Express application in apps/api/
- [X] T056 [P] Configure TypeScript 5.x strict mode for all applications (tsconfig.base.json, apps/web/tsconfig.json, apps/api/tsconfig.json)
- [X] T057 [P] Create libs/shared-types library for shared TypeScript interfaces in libs/shared-types/
- [X] T058 [P] Configure ESLint and Prettier for code quality (.eslintrc.json, .prettierrc)
- [X] T059 [P] Configure Jest for unit testing (jest.config.js at root and per-app configs)
- [X] T060 [P] Configure Cypress for E2E testing in apps/web/
- [X] T061 [P] Setup Husky pre-commit hooks with lint-staged and commitlint
- [X] T062 [P] Create package.json scripts for dev, build, test, and migration commands
- [X] T063 [P] Create .env.example files for both apps (apps/api/.env.example, apps/web/.env.example)
- [X] T064 [P] Setup gitignore for node_modules, .env, dist, and build artifacts

---

## Phase 3: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & ORM

- [X] T065 Initialize TypeORM configuration in apps/api/src/config/database.ts
- [X] T066 [P] Create database connection factory with PostgreSQL support in apps/api/src/config/data-source.ts
- [X] T067 [P] Create initial database migration framework (apps/api/src/migrations/)
- [X] T068 [P] Configure TypeORM entities base directory in apps/api/src/models/

### Server-Side Foundation

- [X] T069 [P] Setup Express server configuration in apps/api/src/server.ts
- [X] T070 [P] Configure CORS middleware for client-server communication in apps/api/src/config/cors.ts
- [X] T071 [P] Setup global error handling middleware in apps/api/src/middleware/error-handler.ts
- [X] T072 [P] Setup request logging middleware in apps/api/src/middleware/logger.ts
- [X] T073 [P] Configure Winston logger in apps/api/src/config/logger.ts
- [X] T074 [P] Setup OpenAPI/Swagger documentation in apps/api/src/config/swagger.ts
- [X] T075 [P] Create base controller class with common error handling in apps/api/src/controllers/base.controller.ts
- [X] T076 [P] Create base repository class with common CRUD operations in apps/api/src/repositories/base.repository.ts
- [X] T077 [P] Create base service class with common business logic in apps/api/src/services/base.service.ts
- [X] T078 [P] Configure validation pipes and class-transformer in apps/api/src/config/validation.ts
- [X] T079 [P] Setup JWT authentication middleware in apps/api/src/middleware/auth.middleware.ts

### Client-Side Foundation

- [X] T080 [P] Setup Angular application configuration in apps/web/src/app/config/app.config.ts
- [X] T081 [P] Create HTTP client configuration with interceptors in apps/web/src/app/core/interceptors/
- [X] T082 [P] Create authentication interceptor for JWT token injection in apps/web/src/app/core/interceptors/auth.interceptor.ts
- [X] T083 [P] Create error handling interceptor in apps/web/src/app/core/interceptors/error.interceptor.ts
- [X] T084 [P] Create logging interceptor in apps/web/src/app/core/interceptors/logging.interceptor.ts
- [X] T085 [P] Setup Angular routing with lazy loading in apps/web/src/app/app.routes.ts
- [X] T086 [P] Create global error handler component in apps/web/src/app/shared/components/error-handler/
- [X] T087 [P] Create loading indicator component in apps/web/src/app/shared/components/loading/

### Shared Types

- [X] T088 [P] Create User interface in libs/shared-types/src/models/user.interface.ts
- [X] T089 [P] Create Project interface in libs/shared-types/src/models/project.interface.ts
- [X] T090 [P] Create Task interface and TaskStatus enum in libs/shared-types/src/models/task.interface.ts
- [X] T091 [P] Create Label interface in libs/shared-types/src/models/label.interface.ts
- [X] T092 [P] Create common DTOs (PaginationDto, ErrorResponse) in libs/shared-types/src/dto/common.dto.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 4: User Story 1 - User Authentication and Session Management (Priority: P1) 🎯 MVP

**Goal**: Users can securely register, log in, maintain authenticated sessions, and log out with JWT tokens and httpOnly cookies

**Independent Test**: Register a new user, verify auto-login, refresh page and verify session persists, log out and verify session termination, attempt login with invalid credentials and verify error message

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T093 [P] [US1] Contract test for POST /api/v1/auth/register in apps/api/tests/contract/auth.register.contract.test.ts
- [X] T094 [P] [US1] Contract test for POST /api/v1/auth/login in apps/api/tests/contract/auth.login.contract.test.ts
- [X] T095 [P] [US1] Contract test for POST /api/v1/auth/refresh in apps/api/tests/contract/auth.refresh.contract.test.ts
- [X] T096 [P] [US1] Integration test for registration-login-logout flow in apps/api/tests/integration/auth.flow.integration.test.ts
- [X] T097 [P] [US1] Unit test for UserService in apps/api/tests/unit/services/user.service.unit.test.ts
- [X] T098 [P] [US1] Unit test for AuthService in apps/api/tests/unit/services/auth.service.unit.test.ts
- [X] T099 [P] [US1] E2E test for authentication flow in apps/web/cypress/e2e/auth.cy.ts

### Implementation for User Story 1

#### Server-Side

- [X] T100 [P] [US1] Create User TypeORM entity in apps/api/src/models/user.entity.ts
- [X] T101 [P] [US1] Create UserRepository in apps/api/src/repositories/user.repository.ts
- [X] T102 [P] [US1] Create RegisterDto and LoginDto in apps/api/src/dto/auth.dto.ts
- [X] T103 [P] [US1] Create AuthResponseDto with accessToken and refreshToken in apps/api/src/dto/auth.dto.ts
- [X] T104 [US1] Implement AuthService with bcrypt password hashing and JWT token generation in apps/api/src/services/auth.service.ts (depends on T100, T101, T102, T103)
- [X] T105 [US1] Implement UserService in apps/api/src/services/user.service.ts (depends on T101)
- [X] T106 [US1] Create AuthController with register, login, refresh, and logout endpoints in apps/api/src/controllers/auth.controller.ts (depends on T104, T105)
- [X] T107 [US1] Implement JWT middleware for protected routes in apps/api/src/middleware/auth.middleware.ts (depends on T104)
- [X] T108 [US1] Implement refresh token rotation logic in apps/api/src/services/auth.service.ts (depends on T104)
- [X] T109 [US1] Add authentication routes to Express app in apps/api/src/main.ts

#### Client-Side

- [X] T110 [P] [US1] Create AuthService in apps/web/src/app/features/auth/services/auth.service.ts
- [X] T111 [P] [US1] Create AuthStore with BehaviorSubject for auth state in apps/web/src/app/features/auth/services/auth.store.ts
- [X] T112 [P] [US1] Create RegisterComponent with reactive form in apps/web/src/app/features/auth/components/register/register.component.ts
- [X] T113 [P] [US1] Create LoginComponent with reactive form in apps/web/src/app/features/auth/components/login/login.component.ts
- [X] T114 [P] [US1] Create password validator in apps/web/src/app/features/auth/validators/password.validator.ts
- [X] T115 [P] [US1] Create email validator in apps/web/src/app/features/auth/validators/email.validator.ts
- [X] T116 [US1] Implement JWT token storage with httpOnly cookie handling in apps/web/src/app/core/services/token.service.ts
- [X] T117 [US1] Create authentication guard for protected routes in apps/web/src/app/core/guards/auth.guard.ts
- [X] T118 [US1] Create auth routing module with lazy loading in apps/web/src/app/features/auth/routes/auth.routes.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 5: User Story 2 - Project Creation and Management (Priority: P1)

**Goal**: Users can create multiple projects, view project list, edit project details, and delete projects with confirmation

**Independent Test**: Create multiple projects, view project list, edit project name/description, delete empty project, delete project with tasks and verify warning, verify projects are isolated per user

### Tests for User Story 2

- [X] T119 [P] [US2] Contract test for GET /api/v1/projects in apps/api/tests/contract/projects.list.contract.test.ts
- [X] T120 [P] [US2] Contract test for POST /api/v1/projects in apps/api/tests/contract/projects.create.contract.test.ts
- [X] T121 [P] [US2] Contract test for PATCH /api/v1/projects/:id in apps/api/tests/contract/projects.update.contract.test.ts
- [X] T122 [P] [US2] Contract test for DELETE /api/v1/projects/:id in apps/api/tests/contract/projects.delete.contract.test.ts
- [X] T123 [P] [US2] Integration test for project CRUD flow in apps/api/tests/integration/projects.flow.integration.test.ts
- [X] T124 [P] [US2] Unit test for ProjectService in apps/api/tests/unit/services/project.service.unit.test.ts
- [X] T125 [P] [US2] E2E test for project management in apps/web/cypress/e2e/projects.cy.ts

### Implementation for User Story 2

#### Server-Side

- [X] T126 [P] [US2] Create Project TypeORM entity in apps/api/src/models/project.entity.ts
- [X] T127 [P] [US2] Create ProjectRepository in apps/api/src/repositories/project.repository.ts
- [X] T128 [P] [US2] Create CreateProjectDto and UpdateProjectDto in apps/api/src/dto/project.dto.ts
- [X] T129 [US2] Implement ProjectService in apps/api/src/services/project.service.ts (depends on T126, T127, T128)
- [X] T130 [US2] Create ProjectController with CRUD endpoints in apps/api/src/controllers/project.controller.ts (depends on T129)
- [X] T131 [US2] Add project ownership validation middleware in apps/api/src/middleware/project-ownership.middleware.ts
- [X] T132 [US2] Add pagination support to project list endpoint in apps/api/src/controllers/project.controller.ts

#### Client-Side

- [X] T133 [P] [US2] Create ProjectService in apps/web/src/app/features/projects/services/project.service.ts
- [X] T134 [P] [US2] Create ProjectStore with BehaviorSubject for project state in apps/web/src/app/features/projects/services/project.store.ts
- [X] T135 [P] [US2] Create ProjectListComponent in apps/web/src/app/features/projects/components/project-list/project-list.component.ts
- [X] T136 [P] [US2] Create ProjectCardComponent in apps/web/src/app/features/projects/components/project-card/project-card.component.ts
- [X] T137 [P] [US2] Create CreateProjectDialogComponent in apps/web/src/app/features/projects/components/create-project-dialog/create-project-dialog.component.ts
- [X] T138 [P] [US2] Create EditProjectDialogComponent in apps/web/src/app/features/projects/components/edit-project-dialog/edit-project-dialog.component.ts
- [X] T139 [P] [US2] Create DeleteProjectDialogComponent in apps/web/src/app/features/projects/components/delete-project-dialog/delete-project-dialog.component.ts
- [X] T140 [US2] Create project routing module with lazy loading in apps/web/src/app/features/projects/routes/projects.routes.ts
- [X] T141 [US2] Integrate auth guard for protected project routes in apps/web/src/app/features/projects/routes/projects.routes.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 6: User Story 3 - Task Creation and Management (Priority: P1) ✅ COMPLETE

**Goal**: Users can create tasks with title, description, due date, labels in backlog, view tasks in backlog table, edit tasks, and delete tasks

**Status**: ✅ COMPLETE

**Independent Test**: Create tasks with various attributes in backlog, view backlog table, click task to view details, edit task attributes, delete task, verify default status is "Backlog"

### Tests for User Story 3

- [X] T142 [P] [US3] Contract test for GET /api/v1/projects/:projectId/tasks in apps/api/tests/contract/tasks.list.contract.test.ts
- [X] T143 [P] [US3] Contract test for POST /api/v1/projects/:projectId/tasks in apps/api/tests/contract/tasks.create.contract.test.ts
- [X] T144 [P] [US3] Contract test for GET /api/v1/tasks/:id in apps/api/tests/contract/tasks.get.contract.test.ts
- [X] T145 [P] [US3] Contract test for PATCH /api/v1/tasks/:id in apps/api/tests/contract/tasks.update.contract.test.ts
- [X] T146 [P] [US3] Contract test for DELETE /api/v1/tasks/:id in apps/api/tests/contract/tasks.delete.contract.test.ts
- [X] T147 [P] [US3] Integration test for task CRUD flow in apps/api/tests/integration/tasks.flow.integration.test.ts
- [X] T148 [P] [US3] Unit test for TaskService in apps/api/tests/unit/services/task.service.unit.test.ts
- [X] T149 [P] [US3] E2E test for task management in apps/web/cypress/e2e/tasks.cy.ts

### Implementation for User Story 3

#### Server-Side

- [X] T150 [P] [US3] Create Task TypeORM entity in apps/api/src/models/task.entity.ts
- [X] T151 [P] [US3] Create TaskLabel junction table entity in apps/api/src/models/task-label.entity.ts
- [X] T152 [P] [US3] Create Label TypeORM entity in apps/api/src/models/label.entity.ts
- [X] T153 [P] [US3] Create TaskRepository in apps/api/src/repositories/task.repository.ts
- [X] T154 [P] [US3] Create LabelRepository in apps/api/src/repositories/label.repository.ts
- [X] T155 [P] [US3] Create CreateTaskDto and UpdateTaskDto in apps/api/src/dto/task.dto.ts
- [X] T156 [P] [US3] Create CreateLabelDto in apps/api/src/dto/label.dto.ts
- [X] T157 [US3] Implement TaskService in apps/api/src/services/task.service.ts (depends on T150, T151, T152, T153, T154, T155)
- [X] T158 [US3] Implement LabelService in apps/api/src/services/label.service.ts (depends on T152, T154, T156)
- [X] T159 [US3] Create TaskController with CRUD endpoints in apps/api/src/controllers/task.controller.ts (depends on T157)
- [X] T160 [US3] Create LabelController with CRUD endpoints in apps/api/src/controllers/label.controller.ts (depends on T158)
- [X] T161 [US3] Implement task label assignment logic in TaskService (depends on T157)
- [X] T162 [US3] Implement system-defined labels seeding on project creation in apps/api/src/services/project.service.ts

#### Client-Side

- [X] T163 [P] [US3] Create TaskService in apps/web/src/app/features/tasks/services/task.service.ts
- [X] T164 [P] [US3] Create TaskStore with BehaviorSubject for task state in apps/web/src/app/features/tasks/services/task.store.ts
- [X] T165 [P] [US3] Create LabelService in apps/web/src/app/features/labels/services/label.service.ts
- [X] T166 [P] [US3] Create BacklogTableComponent in apps/web/src/app/features/tasks/components/backlog-table/backlog-table.component.ts
- [X] T167 [P] [US3] Create TaskCardComponent for table rows in apps/web/src/app/features/tasks/components/task-card/task-card.component.ts
- [X] T168 [P] [US3] Create CreateTaskDialogComponent in apps/web/src/app/features/tasks/components/create-task-dialog/create-task-dialog.component.ts
- [X] T169 [P] [US3] Create EditTaskDialogComponent in apps/web/src/app/features/tasks/components/edit-task-dialog/edit-task-dialog.component.ts
- [X] T170 [P] [US3] Create DeleteTaskDialogComponent in apps/web/src/app/features/tasks/components/delete-task-dialog/delete-task-dialog.component.ts
- [X] T171 [P] [US3] Create LabelSelectorComponent in apps/web/src/app/features/labels/components/label-selector/label-selector.component.ts
- [X] T172 [P] [US3] Create CreateLabelDialogComponent in apps/web/src/app/features/labels/components/create-label-dialog/create-label-dialog.component.ts
- [X] T173 [US3] Create task routing module with lazy loading in apps/web/src/app/features/tasks/routes/tasks.routes.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: User Story 4 - Kanban Board Visualization and Task Movement (Priority: P1)

**Goal**: Users can view Kanban board with status columns, move tasks from backlog to board, drag tasks between columns to update status

**Independent Test**: Move task from backlog to "To Do" column, drag task between columns (To Do → In Progress → Review → Done), drag backward (Review → In Progress), drop in invalid location and verify revert, verify status updates

### Tests for User Story 4

- [ ] T174 [P] [US4] Integration test for Kanban board task movement in apps/api/tests/integration/kanban.movement.integration.test.ts
- [ ] T175 [P] [US4] Unit test for task status transitions in apps/api/tests/unit/services/task.status.unit.test.ts
- [ ] T176 [P] [US4] E2E test for drag-and-drop functionality in apps/web/cypress/e2e/kanban.cy.ts

### Implementation for User Story 4

#### Server-Side

- [ ] T177 [US4] Implement task status update logic in TaskService with validation (depends on T157)
- [ ] T178 [US4] Add task status transition validation (backward movement allowed) in apps/api/src/services/task.service.ts
- [ ] T179 [US4] Optimize task queries for board view (eager load labels, group by status) in apps/api/src/repositories/task.repository.ts

#### Client-Side

- [ ] T180 [P] [US4] Create KanbanBoardComponent in apps/web/src/app/features/tasks/components/kanban-board/kanban-board.component.ts
- [ ] T181 [P] [US4] Create KanbanColumnComponent in apps/web/src/app/features/tasks/components/kanban-column/kanban-column.component.ts
- [ ] T182 [P] [US4] Create KanbanTaskCardComponent for draggable tasks in apps/web/src/app/features/tasks/components/kanban-task-card/kanban-task-card.component.ts
- [ ] T183 [US4] Implement Angular CDK drag-drop functionality in KanbanBoardComponent (depends on T180, T181, T182)
- [ ] T184 [US4] Implement drop zone logic for status column transitions in KanbanBoardComponent (depends on T183)
- [ ] T185 [US4] Implement visual feedback during drag operations in KanbanBoardComponent
- [ ] T186 [US4] Add task reordering within columns in KanbanBoardComponent
- [ ] T187 [US4] Create move-to-board animation in KanbanBoardComponent

**Checkpoint**: Kanban board with full drag-and-drop functionality now working

---

## Phase 8: User Story 5 - Task Completion and Archiving (Priority: P2)

**Goal**: Users can mark tasks as completed (removed from board, moved to archive), view completed tasks, reactivate completed tasks

**Independent Test**: Mark task as completed and verify removal from board, navigate to archive section and view completed tasks with completion date, reactivate task and verify return to previous status

### Tests for User Story 5

- [ ] T188 [P] [US5] Contract test for POST /api/v1/tasks/:id/complete in apps/api/tests/contract/tasks.complete.contract.test.ts
- [ ] T189 [P] [US5] Contract test for POST /api/v1/tasks/:id/reactivate in apps/api/tests/contract/tasks.reactivate.contract.test.ts
- [ ] T190 [P] [US5] Contract test for GET /api/v1/tasks/completed in apps/api/tests/contract/tasks.completed-list.contract.test.ts
- [ ] T191 [P] [US5] Integration test for task completion and archiving flow in apps/api/tests/integration/tasks.archive.integration.test.ts
- [ ] T192 [P] [US5] E2E test for task archiving in apps/web/cypress/e2e/archive.cy.ts

### Implementation for User Story 5

#### Server-Side

- [ ] T193 [US5] Implement task completion endpoint in TaskController (sets completedAt timestamp) (depends on T157)
- [ ] T194 [US5] Implement task reactivation endpoint in TaskController (restores previous status) (depends on T157)
- [ ] T195 [US5] Implement completed tasks list endpoint with pagination in TaskController (depends on T157)
- [ ] T196 [US5] Update task queries to filter out completed tasks from board view in TaskRepository

#### Client-Side

- [ ] T197 [P] [US5] Create CompletedTasksComponent in apps/web/src/app/features/tasks/components/completed-tasks/completed-tasks.component.ts
- [ ] T198 [P] [US5] Create TaskArchiveListComponent in apps/web/src/app/features/tasks/components/task-archive-list/task-archive-list.component.ts
- [ ] T199 [P] [US5] Create ReactivateTaskDialogComponent in apps/web/src/app/features/tasks/components/reactivate-task-dialog/reactivate-task-dialog.component.ts
- [ ] T200 [US5] Add complete task button to KanbanTaskCardComponent
- [ ] T201 [US5] Add navigation to archive section in task routing

**Checkpoint**: Task completion and archiving functionality complete

---

## Phase 9: User Story 6 - Global Task Search (Priority: P2)

**Goal**: Users can search for tasks across all projects by keyword in title/description/labels, view results with project context

**Independent Test**: Create tasks with specific keywords across multiple projects, search for keywords, verify results from all projects, click result to navigate to task detail, search with no results and verify message

### Tests for User Story 6

- [ ] T202 [P] [US6] Contract test for GET /api/v1/search/tasks in apps/api/tests/contract/search.tasks.contract.test.ts
- [ ] T203 [P] [US6] Integration test for search across projects in apps/api/tests/integration/search.integration.test.ts
- [ ] T204 [P] [US6] Unit test for search query optimization in apps/api/tests/unit/services/search.service.unit.test.ts
- [ ] T205 [P] [US6] E2E test for search functionality in apps/web/cypress/e2e/search.cy.ts

### Implementation for User Story 6

#### Server-Side

- [ ] T206 [P] [US6] Create SearchService in apps/api/src/services/search.service.ts
- [ ] T207 [US6] Implement full-text search across task title and description in SearchService (depends on T206)
- [ ] T208 [US6] Implement label-based search in SearchService (depends on T206)
- [ ] T209 [US6] Implement project-filtered search in SearchService (depends on T206)
- [ ] T210 [US6] Create SearchController with search endpoint in apps/api/src/controllers/search.controller.ts (depends on T206, T207, T208, T209)
- [ ] T211 [US6] Add database indexes for search performance in apps/api/src/migrations/

#### Client-Side

- [ ] T212 [P] [US6] Create SearchService in apps/web/src/app/features/search/services/search.service.ts
- [ ] T213 [P] [US6] Create SearchBarComponent in apps/web/src/app/shared/components/search-bar/search-bar.component.ts
- [ ] T214 [P] [US6] Create SearchResultsComponent in apps/web/src/app/features/search/components/search-results/search-results.component.ts
- [ ] T215 [P] [US6] Create SearchResultItemComponent in apps/web/src/app/features/search/components/search-result-item/search-result-item.component.ts
- [ ] T216 [US6] Implement debounced search input in SearchBarComponent
- [ ] T217 [US6] Add search route and navigation in apps/web/src/app/features/search/routes/search.routes.ts

**Checkpoint**: Global search across all projects complete

---

## Phase 10: User Story 7 - Detailed Task View and Editing (Priority: P2)

**Goal**: Users can view dedicated task detail page with all information, edit any aspect, navigate back to previous context

**Independent Test**: Navigate to task detail from board/backlog/search, view all task information, edit fields and save, navigate back to previous context, verify changes reflected across all views

### Tests for User Story 7

- [ ] T218 [P] [US7] Integration test for task detail view and editing in apps/api/tests/integration/tasks.detail.integration.test.ts
- [ ] T219 [P] [US7] Unit test for task detail DTO mapping in apps/api/tests/unit/dto/task.dto.unit.test.ts
- [ ] T220 [P] [US7] E2E test for task detail view in apps/web/cypress/e2e/task-detail.cy.ts

### Implementation for User Story 7

#### Server-Side

- [ ] T221 [US7] Ensure task detail endpoint returns all related data (labels, project) in TaskController

#### Client-Side

- [ ] T222 [P] [US7] Create TaskDetailComponent in apps/web/src/app/features/tasks/components/task-detail/task-detail.component.ts
- [ ] T223 [P] [US7] Create TaskDetailHeaderComponent in apps/web/src/app/features/tasks/components/task-detail-header/task-detail-header.component.ts
- [ ] T224 [P] [US7] Create TaskDetailMetaComponent (dates, project) in apps/web/src/app/features/tasks/components/task-detail-meta/task-detail-meta.component.ts
- [ ] T225 [P] [US7] Create EditTaskDetailComponent in apps/web/src/app/features/tasks/components/edit-task-detail/edit-task-detail.component.ts
- [ ] T226 [US7] Implement navigation state preservation for back navigation in TaskDetailComponent
- [ ] T227 [US7] Add task detail route with parameter in apps/web/src/app/features/tasks/routes/tasks.routes.ts

**Checkpoint**: All user stories now complete

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, addressing checklist gaps

### Performance Optimization

- [ ] T228 [P] Add virtual scrolling to KanbanColumnComponent in apps/web/src/app/features/tasks/components/kanban-column/ (for large task lists)
- [ ] T229 [P] Add virtual scrolling to BacklogTableComponent in apps/web/src/app/features/tasks/components/backlog-table/
- [ ] T230 [P] Implement query result caching in TaskRepository in apps/api/src/repositories/task.repository.ts
- [ ] T231 [P] Add database connection pooling configuration in apps/api/src/config/database.ts
- [ ] T232 [P] Optimize drag-drop performance with trackBy functions in KanbanBoardComponent

### Security Hardening

- [ ] T233 [P] Add rate limiting middleware for authentication endpoints in apps/api/src/middleware/rate-limit.middleware.ts
- [ ] T234 [P] Add input sanitization for all user inputs in apps/api/src/dto/
- [ ] T235 [P] Add CSRF protection for state-changing operations in apps/api/src/middleware/csrf.middleware.ts
- [ ] T236 [P] Add SQL injection prevention tests in apps/api/tests/unit/security/
- [ ] T237 [P] Add XSS prevention tests in apps/web/cypress/e2e/security/

### Error Handling & Edge Cases

- [ ] T238 [P] Add handling for overdue task visual highlighting in KanbanTaskCardComponent
- [ ] T239 [P] Add handling for session expiry during task editing in apps/web/src/app/core/interceptors/error.interceptor.ts
- [ ] T240 [P] Add validation for moving tasks from backlog directly to Done (warning only) in TaskService
- [ ] T241 [P] Add handling for duplicate label names within project (unique constraint) in LabelService
- [ ] T242 [P] Add handling for deleting projects with tasks (cascade deletion) in ProjectService
- [ ] T243 [P] Add handling for very long task titles/descriptions (truncation) in TaskCardComponent

### Loading, Empty, and Error States (UX Checklist)

- [ ] T244 [P] [CHK-ux] Add loading state components for async operations in apps/web/src/app/shared/components/loading-states/
- [ ] T245 [P] [CHK-ux] Add empty state components for zero projects/tasks/results in apps/web/src/app/shared/components/empty-states/
- [ ] T246 [P] [CHK-ux] Add error state components with user-friendly messaging in apps/web/src/app/shared/components/error-states/
- [ ] T247 [P] [CHK-ux] Implement loading indicators for Kanban board refresh
- [ ] T248 [P] [CHK-ux] Implement empty state messaging for project list, backlog, search results
- [ ] T249 [P] [CHK-ux] Implement error state UI for failed operations (delete, move task, save)
- [ ] T250 [P] [CHK-ux] Add success feedback for confirmable actions (task created, task moved, task deleted)

### Visual Hierarchy & Information Density (UX Checklist)

- [ ] T251 [P] [CHK-ux] Define visual hierarchy for Kanban task cards (title priority, labels, due date)
- [ ] T252 [P] [CHK-ux] Define visual hierarchy for task detail view (field ordering, grouping)
- [ ] T253 [P] [CHK-ux] Implement information density limits for task cards (max visible without scroll)
- [ ] T254 [P] [CHK-ux] Add visual distinction for overdue tasks on board
- [ ] T255 [P] [CHK-ux] Implement task card hover state with additional actions/metadata

### Keyboard Navigation & Accessibility (UX Checklist)

- [ ] T256 [P] [CHK-ux] Add keyboard navigation support for all interactive elements (tab order, arrow keys)
- [ ] T257 [P] [CHK-ux] Implement focus management when opening/closing task detail view
- [ ] T258 [P] [CHK-ux] Add visible focus indicators for all interactive elements
- [ ] T259 [P] [CHK-ux] Implement keyboard shortcuts for common actions (create task, search, navigate)
- [ ] T260 [P] [CHK-ux] Add focus trap/escape for modal dialogs

### Context Preservation (UX Checklist)

- [ ] T261 [P] [CHK-ux] Implement scroll position preservation when navigating between views
- [ ] T262 [P] [CHK-ux] Implement active filter preservation when navigating to/from search
- [ ] T263 [P] [CHK-ux] Add back navigation context preservation from task detail view

### Documentation

- [ ] T264 [P] Update API documentation with all implemented endpoints in apps/api/src/config/swagger.ts
- [ ] T265 [P] Add code comments to complex business logic in services
- [ ] T266 [P] Create README for client app in apps/web/README.md
- [ ] T267 [P] Create README for server app in apps/api/README.md

### Quality Assurance

- [ ] T268 [P] Run all unit tests and verify 70%+ coverage in apps/api/ and apps/web/
- [ ] T269 [P] Run all integration tests and verify pass rate in apps/api/tests/integration/
- [ ] T270 [P] Run all E2E tests and verify pass rate in apps/web/cypress/e2e/
- [ ] T271 [P] Run ESLint and fix all warnings across all apps
- [ ] T272 [P] Run quickstart.md validation and verify all steps work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Research)**: No dependencies - can start immediately
- **Phase 1 (Design)**: Depends on Phase 0 completion
- **Phase 2 (Setup)**: No dependencies - can run in parallel with Phase 0
- **Phase 3 (Foundational)**: Depends on Phase 2 completion - BLOCKS all user stories
- **User Stories (Phase 4-10)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 3) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 3) - No dependencies on other stories (projects independent)
- **User Story 3 (P1)**: Can start after Foundational (Phase 3) - No dependencies on other stories (but needs US2 projects to create tasks)
- **User Story 4 (P1)**: Depends on User Story 3 completion (needs tasks to move on board)
- **User Story 5 (P2)**: Depends on User Story 4 completion (extends board functionality)
- **User Story 6 (P2)**: Can start after User Story 3 completion (needs tasks to search)
- **User Story 7 (P2)**: Can start after User Story 3 completion (needs tasks to view)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models/entities before repositories
- Repositories before services
- DTOs before controllers
- Services before controllers
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Phase 0 research tasks (T001-T023) can run in parallel
- All Phase 1 design tasks marked [P] can run in parallel
- All Setup tasks (T053-T064) can run in parallel
- All Foundational tasks marked [P] can run in parallel within their category (database, server, client, shared types)
- Once Foundational phase completes, User Stories 1, 2, 3 can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models/entities within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1 (Authentication)

```bash
# Launch all contract tests together:
T093: "Contract test for POST /api/v1/auth/register in apps/api/tests/contract/auth.register.contract.test.ts"
T094: "Contract test for POST /api/v1/auth/login in apps/api/tests/contract/auth.login.contract.test.ts"
T095: "Contract test for POST /api/v1/auth/refresh in apps/api/tests/contract/auth.refresh.contract.test.ts"

# Launch all integration/unit tests together:
T096: "Integration test for registration-login-logout flow"
T097: "Unit test for UserService"
T098: "Unit test for AuthService"
T099: "E2E test for authentication flow"

# After tests fail, launch implementation in parallel:
T100: "Create User TypeORM entity"
T101: "Create UserRepository"
T102: "Create RegisterDto and LoginDto"
T103: "Create AuthResponseDto"

# Then services that depend on above:
T104: "Implement AuthService"
T105: "Implement UserService"

# Then controllers and client components in parallel:
T106: "Create AuthController"
T110: "Create RegisterComponent"
T111: "Create LoginComponent"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 0: Research (T001-T024)
2. Complete Phase 1: Design (T026-T053)
3. Complete Phase 2: Setup (T053-T064)
4. Complete Phase 3: Foundational (T065-T092) - CRITICAL
5. Complete Phase 4: User Story 1 - Authentication (T093-T118)
6. Complete Phase 5: User Story 2 - Projects (T119-T141)
7. Complete Phase 6: User Story 3 - Tasks (T142-T173)
8. **STOP and VALIDATE**: Test authentication + projects + tasks independently
9. Deploy/demo MVP (users can register, create projects, create tasks in backlog)

### Incremental Delivery (P1 Stories - Complete MVP)

1. Complete Phase 0 + Phase 1 + Phase 2 + Phase 3 → Foundation ready
2. Add User Story 1 (Authentication) → Test independently → Deploy/Demo
3. Add User Story 2 (Projects) → Test independently → Deploy/Demo
4. Add User Story 3 (Tasks) → Test independently → Deploy/Demo
5. Add User Story 4 (Kanban Board) → Test independently → Deploy/Demo (MVP COMPLETE!)
6. Add User Story 5 (Archive) → Test independently → Deploy/Demo
7. Add User Story 6 (Search) → Test independently → Deploy/Demo
8. Add User Story 7 (Detail View) → Test independently → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 0 + Phase 1 + Phase 2 + Phase 3 together
2. Once Phase 3 is done:
   - Developer A: User Story 1 (Authentication) - T093-T118
   - Developer B: User Story 2 (Projects) - T119-T141
   - Developer C: User Story 3 (Tasks + Labels) - T142-T173
3. After P1 stories complete:
   - Developer A: User Story 4 (Kanban Board) - T174-T187
   - Developer B: User Story 5 (Archive) - T188-T201
   - Developer C: User Story 6 (Search) - T202-T217
4. Polish phase: All developers work on T228-T272 in parallel

---

## Summary

**Total Tasks**: 272 (increased from 200 to incorporate checklist gaps)

**Tasks per Phase**:
- Phase 0 (Research): 24 tasks (T001-T024) - **NEW**
- Phase 1 (Design): 28 tasks (T026-T053) - **NEW**
- Phase 2 (Setup): 12 tasks (T053-T064)
- Phase 3 (Foundational): 28 tasks (T065-T092)
- Phase 4 (US1 - Authentication): 26 tasks (T093-T118)
- Phase 5 (US2 - Projects): 23 tasks (T119-T141)
- Phase 6 (US3 - Tasks): 32 tasks (T142-T173)
- Phase 7 (US4 - Kanban Board): 14 tasks (T174-T187)
- Phase 8 (US5 - Archive): 14 tasks (T188-T201)
- Phase 9 (US6 - Search): 16 tasks (T202-T217)
- Phase 10 (US7 - Detail View): 10 tasks (T218-T227)
- Phase 11 (Polish): 45 tasks (T228-T272) - **EXPANDED**

**Tasks per User Story**:
- User Story 1 (Authentication): 26 tasks (T093-T118)
- User Story 2 (Projects): 23 tasks (T119-T141)
- User Story 3 (Tasks): 32 tasks (T142-T173)
- User Story 4 (Kanban Board): 14 tasks (T174-T187)
- User Story 5 (Archive): 14 tasks (T188-T201)
- User Story 6 (Search): 16 tasks (T202-T217)
- User Story 7 (Detail View): 10 tasks (T218-T227)

**Parallel Opportunities**: 70+ tasks marked [P] can run in parallel within their phases

**Independent Test Criteria**:
- Each user story has clear independent test criteria
- All stories have comprehensive test coverage (contract, integration, unit, E2E)
- MVP scope: User Stories 1-3 deliver authentication + projects + tasks

**Suggested MVP Scope**: User Stories 1-3 (Authentication, Projects, Tasks) - 81 tasks total
- Delivers: Users can register, create projects, create tasks in backlog
- Value: Core value proposition without Kanban board visualization
- Can be demoed and validated before investing in drag-drop UI

**Checklist Integration**:
- **API Design**: 23 new tasks from api.md checklist gaps (T001-T011 in Phase 0)
- **Testing**: 8 new tasks from test.md checklist gaps (T012-T019 in Phase 0)
- **UX**: 18 new tasks from ux.md checklist gaps (T020-T023 in Phase 0, T244-T263 in Phase 11)
- **Total new tasks from checklists**: 49 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- [CHK-api] label = from API checklist gap
- [CHK-test] label = from Testing checklist gap
- [CHK-ux] label = from UX checklist gap
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Test coverage target: 70%+ (as specified in constitution)
- Performance targets: Drag < 1s, Search < 2s, Task detail < 1s, Completion < 500ms
- **NEW**: Phase 0 research MUST be completed before Phase 1 design can begin
- **NEW**: Checklist gaps have been integrated as explicit tasks in Phase 0 and Phase 11
