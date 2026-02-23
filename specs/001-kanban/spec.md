# Feature Specification: Kanban Board Authentication and Management

**Feature Branch**: `001-kanban`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "Пользователь заходит на сайт и видит окно авторизации. После ввода пароля и логина вызывается рест метод для авторизации и аутентификации. Если параметры неправильные то выводится ошибка. Если правильные пользователь попадает в систему. Пользователь может создавать редактировать и удалять доски. В каждой доске он может создавать редактировать и удалять задачи. По умолчанию задачи будут создаваться со статусом беклог. Пользователь может перемещать задачи между статусами в любом порядке."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Authentication (Priority: P1)

Пользователь может войти в систему, введя логин и пароль. После успешной аутентификации пользователь получает доступ к своим данным.

**Why this priority**: Без аутентификации нет доступа к остальному функционалу. Это базовый requirement для защищённой работы с персональными данными пользователя.

**Independent Test**: Можно полностью протестировать через API endpoint для логина, проверяя успешную аутентификацию (получение токена) и неуспешную (ошибка при неверных данных).

**Acceptance Scenarios**:

1. **Given** пользователь не авторизован, **When** он вводит корректный логин и пароль, **Then** система возвращает токен авторизации и пользователь получает доступ к системе
2. **Given** пользователь не авторизован, **When** он вводит неверный логин или пароль, **Then** система возвращает ошибку с сообщением о неверных учётных данных
3. **Given** пользователь не авторизован, **When** он не заполняет обязательные поля, **Then** система возвращает ошибку валидации с указанием missing полей
4. **Given** пользователь авторизован с валидным токеном, **When** он делает запрос к защищённому ресурсу, **Then** система обрабатывает запрос и возвращает данные
5. **Given** пользователь авторизован с просроченным токеном, **When** он делает запрос к защищённому ресурсу, **Then** система возвращает ошибку 401 Unauthorized

---

### User Story 2 - Board Management (Priority: P2)

Пользователь может создавать, редактировать и удалять свои доски (проекты). Каждая доска принадлежит только одному пользователю.

**Why this priority**: Доска - это основной контейнер для задач. Без досок некуда добавлять задачи. Это второй уровень функционала после аутентификации.

**Independent Test**: Можно протестировать CRUD операции для досок независимо от задач. Создаём доску, проверяем что она появилась, редактируем, удаляем.

**Acceptance Scenarios**:

1. **Given** пользователь авторизован, **When** он создаёт новую доску с названием и описанием, **Then** доска сохраняется в системе и привязывается к пользователю
2. **Given** пользователь авторизован и имеет доски, **When** он запрашивает список своих досок, **Then** система возвращает только доски этого пользователя (не других пользователей)
3. **Given** пользователь авторизован и владеет доской, **When** он редактирует название или описание, **Then** изменения сохраняются
4. **Given** пользователь авторизован и владеет доской, **When** он удаляет доску, **Then** доска и все связанные задачи удаляются из системы
5. **Given** пользователь авторизован, **When** он пытается получить доступ к доске другого пользователя, **Then** система возвращает ошибку 403 Forbidden

---

### User Story 3 - Task Management (Priority: P3)

Пользователь может создавать, редактировать и удалять задачи в рамках своих досок. Задачи по умолчанию создаются со статусом BACKLOG.

**Why this priority**: Задачи - это основная единица работы в канбан-системе. После того как доски созданы, пользователю нужен функционал для работы с задачами.

**Independent Test**: Можно протестировать CRUD операции для задач в рамках одной доски. Создаём задачу, проверяем что она появилась с дефолтным статусом BACKLOG, редактируем, удаляем.

**Acceptance Scenarios**:

1. **Given** пользователь авторизован и имеет доску, **When** он создаёт задачу с названием и описанием, **Then** задача сохраняется со статусом BACKLOG по умолчанию и привязывается к доске
2. **Given** пользователь авторизован и имеет доску с задачами, **When** он запрашивает список задач доски, **Then** система возвращает только задачи этой доски
3. **Given** пользователь авторизован и владеет задачей, **When** он редактирует название, описание или приоритет, **Then** изменения сохраняются
4. **Given** пользователь авторизован и владеет задачей, **When** он удаляет задачу, **Then** задача удаляется из системы
5. **Given** пользователь авторизован, **When** он пытается получить доступ к задаче из доски другого пользователя, **Then** система возвращает ошибку 403 Forbidden
6. **Given** пользователь авторизован и создаёт задачу, **When** он не указывает статус явно, **Then** задача автоматически создаётся со статусом BACKLOG

