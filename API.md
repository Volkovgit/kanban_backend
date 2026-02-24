# Kanban API Documentation

Interactive documentation is available at `/api-docs` when the server is running. Below are examples of common requests.

## Base URL
`http://localhost:3000/api/v1`

---

## Authentication

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "login": "testuser",
    "password": "Password123!"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "testuser",
    "password": "Password123!"
  }'
```
*Returns `accessToken` and `refreshToken`.*

---

## Boards
*Requires `Authorization: Bearer <accessToken>` header*

### 1. Create a Board
```bash
curl -X POST http://localhost:3000/api/v1/boards \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Kanban Board",
    "description": "Board for tracking project progress"
  }'
```

### 2. Get All User Boards
```bash
curl -X GET http://localhost:3000/api/v1/boards \
  -H "Authorization: Bearer <token>"
```

---

## Tasks
*Requires `Authorization: Bearer <accessToken>` header*

### 1. Create a Task
```bash
curl -X POST http://localhost:3000/api/v1/boards/<boardId>/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Setup database",
    "description": "Initialize PostgreSQL database"
  }'
```

### 2. Get Tasks for a Board
```bash
curl -X GET 'http://localhost:3000/api/v1/boards/<boardId>/tasks?status=BACKLOG' \
  -H "Authorization: Bearer <token>"
```

### 3. Update Task Status
```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/<taskId> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

---

## Health Check

### Get Server Health
```bash
curl -X GET http://localhost:3000/api/v1/health
```
