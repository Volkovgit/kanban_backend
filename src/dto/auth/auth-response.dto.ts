import { ApiProperty } from '@nestjs/swagger';

/**
 * T030/T039: DTO для ответа с токенами аутентификации
 */
export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibG9naW4iOiJqb2huZG9lQGV4YW1wbGUuY29tIiwiaWF0IjoxNjE2MjM5MDIyfQ.',
    description: 'JWT access токен (1 час)',
    format: 'jwt',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibG9naW4iOiJqb2huZG9lQGV4YW1wbGUuY29tIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE2MTYyMzkwMjJ9.',
    description: 'Refresh токен (30 дней)',
    format: 'jwt',
  })
  refreshToken!: string;
}

/**
 * T030/T039: DTO для ответа регистрации
 */
export class RegisterResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID пользователя (UUID v4)',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'Логин пользователя',
  })
  login!: string;
}
