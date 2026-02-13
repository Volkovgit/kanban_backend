/**
 * Label Data Transfer Objects
 *
 * DTOs for label creation, updates, and responses.
 * Uses class-validator for input validation.
 */

import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID, Matches } from 'class-validator';

/**
 * Hex color pattern (e.g., #FF5733)
 */
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Create Label DTO
 * Validates input for creating a new label
 */
export class CreateLabelDto {
  @IsString({ message: 'Label name must be a string' })
  @IsNotEmpty({ message: 'Label name is required' })
  @MaxLength(100, { message: 'Label name must not exceed 100 characters' })
  name!: string;

  @IsString({ message: 'Label color must be a string' })
  @IsNotEmpty({ message: 'Label color is required' })
  @MaxLength(7, { message: 'Label color must not exceed 7 characters' })
  @Matches(HEX_COLOR_PATTERN, { message: 'Label color must be a valid hex color code (e.g., #FF5733)' })
  color!: string;

  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId!: string;
}

/**
 * Update Label DTO
 * Validates input for updating an existing label
 * All fields are optional to support partial updates
 */
export class UpdateLabelDto {
  @IsString({ message: 'Label name must be a string' })
  @IsOptional()
  @IsNotEmpty({ message: 'Label name cannot be empty' })
  @MaxLength(100, { message: 'Label name must not exceed 100 characters' })
  name?: string;

  @IsString({ message: 'Label color must be a string' })
  @IsOptional()
  @MaxLength(7, { message: 'Label color must not exceed 7 characters' })
  @Matches(HEX_COLOR_PATTERN, { message: 'Label color must be a valid hex color code (e.g., #FF5733)' })
  color?: string;
}

/**
 * Label Response DTO
 * Public label information returned in API responses
 */
export interface LabelResponseDto {
  id: string;
  name: string;
  color: string;
  isSystemDefined: boolean;
  projectId: string;
  createdAt: Date;
}

/**
 * Label List Response DTO
 * Response structure for label list
 */
export interface LabelListResponseDto {
  success: true;
  data: LabelResponseDto[];
}

/**
 * Label Detail Response DTO
 * Response structure for single label detail
 */
export interface LabelDetailResponseDto {
  success: true;
  data: LabelResponseDto;
}

export default CreateLabelDto;
