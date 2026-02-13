/**
 * TypeORM Migration Configuration
 *
 * This file provides utilities for running database migrations
 *
 * Migration commands:
 * ```bash
 * # Generate a new migration
 * npm run migration:generate -- -n MigrationName
 *
 * # Run all pending migrations
 * npm run migration:run
 *
 * # Revert last migration
 * npm run migration:revert
 *
 * # Show migration status
 * npm run migration:show
 * ```
 */

import { AppDataSource } from './data-source';

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();
    console.log('✅ Migrations executed successfully');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await AppDataSource.destroy();
    throw error;
  }
}

/**
 * Revert the last migration
 */
export async function revertLastMigration(): Promise<void> {
  try {
    await AppDataSource.initialize();
    await AppDataSource.undoLastMigration();
    console.log('✅ Last migration reverted successfully');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Failed to revert migration:', error);
    await AppDataSource.destroy();
    throw error;
  }
}

/**
 * Show migration status
 */
export async function showMigrationStatus(): Promise<void> {
  try {
    await AppDataSource.initialize();
    const migrations = await AppDataSource.showMigrations();
    console.log('📊 Migration Status:');
    console.log(migrations);
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Failed to show migration status:', error);
    await AppDataSource.destroy();
    throw error;
  }
}

export { AppDataSource };
