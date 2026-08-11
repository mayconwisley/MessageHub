import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTemplateRequestDto {
  @ApiProperty({ example: 'UTILITY' }) @IsString() @IsNotEmpty() category!: string;
  @ApiProperty({ type: 'array', items: { type: 'object' } }) @IsArray() components!: Record<
    string,
    unknown
  >[];
  @ApiPropertyOptional({ example: 'POSITIONAL' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  parameterFormat?: string;
}
