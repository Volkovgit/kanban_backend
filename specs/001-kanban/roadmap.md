# Kanban Backend Development Roadmap

**Project**: Kanban Board Backend API
**Created**: 2026-02-23
**Status**: Active

---

## Iteration Plan

### 🎯 Iteration 1: MVP - Single User Access (CURRENT)

**Branch**: `001-kanban`
**Status**: In Progress
**Goal**: Basic kanban functionality for single user per board

**Scope**:
- ✅ User Authentication (login via login/password)
- ✅ Board Management (CRUD for boards)
- ✅ Task Management (CRUD for tasks with status workflow)
- ✅ Task Status Workflow (bi-directional: BACKLOG ↔ TODO ↔ IN_PROGRESS ↔ REVIEW ↔ DONE)
- ✅ Task Priority (LOW, MEDIUM, HIGH, CRITICAL, default MEDIUM)
- ✅ Data Isolation (users see only their own boards/tasks)

**User Stories**:
- P1: User Authentication
- P2: Board Management
- P3: Task Management
- P4: Task Status Workflow

**Constraints**:
- Each board has exactly one owner
- No sharing or collaboration features
- No real-time updates
- No comments, attachments, or labels

**Success Criteria**:
- User can register, login, and receive auth token
- User can create boards and tasks independently
- Tasks default to BACKLOG status and MEDIUM priority
- Status workflow is bi-directional (any status → any status)
- Complete data isolation between users

---

### 🤝 Iteration 2: Shared Board Access (FUTURE)

**Estimated Branch**: `002-shared-boards`
**Status**: Planned
**Goal**: Enable collaboration between users on shared boards

**Scope**:
- Board invitations and access management
- Role-based permissions (Owner, Editor, Viewer)
- Multiple users per board
- Shared task management with permissions

**User Stories** (TBD):
- Board Owner can invite other users
- Invited users can access shared boards
- Role-based permissions (Owner > Editor > Viewer)
- Board member management (add/remove members)

**Key Entities to Add**:
- **BoardMember**: Связь между User и Board с ролью (OWNER, EDITOR, VIEWER)
- **Invitation**: Приглашение для участия в доске (статус: PENDING, ACCEPTED, DECLINED)

**Permission Matrix**:

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| View board | ✅ | ✅ | ✅ |
| Create task | ✅ | ✅ | ❌ |
| Edit own task | ✅ | ✅ | ❌ |
| Edit any task | ✅ | ❌ | ❌ |
| Delete own task | ✅ | ✅ | ❌ |
| Delete any task | ✅ | ❌ | ❌ |
| Edit board | ✅ | ❌ | ❌ |
| Delete board | ✅ | ❌ | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ |

**Technical Considerations**:
- Update ownership validation middleware to support roles
- Add permission checks for each CRUD operation
- Cascade delete: when board deleted, remove all BoardMember records
- Audit log for board sharing actions

---

### 🔍 Iteration 3: Search & Filtering (FUTURE)

**Estimated Branch**: `003-search-filter`
**Status**: Planned
**Goal**: Advanced task search and filtering capabilities

**Scope**:
- Multi-parameter search across tasks
- Filter by status, priority, assignee, labels
- Full-text search on title and description
- Search across all user's boards

**Requirements Preview**:
- Search endpoint: `GET /api/v1/search/tasks`
- Composable filters (status + priority + assignee)
- Paginated results (max 100 per page)
- Scoped to user's accessible boards

---

### 💬 Iteration 4: Comments & Activity (FUTURE)

**Estimated Branch**: `004-comments-activity`
**Status**: Planned
**Goal**: Task collaboration features

**Scope**:
- Comments on tasks
- Activity history log
- Mention other users
- Edit/delete own comments

**Key Entities to Add**:
- **Comment**: Task comments with author, timestamp, content
- **ActivityLog**: History of changes (who changed what and when)

---

### 🏷️ Iteration 5: Labels & Tags (FUTURE)

**Estimated Branch**: `005-labels`
**Status**: Planned
**Goal**: Task categorization with labels

**Scope**:
- Create and manage labels per board
- Multiple labels per task
- Label colors
- Filter tasks by labels

**Key Entities to Add**:
- **Label**: Board-scoped labels (name, color)
- **TaskLabel**: Junction table for many-to-many relationship

---

## Dependencies

```
Iter 1 (MVP) 
    ↓
Iter 2 (Shared Boards) ← requires Iter 1 foundation
    ↓
Iter 3 (Search) ← benefits from shared boards
    ↓
Iter 4 (Comments) ← requires shared boards for mentions
    ↓
Iter 5 (Labels) ← independent, can be done earlier
```

---

## MVP Release Criteria

Iteration 1 is considered complete when:
- [ ] All 4 user stories implemented and tested
- [ ] 70%+ test coverage achieved
- [ ] API documentation complete (Swagger/OpenAPI)
- [ ] Constitution compliance verified
- [ ] Edge cases handled (cascade delete, validation)
- [ ] Performance targets met (login < 5s, create board/task < 3s)

---

## Notes

- Each iteration should be independently deployable
- Breaking changes require API version bump
- Database migrations must be reversible
- All iterations follow same architecture principles (layered, base classes, manual DI)
