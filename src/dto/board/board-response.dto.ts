import { ApiProperty } from '@nestjs/swagger';

/**
 * T052/T059: DTO для ответа с данными доски
 */
export class BoardResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Уникальный идентификатор доски',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    example: 'My Kanban Board',
    description: 'Название доски',
  })
  title!: string;

  @ApiProperty({
    example: 'Project board for tracking tasks',
    description: 'Описание доски',
    required: false,
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID владельца доски',
    format: 'uuid',
  })
  ownerId!: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Дата создания доски',
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-15T12:45:00.000Z',
    description: 'Дата последнего обновления доски',
    format: 'date-time',
  })
  updatedAt!: Date;
}
