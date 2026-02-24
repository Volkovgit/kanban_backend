import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength, IsEnum, IsUUID } from 'class-validator';
import { TaskStatus } from '../../enums/task-status.enum';
import { TaskPriority } from '../../enums/task-priority.enum';

/**
 * T070/T079: DTO для создания новой задачи
 */
export class CreateTaskDto {
  @ApiProperty({
    example: 'Implement login feature',
    description: 'Название задачи',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Название обязательно' })
  @IsString({ message: 'Название должно быть строкой' })
  @MaxLength(255, { message: 'Название не может превышать 255 символов' })
  title!: string;

  @ApiProperty({
    example: 'Create login form with validation',
    description: 'Описание задачи',
    required: false,
    maxLength: 5000,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(5000, { message: 'Описание не может превышать 5000 символов' })
  description?: string | null;

  @ApiProperty({
    example: 'BACKLOG',
    description: 'Статус задачи',
    enum: TaskStatus,
    required: false,
    default: TaskStatus.BACKLOG,
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Невалидный статус' })
  status?: TaskStatus;

  @ApiProperty({
    example: 'MEDIUM',
    description: 'Приоритет задачи',
    enum: TaskPriority,
    required: false,
    default: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Невалидный приоритет' })
  priority?: TaskPriority;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID доски (извлекается из URL)',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  boardId?: string;
}
