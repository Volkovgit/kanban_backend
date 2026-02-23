# Business Logic Requirements Quality Checklist: Kanban Backend

**Purpose**: Validate business logic requirements quality - rules, workflows, state transitions, validations, and invariants
**Created**: 2026-02-23
**Feature**: [Kanban Board Authentication and Management](../spec.md)
**Focus**: Business Logic (domain rules, state machines, constraints, workflows)

---

## Authentication & Authorization Logic

### Login Workflow Rules

- [ ] CHK001 - Are user existence check requirements specified before password validation? [Clarity, Spec §FR-002]
- [ ] CHK002 - Is the order of validation checks specified (format → existence → password)? [Clarity, Gap]
- [ ] CHK003 - Are failed login attempt counting requirements specified (per user, per IP)? [Completeness, Spec §FR-003a]
- [ ] CHK004 - Is lockout reset timing specified (15 minutes from first attempt or last)? [Clarity, Spec §FR-003a]
- [ ] CHK005 - Are successful login lockout reset requirements specified? [Completeness, Spec §FR-003b]
- [ ] CHK006 - Are concurrent login session requirements specified (single session or multiple)? [Gap, Coverage]

### Token Management Logic

- [ ] CHK007 - Is token generation algorithm specified (JWT signing method)? [Clarity, Spec §Assumptions-2]
- [ ] CHK008 - Are token payload claim requirements specified (user ID, expiry, etc.)? [Completeness, Gap]
- [ ] CHK009 - Is token validation logic specified (signature verification, expiry check)? [Completeness, Spec §FR-005]
- [ ] CHK010 - Are refresh token requirements specified (rotation, revocation)? [Gap, Coverage]
- [ ] CHK011 - Is logout token invalidation logic specified? [Gap, Coverage]

---

## Board Management Logic

### Board Creation Rules

- [ ] CHK012 - Are board title uniqueness requirements specified (per user or globally)? [Clarity, Spec §FR-007/FR-008]
- [ ] CHK013 - Are board description default value requirements specified (optional vs required)? [Clarity, Spec §FR-007]
- [ ] CHK014 - Are board creation timestamp requirements specified? [Completeness, Gap]
- [ ] CHK015 - Is maximum boards per user limit specified? [Gap, Coverage]

### Board Update Rules

- [ ] CHK016 - Are partial update rules specified (PATCH semantics)? [Clarity, Gap]
- [ ] CHK017 - Are immutable field requirements specified (which fields cannot be changed)? [Completeness, Gap]
- [ ] CHK018 - Are board ownership transfer requirements specified? [Gap, Edge Case]
- [ ] CHK019 - Is update timestamp tracking requirement specified? [Gap, Coverage]

### Board Deletion Rules

- [ ] CHK020 - Is cascade delete order specified (tasks before board or vice versa)? [Clarity, Spec §FR-013]
- [ ] CHK021 - Are cascade delete failure handling requirements specified? [Completeness, Spec §FR-013]
- [ ] CHK022 - Is soft delete vs hard delete logic explicitly stated? [Clarity, Spec §Assumptions-9]
- [ ] CHK023 - Are "last board" deletion rules specified (can user delete all boards)? [Edge Case, Gap]

---

## Task Management Logic

### Task Creation Rules

- [ ] CHK024 - Is task title uniqueness requirement specified (within board or can duplicate)? [Clarity, Gap]
- [ ] CHK025 - Are default value application rules specified (status=BACKLOG, priority=MEDIUM)? [Completeness, Spec §FR-015/FR-015a]
- [ ] CHK026 - Is task creation timestamp requirement specified? [Completeness, Gap]
- [ ] CHK027 - Are task-to-board association validation rules specified? [Completeness, Spec §FR-016/FR-027]
- [ ] CHK028 - Is maximum tasks per board limit specified? [Gap, Coverage]

### Task Update Rules

- [ ] CHK029 - Are partial update rules specified (which fields are updatable)? [Clarity, Spec §FR-018]
- [ ] CHK030 - Are status change validation rules specified? [Completeness, Spec §FR-022/FR-023]
- [ ] CHK031 - Are priority change validation rules specified? [Completeness, Spec §FR-023a]
- [ ] CHK032 - Are task reordering requirements specified (position within status)? [Gap, Future Enhancement]
- [ ] CHK033 - Is update timestamp tracking requirement specified? [Gap, Coverage]

### Task Deletion Rules

- [ ] CHK034 - Is orphaned task prevention specified (what happens if board deleted first)? [Completeness, Spec §FR-013]
- [ ] CHK035 - Are task deletion constraints specified (can delete task with dependencies)? [Gap, Future Enhancement]

---

## Status Workflow Logic

### Status Transition Rules

- [ ] CHK036 - Are all valid status transitions explicitly allowed (any → any)? [Completeness, Spec §FR-022]
- [ ] CHK037 - Are status transition validation requirements specified? [Completeness, Spec §FR-023]
- [ ] CHK038 - Are invalid status transition error requirements specified? [Completeness, Spec §FR-024]
- [ ] CHK039 - Is status transition history logging requirement specified? [Gap, Coverage]
- [ ] CHK040 - Are status transition notification requirements specified? [Gap, Future Enhancement]

