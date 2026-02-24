import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * T050/T059: DTO для создания новой доски
 */
export class CreateBoardDto {
  @ApiProperty({
    example: 'My Kanban Board',
    description: 'Название доски',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Название обязательно' })
  @IsString({ message: 'Название должно быть строкой' })
  @MaxLength(255, { message: 'Название не может превышать 255 символов' })
  title!: string;

  @ApiProperty({
    example: 'Project board for tracking tasks',
    description: 'Описание доски',
    required: false,
    maxLength: 5000,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(5000, { message: 'Описание не может превышать 5000 символов' })
  description?: string | null;
}
