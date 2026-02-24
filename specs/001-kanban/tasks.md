# Tasks: Kanban Board Authentication and Management

**Input**: Design documents from `/specs/001-kanban/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Тесты включены в этот план - coverage target 70%+

**Organization**: Задачи организованы по user stories для независимой реализации и тестирования каждой истории.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Может выполняться параллельно (разные файлы, без зависимостей)
- **[Story]**: Какой user story принадлежит задача (например, US1, US2, US3)
- Включены точные пути к файлам

## Path Conventions

- **Single project**: `src/`, `tests/` в корне репозитория
- Все пути указаны относительно корня проекта `/home/user/kanban_backend`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Инициализация проекта и базовой структуры. Поскольку проект уже существует, эта фаза фокусируется на подготовке окружения для Kanban-функционала.

- [X] T001 Создать структуру директорий для board-specific компонентов в src/dto/board/, src/dto/task/
- [X] T002 [P] Обновить .env.example с переменными для JWT_SECRET, JWT_REFRESH_SECRET с комментариями о минимальной длине 32 символа
- [X] T003 [P] Установить зависимости express-rate-limit для rate limiting (если ещё не установлены)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Базовая инфраструктура, которая ДОЛЖНА быть завершена перед реализацией ЛЮБОГО user story.

**⚠️ CRITICAL**: Никакая работа над user stories не может начаться до завершения этой фазы

### Config & Utilities

- [X] T004 [P] Создать rate limiter конфигурацию в src/config/rate-limiter.ts (auth: 10 req/min, API: 100 req/min)
- [X] T005 [P] Обновить Winston logger в src/config/logger.ts для поддержки structured logging с correlation ID

### Base Entities

- [X] T006 [P] Создать Board entity в src/models/board.entity.ts с UUID v4, полями title, description, ownerId, createdAt, updatedAt
- [X] T007 [P] Обновить User entity в src/models/user.entity.ts с полями failedLoginAttempts, lockedUntil, refreshToken
- [X] T008 [P] Создать Task entity в src/models/task.entity.ts с enum TaskStatus/TaskPriority, полями title, description, status, priority, boardId, createdAt, updatedAt
- [X] T009 Зарегистрировать новые entities в TypeORM DataSource в src/config/data-source.ts

### Enums & Types

- [X] T010 [P] Создать enum TaskStatus в src/enums/task-status.enum.ts (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)
- [X] T011 [P] Создать enum TaskPriority в src/enums/task-priority.enum.ts (LOW, MEDIUM, HIGH, CRITICAL)

### Base Classes Update

- [X] T012 Обновить BaseController в src/controllers/base.controller.ts с методами для rate limit headers
- [X] T013 Обновить BaseRepository в src/repositories/base.repository.ts для поддержки cascade delete транзакций

### Migrations

- [X] T014 Сгенерировать миграцию для User entity изменений (failedLoginAttempts, lockedUntil, refreshToken)
- [X] T015 Сгенерировать миграцию для Board entity
- [X] T016 Сгенерировать миграцию для Task entity с enums

**Checkpoint**: Foundation ready - можно начинать реализацию user stories

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Пользователи могут регистрироваться, входить в систему, обновлять токены и выходить. Пароли защищены bcrypt, аккаунты блокируются после 5 неудачных попыток.

**Independent Test**: Можно полностью протестировать через API endpoints для auth, проверяя успешную аутентификацию (получение токена), неуспешную (ошибка при неверных данных), блокировку аккаунта и refresh токен.

**Acceptance Scenarios**:
1. Успешная регистрация возвращает user данные
2. Успешный вход возвращает accessToken + refreshToken
3. Неверный логин/пароль возвращает 401
4. 5 неудачных попыток блокируют аккаунт на 15 минут
5. Refresh токен обновляет access токен
6. Logout удаляет refresh токен

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T017 [P] [US1] Contract test для POST /auth/register в tests/contract/auth.spec.ts
- [X] T018 [P] [US1] Contract test для POST /auth/login в tests/contract/auth.spec.ts
- [X] T019 [P] [US1] Contract test для POST /auth/refresh в tests/contract/auth.spec.ts
- [X] T020 [P] [US1] Contract test для POST /auth/logout в tests/contract/auth.spec.ts
- [X] T021 [P] [US1] Integration test для регистрации и логина в tests/integration/auth.spec.ts
- [X] T022 [P] [US1] Integration test для блокировки аккаунта после 5 неудачных попыток в tests/integration/auth.spec.ts
- [X] T023 [P] [US1] Integration test для refresh токена в tests/integration/auth.spec.ts
- [X] T024 [P] [US1] Integration test для logout в tests/integration/auth.spec.ts
- [X] T025 [P] [US1] Unit test для UserService хеширования паролей в tests/unit/user.service.spec.ts
- [X] T026 [P] [US1] Unit test для AuthService JWT генерации в tests/unit/auth.service.spec.ts

### Implementation for User Story 1

#### DTOs

- [X] T027 [P] [US1] Создать RegisterDto в src/dto/auth/register.dto.ts с валидацией login (3-255 chars) и password (8+ chars, 1 uppercase, 1 lowercase, 1 digit)
- [X] T028 [P] [US1] Создать LoginDto в src/dto/auth/login.dto.ts с валидацией login и password
- [X] T029 [P] [US1] Создарить RefreshTokenDto в src/dto/auth/refresh-token.dto.ts
- [X] T030 [P] [US1] Создать AuthResponseDto в src/dto/auth/auth-response.dto.ts с полями accessToken, refreshToken

#### Repository

- [X] T031 [US1] Обновить UserRepository в src/repositories/user.repository.ts с методами findByLogin, incrementFailedAttempts, lockAccount, resetFailedAttempts, setRefreshToken, removeRefreshToken

#### Service

- [X] T032 [US1] Обновить UserService в src/services/user.service.ts с методом create для регистрации с bcrypt хешированием (12 rounds)
- [X] T033 [US1] Обновить AuthService в src/services/auth.service.ts с методами:
  - login (валидация пароля, проверка блокировки, генерация JWT токенов)
  - register (создание пользователя)
  - refresh (валидация refresh токена, генерация нового access токена)
  - logout (удаление refresh токена)
  - verifyAccountLock (проверка lockedUntil)

#### Middleware

- [X] T034 [P] [US1] Создать authenticate middleware в src/middleware/authenticate.ts для валидации JWT Bearer токена
- [X] T035 [P] [US1] Создать rate limiter middleware для auth endpoints в src/middleware/auth-rate-limit.ts

#### Controller

- [X] T036 [US1] Обновить AuthController в src/controllers/auth.controller.ts с эндпоинтами:
  - POST /auth/register (регистрация)
  - POST /auth/login (вход с проверкой блокировки)
  - POST /auth/refresh (обновление токена)
  - POST /auth/logout (выход с инвалидацией токена)

#### Routes

- [X] T037 [US1] Зарегистрировать auth routes в src/main.ts с применением rate limiter middleware

#### Swagger Documentation

- [X] T038 [US1] Добавить Swagger декораторы в AuthController (зависит от T036)
- [X] T039 [US1] Добавить @ApiProperty() декораторы во все Auth DTOs (зависит от T027-T030)

**Checkpoint**: User Story 1 полностью функциональна и независимо тестируема. Пользователи могут регистрироваться, входить, обновлять токены и выходить.

---

## Phase 4: User Story 2 - Board Management (Priority: P2)

**Goal**: Пользователи могут создавать, просматривать, редактировать и удалять свои доски. Каждая доска принадлежит только одному пользователю, данные изолированы между пользователями.

**Independent Test**: Можно протестировать CRUD операции для досок независимо от задач. Создаём доску, проверяем что она появилась, редактируем, удаляем. Проверяем изоляцию - пользователь видит только свои доски.

**Acceptance Scenarios**:
1. Создание доски с title и description сохраняет доску для пользователя
2. Список досок возвращает только доски текущего пользователя
3. Редактирование title/description сохраняет изменения
4. Удаление доски удаляет все связанные задачи (cascade)
5. Попытка доступа к чужой доске возвращает 403

### Tests for User Story 2 ⚠️

- [X] T040 [P] [US2] Contract test для GET /boards в tests/contract/board.spec.ts
- [X] T041 [P] [US2] Contract test для POST /boards в tests/contract/board.spec.ts
- [X] T042 [P] [US2] Contract test для GET /boards/:id в tests/contract/board.spec.ts
- [X] T043 [P] [US2] Contract test для PATCH /boards/:id в tests/contract/board.spec.ts
- [X] T044 [P] [US2] Contract test для DELETE /boards/:id в tests/contract/board.spec.ts
- [X] T045 [P] [US2] Integration test для CRUD досок в tests/integration/board.spec.ts
- [X] T046 [P] [US2] Integration test для изоляции пользователей в tests/integration/board.spec.ts
- [X] T047 [P] [US2] Integration test для cascade delete доски с задачами в tests/integration/board.spec.ts
- [X] T048 [P] [US2] Integration test для лимита 100 досок на пользователя в tests/integration/board.spec.ts
- [X] T049 [P] [US2] Unit test для BoardService в tests/unit/board.service.spec.ts

### Implementation for User Story 2

#### DTOs

- [X] T050 [P] [US2] Создать CreateBoardDto в src/dto/board/create-board.dto.ts с валидацией title (не пустой, max 255), description (nullable, max 5000)
- [X] T051 [P] [US2] Создать UpdateBoardDto в src/dto/board/update-board.dto.ts с опциональными полями title, description
- [X] T052 [P] [US2] Создать BoardResponseDto в src/dto/board/board-response.dto.ts

#### Repository

- [X] T053 [US2] Создать BoardRepository в src/repositories/board.repository.ts extending BaseRepository с методами findByOwner, countByOwner

#### Service

- [X] T054 [US2] Создать BoardService в src/services/board.service.ts extending BaseService с методами:
  - create (создание доски для пользователя с проверкой лимита 100)
  - findByOwner (получение досок пользователя с пагинацией)
  - findById (получение доски с проверкой владения)
  - update (обновление доски с проверкой владения)
  - delete (удаление доски с cascade delete задач в транзакции)
  - validateOwnership (проверка что доска принадлежит пользователю)

#### Middleware

- [X] T055 [P] [US2] Создать validateBoardOwnership middleware в src/middleware/validate-board-ownership.ts для проверки req.user.id === board.ownerId

#### Controller

- [X] T056 [US2] Создать BoardController в src/controllers/board.controller.ts extending BaseController с эндпоинтами:
  - GET /boards (список досок пользователя с пагинацией)
  - POST /boards (создание доски)
  - GET /boards/:id (получение доски)
  - PATCH /boards/:id (обновление доски)
  - DELETE /boards/:id (удаление доски)

#### Routes

- [X] T057 [US2] Зарегистрировать board routes в src/main.ts с authenticate и validateBoardOwnership middleware

#### Swagger Documentation

- [X] T058 [US2] Добавить Swagger декораторы в BoardController (зависит от T056)
- [X] T059 [US2] Добавить @ApiProperty() декораторы во все Board DTOs (зависит от T050-T052)

**Checkpoint**: User Stories 1 И 2 работают независимо. Пользователи могут аутентифицироваться и управлять своими досками с полной изоляцией данных.

---

## Phase 5: User Story 3 - Task Management (Priority: P3)

**Goal**: Пользователи могут создавать, просматривать, редактировать и удалять задачи в рамках своих досок. Задачи по умолчанию создаются со статусом BACKLOG и приоритетом MEDIUM.

**Independent Test**: Можно протестировать CRUD операции для задач в рамках одной доски. Создаём задачу, проверяем что она появилась с дефолтными значениями, редактируем, удаляем. Проверяем изоляцию по доскам.

**Acceptance Scenarios**:
1. Создание задачи с title (без status/priority) устанавливает BACKLOG и MEDIUM по умолчанию
2. Список задач доски возвращает только задачи этой доски
3. Редактирование title, description, priority сохраняет изменения
4. Удаление задачи удаляет её из системы
5. Попытка доступа к задаче чужой доски возвращает 403
6. Лимит 1000 задач на доску

### Tests for User Story 3 ⚠️

- [ ] T060 [P] [US3] Contract test для GET /boards/:boardId/tasks в tests/contract/task.spec.ts
- [ ] T061 [P] [US3] Contract test для POST /boards/:boardId/tasks в tests/contract/task.spec.ts
- [ ] T062 [P] [US3] Contract test для GET /tasks/:id в tests/contract/task.spec.ts
- [ ] T063 [P] [US3] Contract test для PATCH /tasks/:id в tests/contract/task.spec.ts
- [ ] T064 [P] [US3] Contract test для DELETE /tasks/:id в tests/contract/task.spec.ts
- [ ] T065 [P] [US3] Integration test для CRUD задач в tests/integration/task.spec.ts
- [ ] T066 [P] [US3] Integration test для дефолтных значений (BACKLOG, MEDIUM) в tests/integration/task.spec.ts
- [ ] T067 [P] [US3] Integration test для изоляции по доскам в tests/integration/task.spec.ts
- [ ] T068 [P] [US3] Integration test для лимита 1000 задач на доску в tests/integration/task.spec.ts
- [ ] T069 [P] [US3] Unit test для TaskService в tests/unit/task.service.spec.ts

### Implementation for User Story 3

#### DTOs

- [ ] T070 [P] [US3] Создать CreateTaskDto в src/dto/task/create-task.dto.ts с валидацией title (не пустой, max 255), description (nullable, max 5000), status (enum, default BACKLOG), priority (enum, default MEDIUM)
- [ ] T071 [P] [US3] Создать UpdateTaskDto в src/dto/task/update-task.dto.ts с опциональными полями title, description, status, priority
- [ ] T072 [P] [US3] Создать TaskResponseDto в src/dto/task/task-response.dto.ts

#### Repository

- [ ] T073 [US3] Обновить TaskRepository в src/repositories/task.repository.ts с методами findByBoard, countByBoard, findByBoardWithFilters (status, priority)

#### Service

- [ ] T074 [US3] Обновить TaskService в src/services/task.service.ts extending BaseService с методами:
  - create (создание задачи с дефолтными значениями BACKLOG/MEDIUM)
  - findByBoard (получение задач доски с пагинацией и фильтрацией)
  - findById (получение задачи с проверкой владения доской)
  - update (обновление задачи с проверкой владения)
  - delete (удаление задачи)
  - validateBoardOwnership (проверка что задача принадлежит доске пользователя)

#### Middleware

- [ ] T075 [P] [US3] Обновить validateBoardOwnership middleware в src/middleware/validate-board-ownership.ts для поддержки task endpoints (проверка владения доской задачи)

#### Controller

- [ ] T076 [US3] Обновить TaskController в src/controllers/task.controller.ts extending BaseController с эндпоинтами:
  - GET /boards/:boardId/tasks (список задач доски с фильтрацией по status/priority)
  - POST /boards/:boardId/tasks (создание задачи)
  - GET /tasks/:id (получение задачи)
  - PATCH /tasks/:id (обновление задачи)
  - DELETE /tasks/:id (удаление задачи)

#### Routes

- [ ] T077 [US3] Зарегистрировать task routes в src/main.ts с authenticate и validateBoardOwnership middleware

#### Swagger Documentation

- [ ] T078 [US3] Добавить Swagger декораторы в TaskController (зависит от T076)
- [ ] T079 [US3] Добавить @ApiProperty() декораторы во все Task DTOs (зависит от T070-T072)

**Checkpoint**: Все user stories независимо функциональны. Пользователи могут аутентифицироваться, управлять досками и задачами.

---

## Phase 6: User Story 4 - Task Status Workflow (Priority: P4)

**Goal**: Пользователи могут перемещать задачи между любыми статусами в любом порядке (вперёд и назад). Нет ограничений на переходы - любой статус может быть изменён на любой другой.

**Independent Test**: Можно протестировать изменения статуса задачи. Создаём задачу, меняем статус на любой другой, проверяем что изменение сохранилось. Меняем обратно - тоже должно работать. Проверяем все комбинации переходов.

**Acceptance Scenarios**:
1. Изменение статуса BACKLOG → TODO успешно
2. Изменение статуса REVIEW → TODO (возврат назад) успешно
3. Любой статус может быть изменён на любой валидный статус
4. Попытка установить невалидный статус возвращает ошибку валидации
5. Priority также может быть изменён на любое валидное значение

### Tests for User Story 4 ⚠️

- [ ] T080 [P] [US4] Integration test для всех переходов статусов в tests/integration/task-status-workflow.spec.ts
- [ ] T081 [P] [US4] Integration test для bi-directional workflow (вперёд и назад) в tests/integration/task-status-workflow.spec.ts
- [ ] T082 [P] [US4] Integration test для невалидных статусов в tests/integration/task-status-workflow.spec.ts
- [ ] T083 [P] [US4] Integration test для изменений приоритета в tests/integration/task-status-workflow.spec.ts
- [ ] T084 [P] [US4] Unit test для валидации enum значений в tests/unit/task.dto.spec.ts

### Implementation for User Story 4

#### DTOs

- [ ] T085 [P] [US4] Обновить UpdateTaskDto в src/dto/task/update-task.dto.ts с валидацией enum значений status и priority (class-validator @IsEnum)

#### Service

- [ ] T086 [US4] Убедиться что TaskService.update в src/services/task.service.ts разрешает любые переходы статусов (нет ограничений на transition logic)

#### Validation

- [ ] T087 [P] [US4] Добавить custom validator для TaskStatus enum в src/validators/task-status.validator.ts (если требуется дополнительная валидация)

**Checkpoint**: Bi-directional workflow полностью функционален. Любой статус может быть изменён на любой другой без ограничений.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Улучшения, влияющие на несколько user stories

### Health Check & Operations

- [ ] T088 [P] Создать health check endpoint в src/controllers/health.controller.ts
- [ ] T089 Зарегистрировать health check route в src/main.ts (GET /api/v1/health)

### Documentation

- [ ] T090 [P] Обновить Swagger configuration в src/config/swagger.ts с информацией о всех тегах (Authentication, Boards, Tasks)
- [ ] T091 [P] Создать README.md в корне проекта с инструкциями по установке и запуску
- [ ] T092 [P] Создать API.md с примерами запросов для всех endpoints

### Error Handling

- [ ] T093 Обновить error handler middleware в src/middleware/error-handler.ts для поддержки всех error codes
- [ ] T094 Добавить correlation ID middleware в src/middleware/correlation-id.ts для трассировки запросов

### Security Hardening

- [ ] T095 [P] Добавить CORS headers validation в src/config/cors.ts
- [ ] T096 [P] Убедиться что все пароли НЕ логируются (проверить logger configuration)

### Performance

- [ ] T097 [P] Добавить database indexes для Task.status в миграции
- [ ] T098 [P] Проверить connection pool settings в src/config/database.ts

### Final Testing

- [ ] T099 Запустить все тесты и убедиться что coverage 70%+ (npm run test:cov)
- [ ] T100 Запустить quickstart.md validation - проверить все сценарии из quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Нет зависимостей - можно начинать немедленно
- **Foundational (Phase 2)**: Зависит от Setup - БЛОКИРУЕТ все user stories
- **User Story 1 (Phase 3)**: Зависит от Foundational - Нет зависимостей от других stories
- **User Story 2 (Phase 4)**: Зависит от Foundational + US1 (для authenticate middleware)
- **User Story 3 (Phase 5)**: Зависит от Foundational + US1 + US2 (для boards)
- **User Story 4 (Phase 6)**: Зависит от Foundational + US1 + US2 + US3 (расширяет Task функционал)
- **Polish (Phase 7)**: Зависит от завершения всех нужных user stories

### User Story Dependencies

- **User Story 1 (P1)**: Can start после Foundational - независимая реализация
- **User Story 2 (P2)**: Зависит от US1 (требует authenticate middleware) - но независимо тестируема
- **User Story 3 (P3)**: Зависит от US1 + US2 (требует auth + boards) - но независимо тестируема
- **User Story 4 (P4)**: Зависит от US3 (расширяет task функционал) - но независимо тестируема

### Within Each User Story

- Tests ДОЛЖНЫ быть написаны и FAIL перед implementation (TDD подход)
- Models/Enums перед Repositories
- Repositories перед Services
- Services перед Controllers
- Core implementation перед integration
- Story complete перед moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003 могут выполняться параллельно

**Phase 2 (Foundational)**:
- T004, T005, T006-T011 (все [P] задачи) могут выполняться параллельно
- T010-T011 (enums) могут выполняться параллельно
- T014-T016 (migrations) могут выполняться параллельно после T009

**Phase 3 (User Story 1)**:
- Все тесты T017-T026 могут выполняться параллельно (разные файлы)
- T027-T030 (DTOs) могут выполняться параллельно

**Phase 4 (User Story 2)**:
- Все тесты T040-T049 могут выполняться параллельно
- T050-T052 (DTOs) могут выполняться параллельно

**Phase 5 (User Story 3)**:
- Все тесты T060-T069 могут выполняться параллельно
- T070-T072 (DTOs) могут выполняться параллельно

**Phase 6 (User Story 4)**:
- Все тесты T080-T084 могут выполняться параллельно

**Phase 7 (Polish)**:
- T088, T090-T092, T094-T098 (все [P]) могут выполняться параллельно

---

## Parallel Example: User Story 1

```bash
# Запустить все тесты для User Story 1 вместе:
Task: "Contract test для POST /auth/register в tests/contract/auth.spec.ts"
Task: "Contract test для POST /auth/login в tests/contract/auth.spec.ts"
Task: "Contract test для POST /auth/refresh в tests/contract/auth.spec.ts"
Task: "Contract test для POST /auth/logout в tests/contract/auth.spec.ts"
Task: "Integration test для регистрации и логина в tests/integration/auth.spec.ts"
# ... и т.д.

