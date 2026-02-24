import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class UpdateTaskWithBoard1708759800000 implements MigrationInterface {
  name = 'UpdateTaskWithBoard1708759800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Переименовать projectId в boardId
    await queryRunner.renameColumn('task', 'projectId', 'boardId');

    // Добавить колонку priority
    await queryRunner.addColumn(
      'task',
      new TableColumn({
        name: 'priority',
        type: 'enum',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: "'MEDIUM'",
      })
    );

    // Обновить enum для status
    await queryRunner.changeColumn(
      'task',
      'status',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
        default: "'BACKLOG'",
      })
    );

    // Удалить старые колонки
    await queryRunner.dropColumn('task', 'dueDate');
    await queryRunner.dropColumn('task', 'completedAt');

    // Удалить таблицу task_labels если существует
    const tableExists = await queryRunner.hasTable('task_labels_label');
    if (tableExists) {
      await queryRunner.dropTable('task_labels_label');
    }

    // Создать индексы
    await queryRunner.createIndex(
      'task',
      new TableIndex({
        name: 'IDX_task_boardId',
        columnNames: ['boardId'],
      })
    );

    await queryRunner.createIndex(
      'task',
      new TableIndex({
        name: 'IDX_task_priority',
        columnNames: ['priority'],
      })
    );

    await queryRunner.createIndex(
      'task',
      new TableIndex({
        name: 'IDX_task_boardId_status',
        columnNames: ['boardId', 'status'],
      })
    );

    // Обновить внешний ключ
    // Примечание: В реальном проекте нужно сначала удалить старый FK
    // Здесь предполагается что старый FK уже не существует или обрабатывается отдельно
    await queryRunner.createForeignKey(
      'task',
      new TableForeignKey({
        columnNames: ['boardId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'board',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Откат изменений - переименовать boardId обратно в projectId
    await queryRunner.renameColumn('task', 'boardId', 'projectId');

    // Удалить priority
    await queryRunner.dropColumn('task', 'priority');

    // Вернуть старые колонки
    await queryRunner.addColumn(
      'task',
      new TableColumn({
        name: 'dueDate',
        type: 'timestamp without time zone',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'task',
      new TableColumn({
        name: 'completedAt',
        type: 'timestamp without time zone',
        isNullable: true,
      })
    );
  }
}
