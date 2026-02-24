/**
 * TypeORM Data Source для CLI (миграции)
 *
 * Этот файл создаёт отдельный инстанс DataSource для использования в TypeORM CLI
 */

import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'kanban_user',
  password: 'kanban_password',
  database: 'kanban_db',
  entities: ['src/models/**/*.entity.{ts,js}'],
  migrations: ['src/migrations/*.{ts,js}'],
  synchronize: true, // Используем synchronize для создания таблиц
  logging: false,
});
