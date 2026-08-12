import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TemplateBodyExampleRowRequestDto {
  @ApiPropertyOptional({ example: ['João Silva', 'PED-123'] })
  @IsArray()
  @IsString({ each: true })
  values!: string[];
}

export class TemplateComponentExampleRequestDto {
  @ApiPropertyOptional({ example: ['Pedido #123'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  headerText?: string[];

  @ApiPropertyOptional({
    type: [TemplateBodyExampleRowRequestDto],
    description:
      'Cada linha contém uma amostra completa, na ordem dos placeholders {{1}}, {{2}}, etc.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateBodyExampleRowRequestDto)
  bodyText?: TemplateBodyExampleRowRequestDto[];
}
