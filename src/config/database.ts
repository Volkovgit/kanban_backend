/**
 * TypeORM Database Configuration
 *
 * This file exports the TypeORM configuration options used throughout the application.
 * The actual DataSource is created in data-source.ts to support migrations and testing.
 */

import { DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { join } from 'path';

/**
 * Database configuration options
 * Reads from environment variables with defaults for development
 */
export const dbConfig: PostgresConnectionOptions & DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'kanban_dev',

  // Entity locations
  entities: [join(__dirname, '..', 'models', '**', '*.entity.{ts,js}')],
  // Alternative: Import from index
  // entities: [join(__dirname, '..', 'models')],

  // Migration locations
  migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],

  // Synchronization (NEVER use in production)
  synchronize: process.env.NODE_ENV === 'development' ? true : false,

  // Logging
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],

  // Extra configuration
  extra: {
    max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 100,
    idleTimeoutMillis: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT, 10) : 30000,
    connectionTimeoutMillis: process.env.DB_CONNECTION_TIMEOUT ? parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) : 10000,
  },

  // SSL (disabled for local development, enable for production)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

/**
 * Export dbConfig for use in data-source.ts
 */
export default dbConfig;