### Status Value Constraints

- [ ] CHK041 - Are status enum values fully enumerated (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)? [Completeness, Spec §FR-021]
- [ ] CHK042 - Is status case-sensitivity requirement specified (uppercase vs lowercase)? [Clarity, Gap]
- [ ] CHK043 - Are custom status creation requirements specified? [Gap, Future Enhancement]

---

## Priority Logic

### Priority Assignment Rules

- [ ] CHK044 - Are priority enum values fully enumerated (LOW, MEDIUM, HIGH, CRITICAL)? [Completeness, Spec §FR-021a]
- [ ] CHK045 - Are default priority assignment rules specified? [Completeness, Spec §FR-015a]
- [ ] CHK046 - Are priority change validation rules specified? [Completeness, Spec §FR-023a]
- [ ] CHK047 - Are invalid priority error requirements specified? [Completeness, Spec §FR-024a]
- [ ] CHK048 - Is priority case-sensitivity requirement specified? [Clarity, Gap]

---

## Data Integrity & Isolation Logic

### Ownership Validation Rules

- [ ] CHK049 - Are board ownership check requirements specified for all board operations? [Completeness, Spec §FR-009/FR-012]
- [ ] CHK050 - Are task ownership check requirements specified for all task operations? [Completeness, Spec §FR-017/FR-020]
- [ ] CHK051 - Is cross-user data leakage prevention logic specified? [Completeness, Spec §FR-009]
- [ ] CHK052 - Are ownership validation error responses specified (403 Forbidden)? [Completeness, Spec §FR-012/FR-020]

### Cascade Operation Rules

- [ ] CHK053 - Is cascade delete order specified (User → Boards → Tasks)? [Clarity, Spec §FR-013]
- [ ] CHK054 - Are cascade delete transaction requirements specified (all-or-nothing)? [Completeness, Gap]
- [ ] CHK055 - Are cascade delete rollback requirements specified on failure? [Gap, Edge Case]

### Uniqueness Constraints

- [ ] CHK056 - Are username uniqueness validation requirements specified? [Completeness, Spec §Assumptions-8]
- [ ] CHK057 - Are username uniqueness error requirements specified? [Completeness, Gap]
- [ ] CHK058 - Are board title uniqueness requirements specified? [Clarity, Gap]
- [ ] CHK059 - Are resource ID uniqueness constraints specified? [Completeness, Gap]

---

## Validation Logic

### Input Validation Order

- [ ] CHK060 - Is validation order specified (type → format → business rules)? [Clarity, Gap]
- [ ] CHK061 - Are multiple validation error handling requirements specified? [Completeness, Gap]
- [ ] CHK062 - Is validation error aggregation logic specified (return all errors or first)? [Clarity, Gap]

### Field-Level Validation Rules

- [ ] CHK063 - Are username format validation requirements specified (allowed characters)? [Clarity, Spec §Assumptions-8]
- [ ] CHK064 - Is username minimum length requirement specified? [Clarity, Gap]
- [ ] CHK065 - Is username maximum length requirement specified? [Clarity, Gap]
- [ ] CHK066 - Are password complexity validation rules clearly specified? [Completeness, Spec §FR-029]
- [ ] CHK067 - Are board title minimum/maximum length requirements specified? [Clarity, Spec §FR-025/Assumptions-7]
- [ ] CHK068 - Are task title minimum/maximum length requirements specified? [Clarity, Spec §FR-026/Assumptions-7]

### Business Rule Validation

- [ ] CHK069 - Are "user owns resource" validation requirements specified? [Completeness, Spec §FR-012/FR-020]
- [ ] CHK070 - Are "board exists" validation requirements specified? [Completeness, Spec §FR-027]
- [ ] CHK071 - Are "status is valid" validation requirements specified? [Completeness, Spec §FR-023]
- [ ] CHK072 - Are "priority is valid" validation requirements specified? [Completeness, Spec §FR-023a]

---

## State Management Logic

### Default Value Logic

- [ ] CHK073 - Are default value application rules specified (when are defaults applied)? [Clarity, Spec §FR-015/FR-015a]
- [ ] CHK074 - Are default value override requirements specified (explicit vs null)? [Clarity, Gap]
- [ ] CHK075 - Are default value validation rules specified? [Completeness, Gap]

### State Transition Side Effects

- [ ] CHK076 - Are status change side effects specified (notifications, logging)? [Completeness, Gap]
- [ ] CHK077 - Are priority change side effects specified? [Completeness, Gap]
- [ ] CHK078 - Are board deletion side effects specified (cascade delete)? [Completeness, Spec §FR-013]

---

## Error Handling Logic

### Error Response Logic

