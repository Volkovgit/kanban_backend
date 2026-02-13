# Data Model: Kanban Task Management System

**Feature**: Kanban Task Management System
**Branch**: 001-kanban
**Date**: 2025-02-09

## Entity Relationship Diagram

```
User (1) ----< (N) Project (1) ----< (N) Task (N) ----< (N) TaskLabel (N) ----< (M) Label (M)
                        |
                        |
                        (1) ----< (N) Label
```

## Entities

### User

**Purpose**: Represents an authenticated person with unique credentials

**Fields**:
- `id: UUID` (Primary key, UUID v4)
- `email: string` (Unique, not null, email format)
- `passwordHash: string` (Not null, bcrypt hash)
- `createdAt: Date` (Auto-generated timestamp)
- `updatedAt: Date` (Auto-update timestamp)

**Relationships**:
- One-to-Many with `Project` (owns multiple projects)

**Validation Rules**:
- Email must be valid email format
- Email must be unique across all users
- Password must be 8+ characters with at least one uppercase, one lowercase, one number, one special character (FR-006)

**Indexes**:
- UNIQUE on `email`

**TypeORM Entity Definition**:
```typescript
@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Project, project => project.owner)
  projects: Project[];
}
```

---

### Project

**Purpose**: Container for organizing related tasks

**Fields**:
- `id: UUID` (Primary key, UUID v4)
- `name: string` (Not null, max length 255)
- `description: string` (Nullable, text)
- `ownerId: UUID` (Foreign key to User.id, not null)
- `createdAt: Date` (Auto-generated timestamp)
- `updatedAt: Date` (Auto-update timestamp)

**Relationships**:
- Many-to-One with `User` (belongs to owner)
- One-to-Many with `Task` (contains multiple tasks)
- One-to-Many with `Label` (contains multiple project-specific labels)

**Validation Rules**:
- Name is required (not null)
- Name max length 255 characters
- Owner must exist

