import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * T027/T039: DTO для регистрации нового пользователя
 */
export class RegisterDto {
  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'Логин (email)',
    minLength: 3,
    maxLength: 255,
    pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
  })
  @IsNotEmpty({ message: 'Логин обязателен' })
  @IsString({ message: 'Логин должен быть строкой' })
  @MinLength(3, { message: 'Логин должен быть минимум 3 символа' })
  @MaxLength(255, { message: 'Логин не может превышать 255 символов' })
  @IsEmail({}, { message: 'Логин должен быть валидным email' })
  login!: string;

  @ApiProperty({
    example: 'SecurePass123',
    description: 'Пароль (минимум 8 символов, 1 заглавная, 1 строчная, 1 цифра)',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)',
  })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен быть минимум 8 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать минимум 1 заглавную, 1 строчную букву и 1 цифру',
  })
  password!: string;
}
