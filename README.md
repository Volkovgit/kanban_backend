# Kanban Backend API

Express.js REST API server for the Kanban Task Management System with PostgreSQL database and JWT authentication.

## Features

- **Authentication**: JWT-based authentication with refresh tokens
- **Project Management**: CRUD operations for user projects
- **Task Management**: Full task lifecycle with status workflow (Backlog → To Do → In Progress → Review → Done)
- **Label Management**: Project-specific labels for task categorization
- **Search**: Full-text search across tasks
- **Archive**: Completed task management
- **API Documentation**: OpenAPI/Swagger documentation

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL 15+ with TypeORM
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger UI
- **Testing**: Jest (unit/integration), Supertest
- **Logging**: Winston

## Project Structure

```
kanban-backend/
├── src/
│   ├── config/          # Configuration modules (database, CORS, logger, Swagger)
│   ├── controllers/     # HTTP request handlers (Auth, Project, Task, Label)
│   ├── dto/            # Data transfer objects with validation
│   ├── middleware/      # Express middleware (auth, error handling, logging)
│   ├── models/          # TypeORM entities (User, Project, Task, Label)
│   ├── repositories/     # Data access layer with CRUD operations
│   ├── services/        # Business logic layer
│   └── main.ts         # Application entry point
├── tests/
│   ├── contract/        # API contract tests
│   ├── integration/     # Integration tests with database
│   └── unit/           # Unit tests for services
├── docs/               # API documentation and checklists
├── .env.example        # Environment variables template
├── docker-compose.yml   # PostgreSQL container configuration
├── nodemon.json        # Development configuration
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js**: 20.0.0 or higher
- **npm**: 10.0.0 or higher
- **PostgreSQL**: 15+ (via Docker or local installation)
- **Git**: For cloning the repository

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd kanban-backend
npm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Verify container is running
docker-compose ps
```

#### Option B: Local PostgreSQL

Install PostgreSQL 15+ and create a database:

```sql
CREATE DATABASE kanban_dev;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE kanban_dev TO postgres;
```

### 3. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=kanban_dev
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
```

### 4. Run Migrations

```bash
# Run database migrations
npm run migration:run

# Seed initial labels (optional)
npm run seed:labels
```

### 5. Start Development Server

```bash
# Development with auto-reload
npm run dev

# Or start directly
npm start
```

The API will be available at `http://localhost:3000`

**API Documentation**: http://localhost:3000/api-docs

## Available Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start production server

# Building
npm run build            # Compile TypeScript to dist/

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:cov          # Run with coverage
npm run test:integration   # Run integration tests only

# Database Migrations
npm run migration:generate  # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run migration:show     # Show migration status

# Data Seeding
npm run seed:labels      # Seed default labels

# Code Quality
npm run lint             # Check code quality
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Projects
- `GET /api/v1/projects` - List user's projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Tasks
- `GET /api/v1/projects/:projectId/tasks` - List project tasks
- `POST /api/v1/projects/:projectId/tasks` - Create task
- `GET /api/v1/tasks/:id` - Get task details
- `PATCH /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task
- `POST /api/v1/tasks/:id/complete` - Mark task as completed
- `POST /api/v1/tasks/:id/reactivate` - Reactivate completed task

### Labels
- `GET /api/v1/projects/:projectId/labels` - List project labels
- `POST /api/v1/projects/:projectId/labels` - Create label
- `PATCH /api/v1/labels/:id` - Update label
- `DELETE /api/v1/labels/:id` - Delete label

### Search
- `GET /api/v1/search/tasks` - Search across all tasks

### Archive
- `GET /api/v1/tasks/completed` - List completed tasks

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|-----------|
| `DB_HOST` | Database host | localhost | Yes |
| `DB_PORT` | Database port | 5432 | Yes |
| `DB_DATABASE` | Database name | - | Yes |
| `DB_USERNAME` | Database user | - | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret | - | Yes |
| `JWT_EXPIRES_IN` | Access token expiry | 1h | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 7d | No |
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment | development | No |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:4200 | Yes |
| `LOG_LEVEL` | Logging level | info | No |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | 10 | No |

## Testing

### Unit Tests
Test business logic in isolation with mocked dependencies.

```bash
npm run test:unit -- tests/unit
```

### Integration Tests
Test API endpoints and database operations together.

```bash
npm run test:integration
```

### Contract Tests
Verify API contracts match specifications.

```bash
npm run test -- tests/contract
```

### Test Coverage
Target: 70%+ coverage across all modules.

```bash
npm run test:cov
```

## Development

### Adding a New Endpoint

1. **Create DTO** in `src/dto/` with validation decorators
2. **Create Repository** (if needed) extending `BaseRepository`
3. **Create Service** (if needed) extending `BaseService`
4. **Create Controller** extending `BaseController`
5. **Wire Dependencies** in `src/main.ts`
6. **Add Route** to Express app

Example:
```typescript
// src/controllers/example.controller.ts
export class ExampleController extends BaseController {
  constructor(private exampleService: ExampleService) {
    super();
  }

  protected getRouter(): Router {
    const router = Router();
    router.get('/', this.getAll.bind(this));
    return router;
  }

  private async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await this.exampleService.findAll();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
```

## Architecture Patterns

### Layered Architecture
```
Request → Controller → Service → Repository → Database
         ↓            ↓           ↓
      Response    DTO        Entity
```

### Base Classes
- **BaseController**: Common error handling, response formatting
- **BaseService**: Business logic utilities
- **BaseRepository**: CRUD operations with TypeORM

### Error Handling
Centralized error handler returns consistent JSON responses:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "ErrorType",
  "timestamp": "2024-02-10T12:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status (Docker)
docker-compose ps
docker-compose logs postgres

# Check local PostgreSQL
psql -U postgres -d kanban_dev -c "SELECT 1"
```

### Port Already in Use
```bash
# Find process on port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000              # Unix

# Kill process
taskkill /PID <PID> /F       # Windows
kill -9 <PID>                # Unix
``### Migration Issues
```bash
# Show migration status
npm run migration:show

# Revert last migration
npm run migration:revert

# View migration SQL
cat src/migrations/<timestamp>-MigrationName.ts
```

### TypeScript Compilation Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Security Considerations

1. **Change JWT secrets** in production (min 32 characters)
2. **Use strong passwords** for database
3. **Enable HTTPS** in production
4. **Configure CORS** to only allow trusted origins
5. **Rate limit** authentication endpoints
6. **Validate input** on all endpoints (class-validator)
7. **Hash passwords** with bcrypt (auto-handled)

## Documentation

- **API Reference**: `/api-docs` when running
- **OpenAPI Spec**: `docs/openapi.yaml`
- **API Checklist**: `docs/api.md`
- **Database Schema**: `docs/DATABASE.md`

## License

[Your License Here]
