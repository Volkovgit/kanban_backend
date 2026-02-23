# Data Model: Kanban Board Authentication and Management

**Feature**: 001-kanban | **Date**: 2026-02-23

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                              User                                │
├─────────────────────────────────────────────────────────────────┤
│  id: uuid (PK)                                                  │
│  login: string (unique)                                          │
│  passwordHash: string                                           │
│  failedLoginAttempts: number (default: 0)                       │
│  lockedUntil: timestamp (nullable)                              │
│  refreshToken: string (nullable, hashed)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N (owner)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                              Board                               │
├─────────────────────────────────────────────────────────────────┤
│  id: uuid (PK)                                                  │
│  title: string (not empty, max 255)                             │
│  description: string (nullable, max 5000)                       │
│  ownerId: uuid (FK → User.id)                                   │
│  createdAt: timestamp                                           │
│  updatedAt: timestamp                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N (board)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                               Task                               │
├─────────────────────────────────────────────────────────────────┤
│  id: uuid (PK)                                                  │
│  title: string (not empty, max 255)                             │
│  description: string (nullable, max 5000)                       │
│  status: TaskStatus enum (default: BACKLOG)                     │
│  priority: TaskPriority enum (default: MEDIUM)                   │
│  boardId: uuid (FK → Board.id)                                  │
│  createdAt: timestamp                                           │
│  updatedAt: timestamp                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entity Definitions

### User

**Purpose**: Представляет пользователя системы с учётными данными для аутентификации.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, auto-gen | Уникальный идентификатор |
| login | string | unique, not empty, max 255 | Логин для входа |
| passwordHash | string | not empty (bcrypt) | Хеш пароля (bcrypt, 12 rounds) |
| failedLoginAttempts | number | default: 0 | Счётчик неудачных попыток |
| lockedUntil | timestamp | nullable | Дата разблокировки (FR-003a) |
| refreshToken | string | nullable, hashed | Refresh токен для обновления |

**Relationships**:
- `boards` → Board (1:N, cascade delete)

**Indexes**:
- UNIQUE on `login`

**Validation Rules**:
- login: 3-255 символов, alphanumeric + underscore
- password: Минимум 8 символов, 1 заглавная, 1 строчная, 1 цифра (FR-029)

---

### Board

**Purpose**: Представляет канбан-доску/проект пользователя.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, auto-gen | Уникальный идентификатор |
| title | string | not empty, max 255 | Название доски |
| description | string | nullable, max 5000 | Описание доски |
| ownerId | uuid | FK → User.id, not null | Владелец доски |
| createdAt | timestamp | auto | Дата создания |
| updatedAt | timestamp | auto | Дата последнего обновления |

**Relationships**:
- `owner` → User (N:1, inverse of boards)
- `tasks` → Task (1:N, cascade delete)