- [ ] CHK079 - Are error response format requirements specified? [Completeness, Gap]
- [ ] CHK080 - Are validation error field path requirements specified? [Clarity, Gap]
- [ ] CHK081 - Are authentication vs authorization error distinction requirements specified? [Clarity, Spec §FR-002/FR-006]
- [ ] CHK082 - Are "not found" vs "access denied" error distinction requirements specified? [Clarity, Gap]

### Error Recovery Logic

- [ ] CHK083 - Are retry requirements specified for transient errors? [Gap, Coverage]
- [ ] CHK084 - Are lockout recovery requirements specified? [Completeness, Spec §FR-003a]
- [ ] CHK085 - Are operation retry-after-error requirements specified? [Gap, Coverage]

---

## Concurrency & Consistency Logic

### Concurrent Modification Handling

- [ ] CHK086 - Is "Last Write Wins" logic explicitly specified? [Completeness, Spec §Clarifications-Q3]
- [ ] CHK087 - Are concurrent update conflict detection requirements specified? [Completeness, Gap]
- [ ] CHK088 - Are optimistic locking requirements specified? [Completeness, Gap]

### Transaction Boundaries

- [ ] CHK089 - Are transaction boundaries specified for multi-step operations? [Completeness, Gap]
- [ ] CHK090 - Are rollback requirements specified for failed operations? [Gap, Coverage]
- [ ] CHK091 - Are atomic operation requirements specified? [Completeness, Gap]

---

## Business Invariants

### Data Integrity Invariants

- [ ] CHK092 - Is "users cannot see other users' boards" invariant specified? [Completeness, Spec §FR-009]
- [ ] CHK093 - Is "tasks must belong to existing board" invariant specified? [Completeness, Spec §FR-016/FR-027]
- [ ] CHK094 - Is "deleted board deletes all tasks" invariant specified? [Completeness, Spec §FR-013]
- [ ] CHK095 - Is "username must be unique" invariant specified? [Completeness, Spec §Assumptions-8]

### Workflow Invariants

- [ ] CHK096 - Is "any status can transition to any status" invariant specified? [Completeness, Spec §FR-022]
- [ ] CHK097 - Is "default status is BACKLOG" invariant specified? [Completeness, Spec §FR-015]
- [ ] CHK098 - Is "default priority is MEDIUM" invariant specified? [Completeness, Spec §FR-015a]

---

## Completeness Summary

### Logic Coverage by Domain

| Domain | Requirements | Specified | Gaps | Critical |
|--------|-------------|-----------|------|----------|
| Authentication | 11 | 6 | 5 | Token refresh, logout logic |
| Board Management | 12 | 7 | 5 | Board limits, ownership transfer |
| Task Management | 12 | 6 | 6 | Task limits, reordering |
| Status Workflow | 8 | 5 | 3 | History logging, notifications |
| Priority Logic | 5 | 5 | 0 | ✅ Complete |
| Data Integrity | 7 | 5 | 2 | Cascade transaction rules |
| Validation | 13 | 10 | 3 | Validation order, error aggregation |
| State Management | 6 | 3 | 3 | Side effects, override rules |
| Error Handling | 7 | 3 | 4 | Error format, retry logic |
| Concurrency | 6 | 1 | 5 | Conflict detection, transactions |
| Invariants | 7 | 7 | 0 | ✅ Complete |

### Critical Gaps (High Priority)

| # | Gap | Business Logic Impact |
|---|------|----------------------|
| 1 | **Token Refresh Logic** | Authentication workflow incomplete |
| 2 | **Cascade Delete Transactions** | Data inconsistency risk |
| 3 | **Validation Order** | Unclear error handling flow |
| 4 | **Concurrency Conflict Detection** | "Last Write Wins" may cause data loss |
| 5 | **Error Response Format** | Cannot specify error handling logic |
| 6 | **Board/Task Limits** | No protection against resource exhaustion |

### Recommendations

**Before `/speckit.plan`:**

1. **Specify Token Lifecycle Logic**
   - Token refresh requirements
   - Logout invalidation logic
   - Concurrent session handling

2. **Define Cascade Delete Transactions**
   - All-or-nothing semantics
   - Rollback on failure
   - Transaction boundaries

3. **Clarify Validation Logic Order**
   - Type → Format → Business rules
   - Multiple validation error aggregation
   - Error response format

4. **Add Concurrency Handling**
   - Conflict detection requirements
   - Transaction boundaries
   - Rollback semantics

5. **Specify Resource Limits**
   - Max boards per user
   - Max tasks per board
   - Enforce at creation time

### Next Steps

```bash
# 1. Address critical business logic gaps in spec.md
#    - Token lifecycle
#    - Cascade transactions
#    - Validation order
#    - Concurrency handling

# 2. Review all checklists together
ls specs/001-kanban/checklists/

# 3. When ready, proceed to planning
/speckit.plan
```

### Traceability Note

All items reference spec sections where applicable. Items marked `[Gap]` indicate missing business logic requirements. This checklist focuses specifically on **business logic requirements quality** — rules, workflows, invariants, and state transitions that define the system's behavior.
