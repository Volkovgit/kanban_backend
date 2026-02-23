import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UserAuthFields1708759600000 implements MigrationInterface {
  name = 'UserAuthFields1708759600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Добавить поля для аутентификации в таблицу user
    await queryRunner.addColumns('user', [
      new TableColumn({
        name: 'failedLoginAttempts',
        type: 'int',
        default: 0,
      }),
      new TableColumn({
        name: 'lockedUntil',
        type: 'timestamp without time zone',
        isNullable: true,
      }),
      new TableColumn({
        name: 'refreshToken',
        type: 'text',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удалить поля из таблицы user
    await queryRunner.dropColumns('user', [
      'failedLoginAttempts',
      'lockedUntil',
      'refreshToken',
    ]);
  }
}
