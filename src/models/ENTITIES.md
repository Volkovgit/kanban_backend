# TypeORM Entities

This directory contains all TypeORM database entities for the Kanban Task Management System.

## Entities

### User (`user.entity.ts`)
Represents an authenticated person with unique credentials.

**Fields:**
- `id`: UUID (primary key)
- `email`: string (unique)
- `passwordHash`: string (bcrypt hash)
- `createdAt`: Date
- `updatedAt`: Date

**Relationships:**
- One-to-Many with Project (owns multiple projects)

---

### Project (`project.entity.ts`)
Container for organizing related tasks.

**Fields:**
- `id`: UUID (primary key)
- `name`: string (max 255 chars, required)
- `description`: string (nullable)
- `ownerId`: UUID (foreign key to User)
- `createdAt`: Date
- `updatedAt`: Date

**Relationships:**
- Many-to-One with User (belongs to owner)
- One-to-Many with Task
- One-to-Many with Label

**Indexes:**
- `ownerId` (for user's projects lookup)

---

### Task (`task.entity.ts`)
Work item with title, description, due date, labels, and status.

**Fields:**
- `id`: UUID (primary key)
- `title`: string (max 255 chars, required)
- `description`: string (nullable)
- `status`: TaskStatus enum (default: BACKLOG)
- `dueDate`: Date (nullable)
- `projectId`: UUID (foreign key to Project)
- `completedAt`: Date (nullable)
- `createdAt`: Date
- `updatedAt`: Date

**Relationships:**
- Many-to-One with Project
- Many-to-Many with Label (through TaskLabel)

**Indexes:**
- `projectId`
- `status`
- `dueDate`
- `(projectId, status)` compound

**TaskStatus Values:**
- `BACKLOG = 'Backlog'`
- `TODO = 'To Do'`
- `IN_PROGRESS = 'In Progress'`
- `REVIEW = 'Review'`
- `DONE = 'Done'`

---

### Label (`label.entity.ts`)
Categorical tag for tasks within a project.

**Fields:**
- `id`: UUID (primary key)
- `name`: string (max 100 chars, required)
- `color`: string (hex color, e.g., "#FF5733")
- `isSystemDefined`: boolean (default: false)
- `projectId`: UUID (foreign key to Project)
- `createdAt`: Date

**Relationships:**
- Many-to-One with Project
- Many-to-Many with Task (through TaskLabel)

**Indexes:**
- `projectId`
- `(projectId, name)` unique (duplicate prevention)

**System-Defined Labels:**
- "Bug" (color: #FF0000 - Red)
- "Feature" (color: #2196F3 - Blue)
- "Enhancement" (color: #4CAF50 - Green)
- "Question" (color: #FF9800 - Orange)

---

### TaskLabel (`task-label.entity.ts`)
Junction table for Many-to-Many relationship between Task and Label.

**Fields:**
- `taskId`: UUID (foreign key to Task, part of composite primary key)
- `labelId`: UUID (foreign key to Label, part of composite primary key)
- `assignedAt`: Date (auto-generated timestamp)

**Relationships:**
- Many-to-One with Task (CASCADE delete)
- Many-to-One with Label (CASCADE delete)

---

## Entity Relationships Diagram

```
User (1) ----< (N) Project (1) ----< (N) Task (N) ----< (N) TaskLabel (N) ----< (M) Label (M)
                        |
                        |
                        (1) ----< (N) Label
```

## Usage

```typescript
import { User, Project, Task, Label, TaskLabel, TaskStatus } from './models';

// Create entities are handled by TypeORM repositories
const userRepository = AppDataSource.getRepository(User);
const projectRepository = AppDataSource.getRepository(Project);
// etc.
```

## Cascade Deletes

- Deleting a User → Cascades to all their Projects (and thus all Tasks and Labels)
- Deleting a Project → Cascades to all its Tasks and Labels
- Deleting a Task → Cascades to all TaskLabel associations
- Deleting a Label → Cascades to all TaskLabel associations

## Database Constraints

All entities enforce:
- **Primary Keys**: UUID v4
- **Foreign Keys**: Referential integrity with CASCADE deletes
- **Indexes**: Optimized for common queries
- **Unique Constraints**: Email (User), Label names per project
- **Defaults**: Task status defaults to BACKLOG, Label isSystemDefined defaults to false
