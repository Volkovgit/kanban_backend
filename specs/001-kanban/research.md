# Research: Kanban Board Authentication and Management

**Feature**: 001-kanban | **Date**: 2026-02-23

## Overview

Этот документ содержит результаты исследования технологических решений для реализации Kanban-бэкенда. Все решения основаны на существующей архитектуре проекта (Constitution) и лучших практиках для Node.js/TypeScript REST API.

---

## Decision 1: JWT Refresh Token Strategy

**Decision**: Refresh tokens хранятся в PostgreSQL (User.refreshToken) с возможностью отзыва.

### Rationale
- **Security**: Хранение в БД позволяет отзывать токены (logout, security incident)
- **Stateful backend**: Противоречит stateless JWT, но необходимо для FR-SEC-010 (logout инвалидация)
- **Simplicity**: Не требует дополнительного Redis (уменьшает complexity)

### Implementation Details
```typescript
// User entity
@Column({ nullable: true })
refreshToken: string;  // Hashed refresh token

@Column({ default: 0 })
failedLoginAttempts: number;

@Column({ nullable: true })
lockedUntil: Date;
```

### Alternatives Considered
- **Redis для refresh tokens**: Отклонено — добавляет дополнительную зависимость
- **JWT без отзыва**: Отклонено — противоречит FR-SEC-010 (logout ДОЛЖЕН инвалидировать)
- **Long-lived access tokens**: Отклонено — security risk (30 дней access токен = проблема при компрометации)

---

## Decision 2: Rate Limiting Implementation

**Decision**: express-rate-limit с настраиваемыми лимитами.

### Rationale
- **FR-SEC-011/FR-SEC-012**: Требует 10 запросов/мин для auth, 100/мин для API
- **Express ecosystem**: Хорошо интегрируется с существующим middleware стеком
- **Memory store**: Достаточно для single-instance deployment

### Implementation Details
```typescript
// Auth endpoints (IP-based)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 минута
  max: 10,               // 10 запросов
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoints (user-based)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Alternatives Considered
- **Redis rate limiting**: Отклонено — добавляет complexity
- **Nginx rate limiting**: Отклонено — требует внешней конфигурации
- **Custom implementation**: Отклонено — express-rate-limit хорошо протестирован

---

## Decision 3: Password Hashing Configuration

**Decision**: bcrypt с 12 salt rounds (асинхронное хеширование).

### Rationale
- **FR-SEC-005**: Требует bcrypt с минимум 12 rounds
- **Industry standard**: bcrypt считается best practice для password hashing
- **Adaptive**: rounds можно увеличить в будущем для большей безопасности

### Implementation Details
```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Хеширование
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Валидация
const isValid = await bcrypt.compare(password, hash);
```

### Alternatives Considered
- **Argon2**: Отклонено — более сложная интеграция, bcrypt достаточен для MVP
- **scrypt**: Отклонено — менее распространён в Node.js ecosystem
- **PBKDF2**: Отклонено — bcrypt считается более secure для passwords

---

## Decision 4: Cascade Delete Implementation

**Decision**: TypeORM cascade options + QueryRunner для транзакционного удаления.

### Rationale
- **FR-BL-004/FR-BL-005**: Требует all-or-nothing семантики
- **TypeORM built-in**: Cascade options на уровне entity
- **Explicit transaction**: QueryRunner для контроля отката

### Implementation Details
```typescript
// Board entity
@OneToMany(() => Task, task => task.board, { cascade: true })
tasks: Task[];

// Service
async delete(id: string): Promise<void> {
  await this.dataSource.transaction(async (manager) => {
    await manager.delete(Board, id);
    // TypeORM автоматически каскадно удалит Tasks
  });
}
```

### Alternatives Considered
- **Manual cascade delete**: Отклонено — более error-prone
- **Soft delete**: Отклонено — противоречит Assumption-9 (no soft delete)
- **Database-level CASCADE**: Отклонено — теряет control на уровне приложения

---

## Decision 5: UUID Generation Strategy

**Decision**: uuid v4 для всех сущностей, генерация через @BeforeInsert.

### Rationale
- **Uniqueness**: UUID v4 гарантирует глобальную уникальность
- **Decentralized**: Не требует coordination между instances
- **Best practice**: Стандарт для distributed systems

### Implementation Details
```typescript
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
```

### Alternatives Considered
- **Auto-increment integer**: Отклонено — не подходит для distributed systems
- **UUID v7 (time-ordered)**: Отклонено — v4 достаточен для MVP
- **Snowflake IDs**: Отклонено — избыточная complexity

---

## Decision 6: Error Response Format

**Decision**: Единый формат через BaseController.error().

### Rationale
- **FR-BL-002**: Требует все ошибки валидации в одном ответе
- **Consistency**: Frontend ожидает один формат для всех ошибок
- **Type safety**: class-validator ValidationError → структурированный ответ

### Implementation Details
```typescript
// BaseController
protected error(
  statusCode: number,
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>
) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

