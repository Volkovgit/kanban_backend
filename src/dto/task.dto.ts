/**
 * Task Data Transfer Objects
 *
 * DTOs for task creation, updates, and responses.
 * Uses class-validator for input validation.
 */

import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum, IsArray, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { TaskStatus } from '../../../../libs/shared-types/src/models/task.interface';

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
  @MaxLength(5000, { message: 'Task description must not exceed 5000 characters' })
  description?: string;

  @IsEnum(TaskStatus, { message: 'Status must be one of: Backlog, To Do, In Progress, Review, Done' })
  @IsOptional()
  status?: TaskStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId!: string;

  @IsArray({ message: 'Label IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each label ID must be a valid UUID' })
  @IsOptional()
  labelIds?: string[];
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
  @MaxLength(5000, { message: 'Task description must not exceed 5000 characters' })
  description?: string;

  @IsEnum(TaskStatus, { message: 'Status must be one of: Backlog, To Do, In Progress, Review, Done' })
  @IsOptional()
  status?: TaskStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsArray({ message: 'Label IDs must be an array' })
  @IsUUID('4', { each: true, message: 'Each label ID must be a valid UUID' })
  @IsOptional()
  labelIds?: string[];
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
  dueDate: Date | null;
  projectId: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  labels?: LabelResponseDto[];
}

/**
 * Label Response DTO (minimal for task responses)
 */
export interface LabelResponseDto {
  id: string;
  name: string;
  color: string;
}

/**
 * Task List Response DTO
 * Response structure for paginated task list
 */
export interface TaskListResponseDto {
  success: true;
  data: TaskResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  @IsString({ message: 'Project ID must be a string' })
  projectId?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status filter must be valid' })
  status?: TaskStatus;

  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @IsInt({ message: 'Page size must be an integer' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Min(100, { message: 'Page size must not exceed 100' })
  pageSize?: number;
}

export default CreateTaskDto;
