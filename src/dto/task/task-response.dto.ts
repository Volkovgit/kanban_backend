import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../../enums/task-status.enum';
import { TaskPriority } from '../../enums/task-priority.enum';

/**
 * T072/T079: DTO для ответа с данными задачи
 */
export class TaskResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Уникальный идентификатор задачи',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    example: 'Implement login feature',
    description: 'Название задачи',
  })
  title!: string;

  @ApiProperty({
    example: 'Create login form with validation',
    description: 'Описание задачи',
    required: false,
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: 'IN_PROGRESS',
    description: 'Статус задачи',
    enum: TaskStatus,
  })
  status!: TaskStatus;

  @ApiProperty({
    example: 'HIGH',
    description: 'Приоритет задачи',
    enum: TaskPriority,
  })
  priority!: TaskPriority;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID доски',
    format: 'uuid',
  })
  boardId!: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Дата создания задачи',
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-15T12:45:00.000Z',
    description: 'Дата последнего обновления задачи',
    format: 'date-time',
  })
  updatedAt!: Date;
}