// Использование
return this.error(400, 'VALIDATION_ERROR', 'Validation failed', [
  { field: 'title', message: 'Title is required' },
]);
```

### Alternatives Considered
- **RFC 7807 Problem Details**: Отклонено — более сложный формат
- **Plain message**: Отклонено — недостаточно информации для frontend
- **Different formats per error type**: Отклонено — violates consistency

---

## Decision 7: Pagination Strategy

**Decision**: Offset-based (page/pageSize) с метаданными в заголовках.

### Rationale
- **FR-034/FR-035**: Требует пагинацию с total count
- **Simplicity**: Offset-based проще для реализации
- **Headers**: Отделяет метаданные от данных (чистый JSON response)

### Implementation Details
```typescript
// BaseController
protected paginated<T>(data: T[], total: number, page: number, pageSize: number) {
  const totalPages = Math.ceil(total / pageSize);

  return {
    success: true,
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages,
    },
  };
}

// Заголовки (middleware)
res.setHeader('X-Total-Count', total);
res.setHeader('X-Page-Size', pageSize);
res.setHeader('X-Current-Page', page);
res.setHeader('X-Total-Pages', totalPages);
```

### Alternatives Considered
- **Cursor-based pagination**: Отклонено — более complex, не требуется для MVP
- **Link header (RFC 5988)**: Отклонено — меньше поддерживается frontend клиентами
- **In-line metadata**: Отклонено — загрязняет response body

---

## Decision 8: Audit Logging Strategy

**Decision**: Winston logger с middleware для request/response.

### Rationale
- **FR-BL-008**: Требует логирование конфликтных ситуаций
- **Structured logging**: Winston поддерживает JSON format
- **Existing project**: Winston уже используется в проекте

### Implementation Details
```typescript
// Logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      requestId: req.headers['x-request-id'],
    });
  });

  next();
};
```

### Alternatives Considered
- **Pino**: Отклонено — Winston уже используется
- **Morgan**: Отклонено — меньше flexibility для structured logging
- **Custom logging**: Отклонено — Winston обеспечивает все требуемые возможности

---

## Security Considerations

### Password Security
- **Hashing**: bcrypt с 12 rounds (FR-SEC-005)
- **Validation**: Минимум 8 символов, 1 заглавная, 1 строчная, 1 цифра (FR-029)
- **No logging**: Пароли никогда не логируются (FR-SEC-022)

### JWT Security
- **Algorithm**: HS256 для подписи (FR-SEC-006)
- **Secret**: Минимум 32 символов (FR-SEC-007)
- **Expiry**: Access — 1 час (FR-SEC-008), Refresh — 30 дней (FR-SEC-009)
- **Revocation**: Refresh токен удаляется при logout (FR-SEC-010)

### Rate Limiting
- **Auth endpoints**: 10 запросов/мин на IP (FR-SEC-012)
- **API endpoints**: 100 запросов/мин на пользователя (FR-SEC-013)
- **Response**: 429 Too Many Requests при превышении (FR-SEC-014)

### Input Validation
- **XSS prevention**: Санитизация пользовательского ввода (FR-SEC-015)
- **SQL injection**: TypeORM parameterized queries (FR-SEC-016)
- **Content-Type**: Валидация для всех запросов (FR-SEC-017/FR-SEC-018)

### Error Handling
- **Generic messages**: Без деталей системы (FR-SEC-019)
- **No stack traces**: В production (FR-SEC-020)
- **User enumeration prevention**: Одинаковый формат для auth/authz ошибок (FR-SEC-021)

---

## Performance Considerations

### Database Indexing
- **User.login**: Уникальный индекс для быстрого поиска
- **Board.ownerId**: Индекс для фильтрации по пользователю
- **Task.boardId**: Индекс для cascade delete и list operations

### Connection Pooling
- **TypeORM**: Настроен в dbConfig
- **Max connections**: Определяется на основе нагрузки (10-100)

### Caching Strategy
- **Disabled by default**: Data consistency приоритетнее (BaseRepository cache: false)
- **Future consideration**: Redis для session storage или rate limiting

---

## Testing Strategy

### Unit Tests
- **Services**: Изолированная бизнес-логика (mock repositories)
- **DTOs**: Валидация с class-validator
- **Utilities**: UUID генерация, password hashing

### Integration Tests
- **API endpoints**: HTTP запросы с test database
- **Database operations**: CRUD, cascade delete
- **Authentication**: Login flow, token validation
- **Authorization**: Ownership validation

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1,  // Sequential для избежания race conditions
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

---

## Open Questions

Нет открытых вопросов. Все technological decisions приняты на основе:
- Constitution requirements
- Functional requirements из spec.md
- Existing project architecture
- Industry best practices

---

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [RFC 7519 - JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [TypeORM Documentation](https://typeorm.io/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