**Indexes**:
- INDEX on `ownerId` (для user's boards query)

**Validation Rules**:
- title: Не пустой, максимум 255 символов (FR-025, FR-028)
- description: Максимум 5000 символов (FR-028, Assumption-7)

**Business Rules**:
- Максимум 100 досок на пользователя (FR-BL-013)
- Пользователь видит только свои доски (FR-009, FR-012)
- Cascade delete: Board delete → Task delete (FR-013, FR-BL-004)

---

### Task

**Purpose**: Представляет задачу на канбан-доске.

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, auto-gen | Уникальный идентификатор |
| title | string | not empty, max 255 | Название задачи |
| description | string | nullable, max 5000 | Описание задачи |
| status | TaskStatus enum | default: BACKLOG | Статус задачи |
| priority | TaskPriority enum | default: MEDIUM | Приоритет задачи |
| boardId | uuid | FK → Board.id, not null | Доска задачи |
| createdAt | timestamp | auto | Дата создания |
| updatedAt | timestamp | auto | Дата последнего обновления |

**Relationships**:
- `board` → Board (N:1, inverse of tasks)

**Indexes**:
- INDEX on `boardId` (для tasks by board query)
- INDEX on `status` (для фильтрации по статусу)

**Validation Rules**:
- title: Не пустой, максимум 255 символов (FR-026, FR-028)
- description: Максимум 5000 символов (FR-028, Assumption-7)

**Business Rules**:
- Статус по умолчанию: BACKLOG (FR-015, FR-BL-010)
- Приоритет по умолчанию: MEDIUM (FR-015a, FR-BL-011)
- Максимум 1000 задач на доску (FR-BL-014)
- Би-направленный workflow статусов (FR-022)
- Пользователь видит только задачи своих досок (FR-017, FR-020)

---

## Enums

### TaskStatus

**Values**:
```typescript
enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}
```

**Transitions**: Би-направленные — любой статус может перейти в любой (FR-022).

**Validation**: Значение должно быть одним из перечисленных (FR-023, FR-024).

---

### TaskPriority

**Values**:
```typescript
enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
```

**Default**: MEDIUM (FR-015a, FR-BL-011).

**Validation**: Значение должно быть одним из перечисленных (FR-023a, FR-024a).

---

## Cascade Delete Behavior

### User → Board → Task

**Semantics**: All-or-nothing (FR-BL-004, FR-BL-006).

**Implementation**:
```typescript
// Board entity
@OneToMany(() => Task, task => task.board, { cascade: true })
tasks: Task[];

// User entity
@OneToMany(() => Board, board => board.owner, { cascade: true })
boards: Board[];
```

**Transaction Wrapping**:
```typescript
// Service
async deleteUser(id: string): Promise<void> {
  await this.dataSource.transaction(async (manager) => {
    // Каскадное удаление произойдёт автоматически
    await manager.delete(User, id);
  });
}
```

**Rollback on Failure** (FR-BL-005):
- Если удаление Task не удаётся → транзакция откатывается
- Board и User остаются в консистентном состоянии

---

## Database Constraints

### Primary Keys
- Все entities используют UUID v4 как primary key

### Foreign Keys
- `Board.ownerId` → `User.id` (ON DELETE CASCADE)
- `Task.boardId` → `Board.id` (ON DELETE CASCADE)

### Unique Constraints
- `User.login` — UNIQUE

### Indexes
- `User.login` — UNIQUE INDEX
- `Board.ownerId` — INDEX (для user's boards)
- `Task.boardId` — INDEX (для tasks by board)
- `Task.status` — INDEX (для фильтрации по статусу)

---

## Data Integrity Rules

### Isolation (Principle V)
- Пользователь НЕ может видеть доски других пользователей (FR-009, FR-012)
- Пользователь НЕ может видеть задачи других пользователей (FR-017, FR-020)
- Запросы ВСЕГДА фильтруются по `userId`

### Ownership Validation
- Board operations: `req.user.id === board.ownerId`
- Task operations: `req.user.id === task.board.ownerId`

### Default Values (FR-BL-012)
- Явно указанное значение ПЕРЕОПРЕДЕЛЯЕТ значение по умолчанию
- `null` значение ПЕРЕОПРЕДЕЛЯЕТ значение по умолчанию

---

## Migration Strategy

### Initial Migration
1. Создаётся таблица `user`
2. Создаётся таблица `board` с FK на `user`
3. Создаётся таблица `task` с FK на `board`
4. Создаётся индексы и constraints

### Future Migrations
- Добавление полей через миграции TypeORM
- Изменение enum значений через миграции
- Индексы добавляются для оптимизации queries

---

## TypeORM Entity Annotations

```typescript
// user.entity.ts
@Entity('user')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  login: string;

  @Column()
  passwordHash: string;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ nullable: true })
  refreshToken: string;

  @OneToMany(() => Board, board => board.owner, { cascade: true })
  boards: Board[];

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }
}

// board.entity.ts
@Entity('board')
export class Board {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true, length: 5000 })
  description: string;

  @Column('uuid')
  ownerId: string;

  @ManyToOne(() => User, user => user.boards)
  owner: User;

  @OneToMany(() => Task, task => task.board, { cascade: true })
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }
}

// task.entity.ts
@Entity('task')
export class Task {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true, length: 5000 })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.BACKLOG
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority: TaskPriority;

  @Column('uuid')
  boardId: string;

  @ManyToOne(() => Board, board => board.tasks)
  board: Board;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = uuidv4();
  }
}
```
