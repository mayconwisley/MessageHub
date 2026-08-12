import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'admin@messagehub.local', format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha-segura', format: 'password', writeOnly: true })
  @IsString()
  @MinLength(1)
  password!: string;
}
