import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * T028/T039: DTO для входа в систему
 */
export class LoginDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'Логин (email)',
  })
  @IsNotEmpty({ message: 'Логин обязателен' })
  @IsString({ message: 'Логин должен быть строкой' })
  @MinLength(3, { message: 'Логин должен быть минимум 3 символа' })
  @MaxLength(255, { message: 'Логин не может превышать 255 символов' })
  login!: string;

  @ApiProperty({
    example: 'SecurePass123',
    description: 'Пароль',
  })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  password!: string;
}
