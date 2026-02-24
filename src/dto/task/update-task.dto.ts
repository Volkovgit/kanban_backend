import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength, IsEnum } from 'class-validator';
import { TaskStatus } from '../../enums/task-status.enum';
import { TaskPriority } from '../../enums/task-priority.enum';

/**
 * T071/T079: DTO для обновления задачи
 * Все поля опциональные - обновляется только то, что передано
 */
export class UpdateTaskDto {
  @ApiProperty({
    example: 'Updated task title',
    description: 'Новое название задачи',
    required: false,
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(255, { message: 'Название не может превышать 255 символов' })
  title?: string;

  @ApiProperty({
    example: 'Updated description',
    description: 'Новое описание задачи',
    required: false,
    maxLength: 5000,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(5000, { message: 'Описание не может превышать 5000 символов' })
  description?: string | null;

  @ApiProperty({
    example: 'IN_PROGRESS',
    description: 'Новый статус задачи',
    required: false,
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Невалидный статус' })
  status?: TaskStatus;

  @ApiProperty({
    example: 'HIGH',
    description: 'Новый приоритет задачи',
    required: false,
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Невалидный приоритет' })
  priority?: TaskPriority;
}
