import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'admin@messagehub.local', format: 'email' })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ example: 'senha-segura', format: 'password', writeOnly: true })
  @IsString()
  @IsByteLength(1, 72)
  password!: string;
}
