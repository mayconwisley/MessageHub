import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTemplateRequestDto {
  @ApiProperty() @IsUUID() whatsAppAccountId!: string;
  @ApiProperty({ example: 'order_confirmation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  name!: string;
  @ApiProperty({ example: 'pt_BR' }) @IsString() @IsNotEmpty() language!: string;
  @ApiProperty({ example: 'UTILITY' }) @IsString() @IsNotEmpty() category!: string;
  @ApiProperty({ type: 'array', items: { type: 'object' } }) @IsArray() components!: Record<
    string,
    unknown
  >[];
  @ApiPropertyOptional({ example: 'POSITIONAL' })
  @IsOptional()
  @IsString()
  parameterFormat?: string;
}
