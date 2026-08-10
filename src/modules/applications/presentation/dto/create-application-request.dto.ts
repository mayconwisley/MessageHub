import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateApplicationRequestDto {
  @ApiProperty()
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'Order Notifications' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;
}
