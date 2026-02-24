/**
 * TypeORM Data Source Factory
 *
 * This file creates and exports the AppDataSource singleton instance
 * that manages the database connection pool.
 *
 * Usage:
 * ```ts
 * import { AppDataSource } from './config/data-source';
 * await AppDataSource.initialize();
 * ```
 */

import { DataSource } from 'typeorm';
import { dbConfig } from './database';

/**
 * Application-wide DataSource singleton
 * This instance is used across the application to interact with the database
 */
export const AppDataSource = new DataSource(dbConfig);

/**
 * Initialize database connection
 * Call this during application startup
 */
export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Close database connection
 * Call this during application shutdown
 */
export async function closeDatabase(): Promise<void> {
  try {
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
}

/**
 * Check if database is connected
 */
export function isDatabaseConnected(): boolean {
  return AppDataSource.isInitialized;
}