---

### User Story 4 - Task Status Workflow (Priority: P4)

Пользователь может перемещать задачи между любыми статусами в любом порядке (вперёд и назад).

**Why this priority**: Гибкость workflow - ключевая особенность канбан-системы. Пользователи часто возвращают задачи из REVIEW обратно в TODO, если требуются доработки.

**Independent Test**: Можно протестировать изменения статуса задачи. Создаём задачу, меняем статус на любой другой, проверяем что изменение сохранилось. Меняем обратно - тоже должно работать.

**Acceptance Scenarios**:

1. **Given** пользователь авторизован и владеет задачей в статусе BACKLOG, **When** он изменяет статус на TODO, **Then** статус задачи обновляется на TODO
2. **Given** пользователь авторизован и владеет задачей в статусе REVIEW, **When** он изменяет статус на TODO (возврат назад), **Then** статус задачи обновляется на TODO
3. **Given** пользователь авторизован и владеет задачей, **When** он изменяет статус на любой валидный статус (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE), **Then** изменение успешно применяется независимо от текущего статуса
4. **Given** пользователь авторизован, **When** он пытается установить невалидный статус, **Then** система возвращает ошибку валидации с сообщением о допустимых статусах

---

### Edge Cases

- Что происходит при попытке создать доску с пустым названием?
- Как система обрабатывает одновременное редактирование доски/задачи из разных клиентов?
- Что происходит при попытке удалить доску, в которой есть задачи?
- Как система ведёт себя при достижении лимита количества досок или задач для пользователя?
- Что происходит при попытке изменить статус задачи, которая была удалена?
- Как система обрабатывает слишком длинные названия/описания досок и задач?
- Что происходит при попытке создать задачу в несуществующей доске?
- Как система ведет себя при одновременном изменении статуса задачи из разных сессий?

## Requirements *(mandatory)*

### Functional Requirements

**Authentication Requirements**:
- **FR-001**: System MUST authenticate users via login and password credentials
- **FR-002**: System MUST return authentication error when login or password is incorrect
- **FR-003**: System MUST validate that both login and password fields are provided
- **FR-003a**: System MUST lock user account for 15 minutes after 5 consecutive failed login attempts
- **FR-003b**: System MUST reset failed login attempt counter on successful login
- **FR-004**: System MUST issue an authentication token upon successful login
- **FR-005**: System MUST validate authentication token on protected endpoints
- **FR-006**: System MUST deny access to protected resources with invalid or expired tokens

**Board Management Requirements**:
- **FR-007**: Authenticated users MUST be able to create boards with title and optional description
- **FR-008**: System MUST associate each board with the authenticated user who created it
- **FR-009**: Users MUST be able to list only their own boards (isolation from other users)
- **FR-010**: Users MUST be able to edit title and description of their own boards
- **FR-011**: Users MUST be able to delete their own boards
- **FR-012**: System MUST deny access to boards owned by other users (403 Forbidden)
- **FR-013**: When a board is deleted, system MUST delete all tasks associated with that board (cascade delete)

**Task Management Requirements**:
- **FR-014**: Authenticated users MUST be able to create tasks within their own boards
- **FR-015**: System MUST set task status to BACKLOG by default when status is not explicitly provided
- **FR-015a**: System MUST set task priority to MEDIUM by default when priority is not explicitly provided
- **FR-016**: System MUST associate each task with the board it belongs to
- **FR-017**: Users MUST be able to list tasks within a specific board
- **FR-018**: Users MUST be able to edit title, description, status, and priority of their own tasks
- **FR-019**: Users MUST be able to delete their own tasks
- **FR-020**: System MUST deny access to tasks in boards owned by other users (403 Forbidden)

**Task Status Workflow Requirements**:
- **FR-021**: System MUST support the following task statuses: BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE
- **FR-021a**: System MUST support the following task priorities: LOW, MEDIUM, HIGH, CRITICAL
- **FR-022**: Users MUST be able to change task status to any valid status regardless of current status (bi-directional workflow)
- **FR-023**: System MUST validate that the provided status is one of the allowed values
- **FR-023a**: System MUST validate that the provided priority is one of the allowed values
- **FR-024**: System MUST return validation error when an invalid status is provided
- **FR-024a**: System MUST return validation error when an invalid priority is provided

