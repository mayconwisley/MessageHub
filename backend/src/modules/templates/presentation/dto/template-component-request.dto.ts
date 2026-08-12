import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TemplateComponentExampleRequestDto } from './template-component-example-request.dto';

export class TemplateComponentRequestDto {
  @ApiProperty({ example: 'BODY' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ example: 'TEXT' })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiPropertyOptional({ example: 'Olá {{1}}, seu pedido {{2}} foi confirmado.' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ type: TemplateComponentExampleRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateComponentExampleRequestDto)
  example?: TemplateComponentExampleRequestDto;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  buttons?: Record<string, unknown>[];

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  location?: Record<string, unknown>;
}
