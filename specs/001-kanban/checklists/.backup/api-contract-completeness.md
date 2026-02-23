# API Contract Completeness Checklist: Kanban Backend

**Purpose**: Validate API contract specification completeness - every endpoint must have fully specified request/response contracts
**Created**: 2026-02-23
**Feature**: [Kanban Board Authentication and Management](../spec.md)
**Focus**: API Contract (endpoints, methods, payloads, status codes)

**Relationship to other checklists**:
- `api-requirements-quality.md` — общий чеклист качества требований
- `ux-api-contract.md` — фокус на developer experience
- `api-contract-completeness.md` — **этот чеклист**, фокус на полноте контрактов endpoint'ов

---

## Endpoint Specification Completeness

### Authentication Endpoints

- [ ] CHK001 - Is registration endpoint specified (POST /users or /auth/register)? [Gap, Endpoint]
- [ ] CHK002 - Is login endpoint specified (POST /auth/login)? [Completeness, Spec §FR-001/FR-004]
- [ ] CHK003 - Is token refresh endpoint specified? [Gap, Endpoint]
- [ ] CHK004 - Is logout endpoint specified? [Gap, Endpoint]
- [ ] CHK005 - Are all authentication endpoint request/response contracts specified? [Completeness, Gap]

### Board Endpoints

- [ ] CHK006 - Is list boards endpoint specified (GET /boards or /projects)? [Completeness, Spec §FR-009]
- [ ] CHK007 - Is create board endpoint specified (POST /boards)? [Completeness, Spec §FR-007]
- [ ] CHK008 - Is get board endpoint specified (GET /boards/:id)? [Completeness, Spec §FR-012]
- [ ] CHK009 - Is update board endpoint specified (PATCH/PUT /boards/:id)? [Completeness, Spec §FR-010]
- [ ] CHK010 - Is delete board endpoint specified (DELETE /boards/:id)? [Completeness, Spec §FR-011/FR-013]

### Task Endpoints

- [ ] CHK011 - Is list tasks endpoint specified (GET /boards/:boardId/tasks)? [Completeness, Spec §FR-017]
- [ ] CHK012 - Is create task endpoint specified (POST /boards/:boardId/tasks)? [Completeness, Spec §FR-014]
- [ ] CHK013 - Is get task endpoint specified (GET /tasks/:id)? [Completeness, Spec §FR-020]
- [ ] CHK014 - Is update task endpoint specified (PATCH/PUT /tasks/:id)? [Completeness, Spec §FR-018]
- [ ] CHK015 - Is delete task endpoint specified (DELETE /tasks/:id)? [Completeness, Spec §FR-019]

### Additional Endpoints (Potential Gaps)

- [ ] CHK016 - Is health check endpoint specified (GET /health or /ping)? [Gap, Operations]
- [ ] CHK017 - Is API documentation endpoint specified (GET /api-docs)? [Gap, Constitution]

---

## Request Contract Completeness

### Authentication Requests

- [ ] CHK018 - Is registration request body specified (username, password fields)? [Gap, Request Contract]
- [ ] CHK019 - Is login request body specified (username, password fields)? [Gap, Request Contract]
- [ ] CHK020 - Are request validation rules specified for auth endpoints? [Completeness, Spec §FR-003/FR-029]

### Board Requests

- [ ] CHK021 - Is create board request body specified (title, description fields)? [Clarity, Spec §FR-007]
- [ ] CHK022 - Are board field types specified (string for title/description)? [Clarity, Gap]
- [ ] CHK023 - Are board field length limits specified (max length)? [Clarity, Spec §FR-025/FR-028]
- [ ] CHK024 - Is update board request body specified (which fields are updatable)? [Clarity, Spec §FR-010]

### Task Requests

- [ ] CHK025 - Is create task request body specified (title, description, status, priority)? [Clarity, Spec §FR-014/FR-015/FR-015a]
- [ ] CHK026 - Are task field types specified (status enum, priority enum)? [Clarity, Spec §FR-021/FR-021a]
- [ ] CHK027 - Are task field length limits specified? [Clarity, Spec §FR-026/FR-028]
- [ ] CHK028 - Is update task request body specified (which fields are updatable)? [Clarity, Spec §FR-018]

