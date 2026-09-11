import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
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

  @ApiPropertyOptional({
    description: 'Recomendação de segurança do BODY de templates AUTHENTICATION.',
  })
  @IsOptional()
  @IsBoolean()
  addSecurityRecommendation?: boolean;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 90,
    description: 'Validade exibida no FOOTER de templates AUTHENTICATION, em minutos.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  codeExpirationMinutes?: number;

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
