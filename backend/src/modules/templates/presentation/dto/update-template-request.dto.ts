import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TemplateComponentRequestDto } from './template-component-request.dto';

export class UpdateTemplateRequestDto {
  @ApiProperty({ example: 'UTILITY' }) @IsString() @IsNotEmpty() category!: string;
  @ApiProperty({ type: [TemplateComponentRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentRequestDto)
  components!: TemplateComponentRequestDto[];
  @ApiPropertyOptional({ example: 'POSITIONAL' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  parameterFormat?: string;
}