**Input Validation Requirements**:
- **FR-025**: System MUST require non-empty title for boards
- **FR-026**: System MUST require non-empty title for tasks
- **FR-027**: System MUST require that a task belongs to an existing board owned by the user
- **FR-028**: System MUST validate maximum length limits for title and description fields
- **FR-029**: System MUST enforce password complexity: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit

**API Requirements**:
- **FR-030**: System MUST provide OpenAPI/Swagger documentation at /api-docs
- **FR-031**: System MUST provide health check endpoint at /api/v1/health
- **FR-032**: System MUST support CORS for configured origins
- **FR-033**: System MUST include correlation ID in responses for tracing
- **FR-034**: List endpoints MUST support pagination parameters
- **FR-035**: List endpoints MUST return total count in response headers

### Key Entities

- **User**: Представляет пользователя системы. Атрибуты: уникальный идентификатор, логин (уникальный), хеш пароля. User имеет множество Board (один ко многим).

- **Board (Project)**: Представляет канбан-доску/проект. Атрибуты: уникальный идентификатор, название, описание, временная метка создания, ссылка на владельца (User). Board принадлежит одному User и имеет множество Task (один ко многим).

- **Task**: Представляет задачу на канбан-доске. Атрибуты: уникальный идентификатор, название, описание, статус (enum: BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE), приоритет (enum: LOW, MEDIUM, HIGH, CRITICAL, по умолчанию MEDIUM), временная метка создания, ссылка на доску (Board). Task принадлежит одной Board.

## API Contract

### Endpoints

#### Authentication Endpoints
- `POST /api/v1/auth/register` — Регистрация нового пользователя
- `POST /api/v1/auth/login` — Вход в систему
- `POST /api/v1/auth/refresh` — Обновление токена
- `POST /api/v1/auth/logout` — Выход из системы

#### Board Endpoints
- `GET /api/v1/boards` — Получить список досок
- `POST /api/v1/boards` — Создать доску
- `GET /api/v1/boards/:id` — Получить доску по ID
- `PATCH /api/v1/boards/:id` — Обновить доску
- `DELETE /api/v1/boards/:id` — Удалить доску

#### Task Endpoints
- `GET /api/v1/boards/:boardId/tasks` — Получить задачи доски
- `POST /api/v1/boards/:boardId/tasks` — Создать задачу
- `GET /api/v1/tasks/:id` — Получить задачу по ID
- `PATCH /api/v1/tasks/:id` — Обновить задачу
- `DELETE /api/v1/tasks/:id` — Удалить задачу

#### Operations Endpoints
- `GET /api/v1/health` — Health check
- `GET /api-docs` — OpenAPI/Swagger документация

### Request/Response Formats

#### Успешный ответ
```json
{
  "success": true,
  "data": { ... }
}
```

#### Ошибка валидации (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "title", "message": "Title is required" }
    ]
  }
}
```

#### Ошибка аутентификации (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

#### Ошибка авторизации (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied"
  }
}
```

#### Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### Заголовки запросов

