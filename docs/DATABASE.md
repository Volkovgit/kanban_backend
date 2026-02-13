# Database & ORM Setup Guide

## Overview

This API uses TypeORM with PostgreSQL for data persistence.

## Environment Variables

Required environment variables (see `apps/api/.env.example`):

```bash
DB_HOST=localhost          # PostgreSQL server host
DB_PORT=5432               # PostgreSQL server port
DB_DATABASE=kanban_dev      # Database name
DB_USERNAME=postgres        # Database user
DB_PASSWORD=postgres        # Database password
```

## Database Setup

### Option 1: Local PostgreSQL

```bash
# Create database
createdb kanban_dev

# Copy environment file
cp .env.example .env

# Update .env with your database credentials
# Run migrations (when implemented)
npm run migration:run
```

### Option 2: Docker PostgreSQL

```bash
# Start PostgreSQL container
docker run --name kanban-postgres \
  -e POSTGRES_DB=kanban_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres

# Run migrations
npm run migration:run
```

## TypeORM Configuration

- **Config File**: `apps/api/src/config/database.ts`
- **Data Source**: `apps/api/src/config/data-source.ts`
- **Entities**: `apps/api/src/models/`
- **Migrations**: `apps/api/src/migrations/`

## Migration Commands

```bash
# Create a new migration
npm run migration:generate -- -n MigrationName

# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

## Entity Structure

All entities extend the base TypeORM decorators:

- **@Entity()**: Marks class as a database entity
- **@PrimaryColumn()**: Defines the primary key (UUID)
- **@Column()**: Defines table columns
- **@CreateDateColumn()**: Auto-generated creation timestamp
- **@UpdateDateColumn()**: Auto-update timestamp

## Connection Pool

The application uses TypeORM's built-in connection pooling:

- **Max Connections**: 100 (configurable via DB_MAX_CONNECTIONS)
- **Idle Timeout**: 30 seconds (configurable via DB_IDLE_TIMEOUT)
- **Connection Timeout**: 10 seconds (configurable via DB_CONNECTION_TIMEOUT)

## Database Schema

See `specs/001-kanban/data-model.md` for complete entity definitions:

- **users** - User accounts
- **projects** - Project containers
- **tasks** - Work items with status
- **labels** - Categorical tags
- **task_labels** - Junction table for task-label many-to-many

## Troubleshooting

### Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check database exists
psql -U postgres -l | grep kanban

# Test connection
psql -U postgres -d kanban_dev
```

### Migration Errors

```bash
# Show migration status
npm run migration:show

# Rollback and rerun
npm run migration:revert
npm run migration:run
```

## Next Steps

After database setup:
1. ✅ Create entities (User, Project, Task, Label)
2. ✅ Create repositories for data access
3. ✅ Create services for business logic
4. ✅ Create controllers for API endpoints
