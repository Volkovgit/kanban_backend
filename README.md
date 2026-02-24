# Kanban Backend API

A RESTful API server for a Kanban Task Management System.

## Prerequisites
- Node.js 20+
- PostgreSQL
- Docker & Docker Compose (optional, for DB)

## Setup & Installation

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to match your local setup.*

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start PostgreSQL using Docker:
   ```bash
   docker-compose up -d postgres
   ```

4. Run database migrations:
   ```bash
   npm run migration:run
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm test` - Run all tests
- `npm run test:cov` - Run tests with coverage
- `npm run migration:run` - Run pending migrations
- `npm run migration:generate -- name` - Generate new migration
- `npm run migration:revert` - Revert last migration

## API Documentation
Once the server is running, the interactive Swagger UI is available at:
`http://localhost:3000/api-docs`