# Запустить все DTOs для User Story 1 вместе:
Task: "Создать RegisterDto в src/dto/auth/register.dto.ts"
Task: "Создать LoginDto в src/dto/auth/login.dto.ts"
Task: "Создарить RefreshTokenDto в src/dto/auth/refresh-token.dto.ts"
Task: "Создать AuthResponseDto в src/dto/auth/auth-response.dto.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Завершить Phase 1: Setup
2. Завершить Phase 2: Foundational (CRITICAL - blocks all stories)
3. Завершить Phase 3: User Story 1
4. **STOP and VALIDATE**: Тестировать User Story 1 независимо
5. Deploy/demo если готово

**MVP Deliverable**: Функциональная система аутентификации с регистрацией, логином, refresh токенами и logout.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - Auth только)
3. Add User Story 2 → Test independently → Deploy/Demo (Auth + Boards)
4. Add User Story 3 → Test independently → Deploy/Demo (Auth + Boards + Tasks)
5. Add User Story 4 → Test independently → Deploy/Demo (Full Kanban workflow)

Каждая добавленная история увеличивает ценность без нарушения предыдущего функционала.

### Parallel Team Strategy

С несколькими разработчиками:

1. Команда завершает Setup + Foundational вместе
2. После завершения Foundational:
   - Developer A: User Story 1 (Auth)
   - Developer B: User Story 2 (Boards) - может начинать после того как A завершит authenticate middleware
   - Developer C: User Story 3 (Tasks) - может начинать после того как A и B завершат свои части
