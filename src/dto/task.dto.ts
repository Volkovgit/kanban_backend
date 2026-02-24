/**
 * Task Data Transfer Objects
 *
 * DTOs for task creation, updates, and responses.
 * Uses class-validator for input validation.
 */

import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { TaskStatus, TaskPriority } from '../enums';

/**
 * Create Task DTO
 * Validates input for creating a new task
 */
export class CreateTaskDto {
  @IsString({ message: 'Task title must be a string' })
  @IsNotEmpty({ message: 'Task title is required' })
  @MaxLength(255, { message: 'Task title must not exceed 255 characters' })
  title!: string;

  @IsString({ message: 'Task description must be a string' })
  @IsOptional()
  @MaxLength(5000, {
    message: 'Task description must not exceed 5000 characters',
  })
  description?: string;

  @IsEnum(TaskStatus, {
    message: 'Status must be one of: BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE',
  })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority, {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID('4', { message: 'Board ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Board ID is required' })
  boardId!: string;
}

/**
 * Update Task DTO
 * Validates input for updating an existing task
 * All fields are optional to support partial updates
 */
export class UpdateTaskDto {
  @IsString({ message: 'Task title must be a string' })
  @IsOptional()
  @IsNotEmpty({ message: 'Task title cannot be empty' })
  @MaxLength(255, { message: 'Task title must not exceed 255 characters' })
  title?: string;

  @IsString({ message: 'Task description must be a string' })
  @IsOptional()
  @MaxLength(5000, {
    message: 'Task description must not exceed 5000 characters',
  })
  description?: string;

  @IsEnum(TaskStatus, {
    message: 'Status must be one of: BACKLOG, TODO, IN_PROGRESS, REVIEW, DONE',
  })
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority, {
    message: 'Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL',
  })
  @IsOptional()
  priority?: TaskPriority;
}

/**
 * Task Response DTO
 * Public task information returned in API responses
 */
export interface TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task List Response DTO
 * Response structure for paginated task list
 */
export interface TaskListResponseDto {
  success: true;
  data: TaskResponseDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Task Detail Response DTO
 * Response structure for single task detail
 */
export interface TaskDetailResponseDto {
  success: true;
  data: TaskResponseDto;
}

/**
 * Task Query DTO
 * Query parameters for task listing
 */
export class TaskQueryDto {
  @IsOptional()
  @IsString({ message: 'Board ID must be a string' })
  boardId?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status filter must be valid' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Priority filter must be valid' })
  priority?: TaskPriority;

  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}

export default CreateTaskDto;