---

## Response Contract Completeness

### Success Responses

- [ ] CHK029 - Are success response formats specified (200, 201)? [Gap, Response Contract]
- [ ] CHK030 - Is authentication success response specified (token structure)? [Clarity, Spec §FR-004]
- [ ] CHK031 - Are resource response formats specified (board object, task object)? [Gap, Response Contract]
- [ ] CHK032 - Are list response formats specified (array with pagination)? [Gap, Response Contract]
- [ ] CHK033 - Are all response field names specified (id, title, description, status, etc.)? [Completeness, Gap]

### Error Responses

- [ ] CHK034 - Are error response formats specified (structure, fields)? [Gap, Response Contract]
- [ ] CHK035 - Is validation error response specified (400 status)? [Completeness, Spec §FR-003]
- [ ] CHK036 - Is authentication error response specified (401 status)? [Completeness, Spec §FR-002/FR-006]
- [ ] CHK037 - Is authorization error response specified (403 status)? [Completeness, Spec §FR-012/FR-020]
- [ ] CHK038 - Is not found error response specified (404 status)? [Gap, Response Contract]
- [ ] CHK039 - Is conflict/lockout error response specified (409 or 423 status)? [Completeness, Spec §FR-003a]
- [ ] CHK040 - Is server error response specified (500 status)? [Gap, Response Contract]

---

## HTTP Method & Status Code Completeness

- [ ] CHK041 - Are HTTP methods specified for all endpoints (GET, POST, PATCH, DELETE)? [Gap, Contract]
- [ ] CHK042 - Are success status codes specified (200, 201, 204)? [Gap, Contract]
- [ ] CHK043 - Are error status codes specified for all failure scenarios? [Completeness, Gap]
- [ ] CHK044 - Is PATCH vs PUT usage clarified for updates? [Clarity, Gap]
- [ ] CHK045 - Are idempotency requirements specified for safe methods (GET, DELETE)? [Completeness, Gap]

---

## Header & Metadata Completeness

- [ ] CHK046 - Are authentication header requirements specified (Authorization: Bearer)? [Gap, Headers]
- [ ] CHK047 - Are content-type headers specified (application/json)? [Gap, Headers]
- [ ] CHK048 - Are response headers specified (pagination, rate limits)? [Gap, Headers]
- [ ] CHK049 - Are correlation ID headers specified (X-Request-ID)? [Gap, Observability]
- [ ] CHK050 - Are CORS headers specified (Access-Control-Allow-Origin)? [Clarity, Spec §Assumptions]

---

## Validation Rule Completeness

- [ ] CHK051 - Are username validation rules specified (length, characters)? [Clarity, Spec §Assumptions-8]
- [ ] CHK052 - Is password complexity rule specified (8+ chars, 1 upper, 1 lower, 1 digit)? [Completeness, Spec §FR-029]
- [ ] CHK053 - Are board title validation rules specified (non-empty, max length)? [Completeness, Spec §FR-025]
- [ ] CHK054 - Are task title validation rules specified (non-empty, max length)? [Completeness, Spec §FR-026]
- [ ] CHK055 - Are UUID validation rules specified for resource IDs? [Gap, Validation]
- [ ] CHK056 - Is board existence validation specified (task must belong to existing board)? [Completeness, Spec §FR-027]

---

## Enum & Constraint Completeness

- [ ] CHK057 - Are task status enum values fully specified (BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE)? [Completeness, Spec §FR-021]
- [ ] CHK058 - Are task priority enum values fully specified (LOW, MEDIUM, HIGH, CRITICAL)? [Completeness, Spec §FR-021a]
- [ ] CHK059 - Are status transition constraints specified (any → any)? [Completeness, Spec §FR-022]
- [ ] CHK060 - Are default values specified for optional fields (status=BACKLOG, priority=MEDIUM)? [Completeness, Spec §FR-015/FR-015a]

---

## Pagination & Filtering Contract

