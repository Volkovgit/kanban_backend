import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * T029/T039: DTO для обновления токена
 */
export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibG9naW4iOiJqb2huZG9lQGV4YW1wbGUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE2MjYyNzIwMDAsImV4cCI6MTYyOTEzNjAwMH0.',
    description: 'Refresh токен (JWT)',
    format: 'jwt',
  })
  @IsNotEmpty({ message: 'Refresh токен обязателен' })
  @IsString({ message: 'Refresh токен должен быть строкой' })
  refreshToken!: string;
}
