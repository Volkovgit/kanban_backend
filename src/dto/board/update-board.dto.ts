import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

/**
 * T051/T059: DTO для обновления доски
 * Все поля опциональные - обновляется только то, что передано
 */
export class UpdateBoardDto {
  @ApiProperty({
    example: 'Updated Board Title',
    description: 'Новое название доски',
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
    description: 'Новое описание доски',
    required: false,
    maxLength: 5000,
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MaxLength(5000, { message: 'Описание не может превышать 5000 символов' })
  description?: string | null;
}