- [ ] CHK061 - Are pagination parameters specified (page, pageSize or offset, limit)? [Gap, Contract]
- [ ] CHK062 - Are pagination response headers specified (X-Total-Count, X-Total-Pages)? [Gap, Contract]
- [ ] CHK063 - Are sorting parameters specified (sortBy, sortOrder)? [Gap, Contract]
- [ ] CHK064 - Are filtering parameters specified (status, priority filters)? [Gap, Future Enhancement]
- [ ] CHK065 - Are search parameters specified (q, titleContains)? [Gap, Future Enhancement]

---

## Authentication & Authorization Contract

- [ ] CHK066 - Is token format specified (JWT structure, claims)? [Clarity, Spec §Assumptions-2]
- [ ] CHK067 - Is token expiry specified (access token lifetime)? [Gap, Contract]
- [ ] CHK068 - Are protected endpoint markers specified (which endpoints require auth)? [Completeness, Spec §FR-005]
- [ ] CHK069 - Are ownership validation rules specified (user can only access their resources)? [Completeness, Spec §FR-009/FR-012/FR-020]
- [ ] CHK070 - Is admin/owner role distinction specified? [Gap, Authorization]

---

## Versioning & Evolution Contract

- [ ] CHK071 - Is API versioning specified (/api/v1/ prefix)? [Gap, Contract]
- [ ] CHK072 - Are breaking change notification requirements specified? [Gap, Contract]
- [ ] CHK073 - Is deprecation policy specified? [Gap, Future Enhancement]
- [ ] CHK074 - Are backward compatibility requirements specified? [Gap, Contract]

---

## Completeness Summary

### Endpoint Coverage

| Category | Required Endpoints | Specified | Missing |
|----------|-------------------|-----------|---------|
| Authentication | 4 (register, login, refresh, logout) | 1-2 | 2-3 |
| Boards | 5 (list, create, get, update, delete) | 5 implied | 0 |
| Tasks | 5 (list, create, get, update, delete) | 5 implied | 0 |
| Operations | 2 (health, docs) | 0 | 2 |

### Contract Coverage

| Contract Aspect | Status | Gap Count |
|----------------|--------|-----------|
| Request Bodies | ⚠️ Partial | 8 |
| Response Bodies | ❌ Missing | 10 |
| HTTP Methods | ❌ Missing | 5 |
| Status Codes | ⚠️ Partial | 6 |
| Headers | ❌ Missing | 5 |
| Validation Rules | ⚠️ Partial | 6 |
| Pagination | ❌ Missing | 5 |
| Authentication | ⚠️ Partial | 4 |

### Critical Gaps (Must Address Before Planning)

1. **Response Body Schemas** — Не указаны форматы ответов для всех endpoint'ов
2. **HTTP Methods** — Не указаны методы (GET/POST/PATCH/DELETE) для endpoint'ов
3. **Error Response Structure** — Не указан формат ошибок
4. **Token Format** — Не указана структура JWT токена
5. **Pagination Parameters** — Не указаны параметры пагинации
6. **Request Headers** — Не указаны требуемые заголовки (Authorization, Content-Type)

### Recommendations

**Before `/speckit.plan`:**

1. **Add API Contract Section** to spec.md with:
   - All endpoints with HTTP methods
   - Request body schemas for POST/PATCH
   - Response body schemas for all responses
   - Error response format standard

2. **Specify Authentication Contract:**
   - JWT token structure and claims
   - Token expiry times
   - Refresh token flow

3. **Define Pagination Standard:**
   - Parameter names (page/pageSize or offset/limit)
   - Response headers for pagination metadata

4. **Document Header Requirements:**
   - Authorization header format
   - Content-Type expectations
   - Rate limit headers

### Next Steps

```bash
# 1. Add API Contract section to spec.md
#    Specify endpoints, methods, request/response schemas

# 2. Review related checklists
cat specs/001-kanban/checklists/api-requirements-quality.md
cat specs/001-kanban/checklists/ux-api-contract.md

# 3. When ready, proceed to planning
/speckit.plan
```

### Traceability Note

Items reference spec sections where available. Items marked `[Gap]` indicate missing API contract specifications that should be added. This checklist focuses specifically on **API contract completeness** — every endpoint must have fully specified request/response contracts before implementation.