3. Stories завершаются и интегрируются независимо

---

## Summary

**Total Task Count**: 100 tasks

**Task Count by User Story**:
- User Story 1 (Auth): 20 tasks (T017-T036, T038-T039)
- User Story 2 (Boards): 20 tasks (T040-T059)
- User Story 3 (Tasks): 20 tasks (T060-T079)
- User Story 4 (Status Workflow): 5 tasks (T080-T087)

**Setup/Foundation**: 20 tasks (T001-T016)

**Polish**: 13 tasks (T088-T100)

**Parallel Opportunities Identified**:
- Phase 1: 2 задачи могут быть параллельны
- Phase 2: 8 задач могут быть параллельны
- Phase 3: 15 задач могут быть параллельны
- Phase 4: 13 задач могут быть параллельны
- Phase 5: 13 задач могут быть параллельны
- Phase 6: 5 задач могут быть параллельны
- Phase 7: 8 задач могут быть параллельны

**Independent Test Criteria for Each Story**:
- US1: Auth endpoints работают без boards/tasks
- US2: Board CRUD работает независимо от tasks
- US3: Task CRUD работает с одной board
- US4: Status transitions работают для всех комбинаций

**Suggested MVP Scope**: User Story 1 (Authentication) - обеспечивает базовую функциональность для защищённого доступа к системе.

---

## Notes

- [P] задачи = разные файлы, нет зависимостей, могут выполняться параллельно
- [Story] label maps task к конкретному user story для трассируемости
- Каждый user story должен быть независимо завершаем и тестируем
- Проверяйте что тесты fail перед реализацией (TDD)
- Commit после каждого task или логической группы
- Останавливайтесь на любом checkpoint для валидации story независимо
- Избегайте: размытых задач, конфликтов одинаковых файлов, cross-story зависимостей которые нарушают независимость