**Indexes**:
- INDEX on `ownerId` (for user's projects lookup)

**TypeORM Entity Definition**:
```typescript
@Entity()
export class Project {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.projects)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => Task, task => task.project)
  tasks: Task[];

  @OneToMany(() => Label, label => label.project)
  labels: Label[];
}
```

---

### Task

**Purpose**: Work item with title, description, due date, labels, and status

**Fields**:
- `id: UUID` (Primary key, UUID v4)
- `title: string` (Not null, max length 255)
- `description: string` (Nullable, text)
- `status: TaskStatus` (Not null, enum)
- `dueDate: Date` (Nullable)
- `projectId: UUID` (Foreign key to Project.id, not null)
- `completedAt: Date` (Nullable, set when status = Done)
- `createdAt: Date` (Auto-generated timestamp)
- `updatedAt: Date` (Auto-update timestamp)

**Relationships**:
- Many-to-One with `Project` (belongs to one project)
- Many-to-Many with `Label` (through TaskLabel junction table)

**Validation Rules**:
- Title is required (not null)
- Title max length 255 characters
- Project must exist
- Due date cannot be in past (validation warning only, not blocking)
- Status must be valid TaskStatus enum value

**State Transitions**:
- Initial: `Backlog`
- Forward: Backlog → To Do → In Progress → Review → Done
- Backward: Any status can move to any previous status (e.g., Review → In Progress)
- Completion: Done sets `completedAt` timestamp
- Reactivation: Moving from Done sets status to previous value, preserves `completedAt`

**Indexes**:
- INDEX on `projectId` (for project tasks lookup)
- INDEX on `status` (for Kanban board column filtering)
- INDEX on `dueDate` (for overdue task queries)
- COMPOUND INDEX on `(projectId, status)` (for efficient board queries)

**TypeORM Entity Definition**:
```typescript
export enum TaskStatus {
  BACKLOG = 'Backlog',
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done'
}

@Entity()
export class Task {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.BACKLOG
  })
  status: TaskStatus;

  @Column({ type: 'timestamp without time zone', nullable: true })
  dueDate: Date;

  @Column()
  projectId: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Project, project => project.tasks)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => TaskLabel, taskLabel => taskLabel.task)
  taskLabels: TaskLabel[];

  // Helper method to get labels (populated via relation)
  @ManyToMany(() => Label, label => label.tasks, {
    cascade: true,
    through: () => TaskLabel
  })
  labels: Label[];
}
```

---

### Label

**Purpose**: Categorical tag for tasks within a project

**Fields**:
- `id: UUID` (Primary key, UUID v4)
- `name: string` (Not null, max length 100)
- `color: string` (Not null, hex color, e.g., "#FF5733")
- `isSystemDefined: boolean` (Not null, default: false)
- `projectId: UUID` (Foreign key to Project.id, not null)
- `createdAt: Date` (Auto-generated timestamp)

**Relationships**:
- Many-to-One with `Project` (belongs to one project, project-specific)
- Many-to-Many with `Task` (through TaskLabel junction table)

**System-Defined Labels** (FR-018):
- "Bug" (color: #FF0000 - Red)
- "Feature" (color: #2196F3 - Blue)
- "Enhancement" (color: #4CAF50 - Green)
- "Question" (color: #FF9800 - Orange)

**Validation Rules**:
- Name is required (not null)
- Name max length 100 characters
- Name must be unique within a project
- Color must be valid hex color code
- Project must exist
- System-defined labels cannot be deleted (only hidden)

**Indexes**:
- UNIQUE on `(projectId, name)` (duplicate label prevention per project)
- INDEX on `projectId` (for project labels lookup)

**TypeORM Entity Definition**:
```typescript
@Entity()
export class Label {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 7 })
  color: string;

  @Column({ default: false })
  isSystemDefined: boolean;

  @Column()
  projectId: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Project, project => project.labels)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToMany(() => Task, task => task.labels, {
    cascade: true,
    through: () => TaskLabel
  })
  tasks: Task[];
}
```

---

### TaskLabel (Junction Table)

**Purpose**: Many-to-Many relationship between Task and Label

**Fields**:
- `taskId: UUID` (Foreign key to Task.id, part of composite primary key)
- `labelId: UUID` (Foreign key to Label.id, part of composite primary key)
- `assignedAt: Date` (Auto-generated timestamp, tracks when label was assigned)

**Relationships**:
- Many-to-One with `Task`
- Many-to-One with `Label`

**TypeORM Entity Definition**:
```typescript
@Entity()
export class TaskLabel {
  @PrimaryColumn()
  @ManyToOne(() => Task, task => task.taskLabels, {
    onDelete: 'CASCADE'
  })
  task: Task;

  @PrimaryColumn()
  @ManyToOne(() => Label, label => label.taskLabels, {
    onDelete: 'CASCADE'
  })
  label: Label;

  @CreateDateColumn()
  assignedAt: Date;
}
```

---

## Database Schema (SQL)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Backlog',
    due_date TIMESTAMP WITHOUT TIME ZONE,
    project_id UUID NOT NULL,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);

-- Labels Table
CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    is_system_defined BOOLEAN DEFAULT FALSE,
    project_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, name)
);

CREATE INDEX idx_labels_project_id ON labels(project_id);

-- Task Labels Junction Table
CREATE TABLE task_labels (
    task_id UUID NOT NULL,
    label_id UUID NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, label_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX idx_task_labels_label_id ON task_labels(label_id);
```

## Shared TypeScript Types

Located in `libs/shared-types/src/` for reuse between client and server.

### Entity Interfaces

```typescript
// libs/shared-types/src/models/user.interface.ts
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// libs/shared-types/src/models/project.interface.ts
export interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// libs/shared-types/src/models/task.interface.ts
export enum TaskStatus {
  BACKLOG = 'Backlog',
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done'
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  projectId: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  labels?: Label[]; // Populated via eager loading
}

// libs/shared-types/src/models/label.interface.ts
export interface Label {
  id: string;
  name: string;
  color: string;
  isSystemDefined: boolean;
  projectId: string;
  createdAt: Date;
}
```

### Request/Response DTOs

```typescript
// Create Project DTO
export interface CreateProjectDto {
  name: string;
  description?: string;
}

// Update Project DTO
export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

// Create Task DTO
export interface CreateTaskDto {
  title: string;
  description?: string;
  dueDate?: Date;
  labelIds?: string[];
}

// Update Task DTO
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: TaskStatus;
  labelIds?: string[];
}

// Create Label DTO
export interface CreateLabelDto {
  name: string;
  color: string;
}

// Pagination DTO
export interface PaginationDto {
  page?: number;
  pageSize?: number;
}

// Search DTO
export interface SearchDto {
  query: string;
  includeCompleted?: boolean;
}
```

## Data Migration Strategy

1. **Initial Migration**: Create all tables with indexes
2. **Seed Data**: Insert system-defined labels for each new project (trigger or application logic)
3. **Migration Files**: Version-controlled migrations via TypeORM
4. **Rollback Plan**: All migrations reversible (down method)

## Data Access Patterns

### Repository Pattern Examples

```typescript
// Project Repository
export class ProjectRepository {
  async findAllByUserId(userId: string): Promise<Project[]>
  async findById(id: string): Promise<Project | null>
  async create(project: Partial<Project>): Promise<Project>
  async update(id: string, updates: Partial<Project>): Promise<Project>
  async delete(id: string): Promise<void>
  async countTasks(projectId: string): Promise<number>
}

// Task Repository
export class TaskRepository {
  async findByProjectId(projectId: string): Promise<Task[]>
  async findByStatus(projectId: string, status: TaskStatus): Promise<Task[]>
  async findById(id: string): Promise<Task | null>
  async create(task: Partial<Task>): Promise<Task>
  async update(id: string, updates: Partial<Task>): Promise<Task>
  async delete(id: string): Promise<void>
  async search(query: string, userId: string): Promise<Task[]>
}

// Label Repository
export class LabelRepository {
  async findByProjectId(projectId: string): Promise<Label[]>
  async findSystemDefined(): Promise<Label[]>
  async create(label: Partial<Label>): Promise<Label>
  async findByName(projectId: string, name: string): Promise<Label | null>
}
```

## Transaction Support

### Multi-Operation Transactions

```typescript
// Example: Delete project with all tasks and labels
async deleteProject(projectId: string): Promise<void> {
  await this.connection.transaction(async manager => {
    // Delete tasks (cascade will handle task_labels)
    await manager.getRepository(Task).delete({ projectId });

    // Delete labels
    await manager.getRepository(Label).delete({ projectId });

    // Delete project
    await manager.getRepository(Project).delete({ id: projectId });
  });
}
```

## Performance Optimization

### Query Optimization

1. **Eager Loading**: Populate labels when fetching tasks (avoid N+1 queries)
2. **Selective Fields**: Only fetch required fields for list views
3. **Pagination**: Limit results for large datasets (default 20 items per page)
4. **Caching**: Cache frequently accessed data (user projects, system labels)

### Example: Optimized Task Query

```typescript
// With labels eager-loaded
async findTasksForBoard(projectId: string): Promise<Task[]> {
  return this.taskRepository.find({
    where: { projectId },
    relations: ['labels'], // Eager load labels
    order: { createdAt: 'ASC' }
  });
}
```

## Data Integrity Constraints

### Business Rules

1. **Task Ownership**: Task must belong to a valid project (foreign key constraint)
2. **Label Project-Specific**: Label must belong to a valid project (foreign key constraint)
3. **Project Ownership**: Project must belong to a valid user (foreign key constraint)
4. **Unique Labels per Project**: No duplicate label names within a project (unique constraint)
5. **Task Status Enum**: Status must be valid TaskStatus enum value
6. **Cascade Deletion**: Deleting project deletes all tasks and labels (CASCADE in foreign keys)

### Validation at Boundaries

- **Controller Layer**: Validates DTO structure with class-validator
- **Service Layer**: Validates business rules (user owns project, task in backlog before moving to board)
- **Repository Layer**: Database constraints enforce referential integrity