**Обязательные:**
- `Content-Type: application/json`
- `Authorization: Bearer <access_token>` (для защищённых endpoint'ов)

**Опциональные:**
- `X-Request-ID: <uuid>` — для трассировки запросов

### Заголовки ответов

**Для пагинированных списков:**
- `X-Total-Count: <number>` — общее количество записей
- `X-Page-Size: <number>` — размер страницы
- `X-Current-Page: <number>` — текущая страница
- `X-Total-Pages: <number>` — общее количество страниц

**Rate limiting:**
- `X-RateLimit-Limit: <number>` — лимит запросов
- `X-RateLimit-Remaining: <number>` — оставшиеся запросы
- `X-RateLimit-Reset: <timestamp>` — время сброса лимита

### Пагинация

**Параметры запроса:**
- `page` — номер страницы (по умолчанию 1)
- `pageSize` — размер страницы (по умолчанию 20, максимум 100)

**Сортировка:**
- `sortBy` — поле для сортировки
- `sortOrder` — порядок сортировки (ASC или DESC, по умолчанию ASC)

## Security Requirements

### Transport Security

**FR-SEC-001**: System MUST enforce HTTPS for all endpoints
**FR-SEC-002**: System MUST support TLS version 1.2 or higher
**FR-SEC-003**: System MUST redirect HTTP requests to HTTPS
**FR-SEC-004**: System MUST include HSTS header in responses

### Authentication Security

**FR-SEC-005**: Пароли ДОЛЖНЫ хешироваться с использованием bcrypt (минимум 12 salt rounds)
**FR-SEC-006**: JWT токены ДОЛЖНЫ подписываться с использованием алгоритма HS256
**FR-SEC-007**: Секретный ключ JWT ДОЛЖЕН быть не менее 32 символов
**FR-SEC-008**: Access токен ДОЛЖЕН истекать через 1 час
**FR-SEC-009**: Refresh токен ДОЛЖЕН истекать через 30 дней
**FR-SEC-010**: Logout ДОЛЖЕН инвалидировать токен

### Rate Limiting

**FR-SEC-011**: System MUST enforce rate limiting на все endpoint'ы
**FR-SEC-012**: Лимит для auth endpoint'ов: 10 запросов в минуту на IP
**FR-SEC-013**: Лимит для API endpoint'ов: 100 запросов в минуту на пользователя
**FR-SEC-014**: Превышение лимита ДОЛЖНО возвращать 429 Too Many Requests

### Input Validation Security

**FR-SEC-015**: System MUST sanitize пользовательский ввод для предотвращения XSS
**FR-SEC-016**: System MUST использовать parameterized queries для предотвращения SQL injection
**FR-SEC-017**: System MUST validate Content-Type header для всех запросов
**FR-SEC-018**: System MUST reject запросы с неверным Content-Type

### Error Handling Security

**FR-SEC-019**: Error messages НЕ ДОЛЖНЫ раскрывать детали системы
**FR-SEC-020**: Stack traces НЕ ДОЛЖНЫ включаться в error responses в production
**FR-SEC-021**: Authentication и authorization ошибки ДОЛЖНЫ иметь одинаковый формат для предотвращения user enumeration

### Data Protection

**FR-SEC-022**: Пароли НЕ ДОЛЖНЫ логироваться
**FR-SEC-023**: Токены НЕ ДОЛЖНЫ логироваться полностью
**FR-SEC-024**: Sensitive данные НЕ ДОЛЖНЫ включаться в logs

## Business Logic Requirements

### Validation Order

**FR-BL-001**: Валидация ДОЛЖНА выполняться в следующем порядке:
1. Type validation (проверка типов данных)
2. Format validation (UUID, email, длина строк)
3. Business rules validation (существование ресурсов, владение)

**FR-BL-002**: При множественных ошибках валидации ДОЛЖНЫ возвращаться все ошибки

**FR-BL-003**: Error response ДОЛЖЕН включать path к полю вызвавшему ошибку

### Cascade Delete Transactions

**FR-BL-004**: Cascade delete операций ДОЛЖНЫ выполняться в одной транзакции

**FR-BL-005**: При сбое cascade delete транзакция ДОЛЖНА откатываться полностью

**FR-BL-006**: Операции удаления ДОЛЖНЫ быть атомарными (all-or-nothing)

### Concurrency Handling

**FR-BL-007**: При конкурентных обновлениях применяется "Last Write Wins" семантика

**FR-BL-008**: System ДОЛЖЕН логировать конфликтные ситуации для аудита

**FR-BL-009**: Concurrent операции НЕ ДОЛЖНЫ приводить к нарушению ограничений целостности

### Default Values

**FR-BL-010**: При создании задачи без статуса ДОЛЖЕН устанавливаться BACKLOG

**FR-BL-011**: При создании задачи без приоритета ДОЛЖЕН устанавливаться MEDIUM

**FR-BL-012**: Явно указанное значение (даже null) ПЕРЕОПРЕДЕЛЯЕТ значение по умолчанию

### Resource Limits

**FR-BL-013**: Максимум 100 досок на одного пользователя

**FR-BL-014**: Максимум 1000 задач на одной доске

**FR-BL-015**: Превышение лимита ДОЛЖНО возвращать ошибку 429 с сообщением о лимите

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Performance Metrics**:
- **SC-001**: Пользователи могут успешно войти в систему менее чем за 5 секунд (от ввода credentials до получения токена)
- **SC-003**: Пользователи могут создать новую доску менее чем за 3 секунды
- **SC-004**: Пользователи могут создать новую задачу менее чем за 3 секунды
- **SC-008**: Система поддерживает не менее 1000 пользователей с 100 досками и 1000 задач в каждой без degradation производительности

**Reliability Metrics**:
- **SC-009**: Система обеспечивает 99% uptime (не более 3.65 дней downtime в год)

**Security & Data Integrity**:
- **SC-002**: 99% запросов к защищённым endpoint'ам обрабатываются с правильной авторизацией (no unauthorized access)
- **SC-005**: 100% попыток доступа к чужим доскам/задачам блокируются (data isolation verified)
- **SC-006**: Изменение статуса задачи выполняется успешно в 100% случаев при валидном статусе
- **SC-007**: При удалении доски все связанные задачи удаляются (no orphaned data)

## Clarifications

### Session 2026-02-23

- Q: Какая политика сложности паролей должна применяться? → A: Минимум 8 символов, минимум 1 заглавная, 1 строчная, 1 цифра
- Q: Нужен ли атрибут priority для задач и какой должна быть логика? → A: Priority необязательный атрибут (LOW, MEDIUM, HIGH, CRITICAL), по умолчанию MEDIUM
- Q: Какое поведение при одновременном редактировании доски/задачи? → A: Last Write Wins (последний запрос перезаписывает данные) - для MVP с единственным владельцем конфликты маловероятны
- Q: Какие требования к uptime/availability системы? → A: 99% uptime (не более 3.65 дней downtime в год)
- Q: Какая политика блокировки при неудачных попытках входа? → A: Lockout после 5 неудачных попыток на 15 минут
- Q: Какая политика версионирования API? → A: Используется path-based versioning (/api/v1/), breaking changes будут в /api/v2/
- Q: Как обрабатываются множественные ошибки валидации? → A: Возвращаются все ошибки в массиве details
- Q: Какое поведение при превышении лимитов ресурсов? → A: Возвращается ошибка 429 с сообщением о превышении лимита
- Q: Какая политика для HTTPS? → A: Все endpoint'ы требуют HTTPS, HTTP перенаправляется на HTTPS

## Assumptions

1. **Password Security**: Пароли хешируются перед сохранением (стандартная практика для аутентификации)

2. **Token Format**: Используется JWT (JSON Web Token) или аналогичный механизм для stateless аутентификации

3. **Default Status**: Если статус задачи не указан при создании, автоматически устанавливается BACKLOG

4. **Board Ownership**: Пользователь не может делить доску с другими пользователями (каждая доска имеет одного владельца)

5. **Status Transitions**: Нет ограничений на переходы между статусами - любой статус может быть изменён на любой другой

6. **Cascade Delete**: Удаление доски автоматически удаляет все связанные задачи

7. **Input Limits**: Существуют разумные пределы на длину title и description (например, 255 символов для title, 5000 для description)

8. **Login Uniqueness**: Логин должен быть уникальным в системе (два пользователя не могут иметь одинаковый логин)

9. **No Soft Delete**: Удаление досок и задач является окончательным (hard delete, не soft delete)

10. **Real-time Updates**: Нет требования к real-time обновлениям (клиенты опрашивают сервер при необходимости)
11. **API Versioning**: Все endpoint'ы имеют префикс `/api/v1/`
12. **Rate Limits**: Существуют разумные лимиты на количество запросов для предотвращения滥用
13. **Token Storage**: JWT токены хранятся на клиенте, сервер не хранит состояние сессии (stateless)
14. **Error Messages**: Error сообщения генерируются для пользователя, не раскрывая технические детали
15. **Transaction Isolation**: Каскадные удаления выполняются в транзакции для обеспечения целостности данных
16. **Pagination Defaults**: Размер страницы по умолчанию 20, максимум 100

## Future Enhancements (Out of Scope for MVP)

Следующие функции планируется добавить в будущих итерациях, но не входят в текущий MVP:

### Shared Board Access (Future Iteration)
- Предоставление доступа другим пользователям к доскам (collaborative boards)
- Ролевая модель: Owner, Editor, Viewer
- Sharing по invite link или email
- Permissions гранулярного уровня (читать, редактировать, удалять)

### Additional Features (Future Consideration)
- Комментарией к задачам
- Attachments и файлы
- Activity log и история изменений
- Labels и tags для задач
- Search и фильтрация задач
- Dashboard и analytics
- Email notifications
- Webhooks для интеграций
