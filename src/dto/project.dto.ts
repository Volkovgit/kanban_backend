/**
 * Project Data Transfer Objects
 *
 * DTOs for project creation, updates, and responses.
 * Uses class-validator for input validation.
 */

import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

/**
 * Create Project DTO
 * Validates input for creating a new project
 */
export class CreateProjectDto {
  @IsString({ message: 'Project name must be a string' })
  @IsNotEmpty({ message: 'Project name is required' })
  @MaxLength(255, { message: 'Project name must not exceed 255 characters' })
  name!: string;

  @IsString({ message: 'Project description must be a string' })
  @IsOptional()
  @MaxLength(5000, { message: 'Project description must not exceed 5000 characters' })
  description?: string;
}

/**
 * Update Project DTO
 * Validates input for updating an existing project
 * All fields are optional to support partial updates
 */
export class UpdateProjectDto {
  @IsString({ message: 'Project name must be a string' })
  @IsOptional()
  @IsNotEmpty({ message: 'Project name cannot be empty' })
  @MaxLength(255, { message: 'Project name must not exceed 255 characters' })
  name?: string;

  @IsString({ message: 'Project description must be a string' })
  @IsOptional()
  @MaxLength(5000, { message: 'Project description must not exceed 5000 characters' })
  description?: string;
}

/**
 * Project Response DTO
 * Public project information returned in API responses
 */
export interface ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  taskCount?: number; // Optional: include count of tasks in the project
}

/**
 * Project List Response DTO
 * Response structure for paginated project list
 */
export interface ProjectListResponseDto {
  success: true;
  data: ProjectResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Project Detail Response DTO
 * Response structure for single project detail
 */
export interface ProjectDetailResponseDto {
  success: true;
  data: ProjectResponseDto;
}

export default CreateProjectDto;
