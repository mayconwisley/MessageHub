import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { TemplateComponentRequestDto } from './template-component-request.dto';

export class CreateTemplateRequestDto {
  @ApiPropertyOptional({
    description: 'Obrigatório apenas para requisições autenticadas por sessão administrativa.',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty() @IsUUID() whatsAppAccountId!: string;
  @ApiProperty({ example: 'order_confirmation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  name!: string;
  @ApiProperty({ example: 'pt_BR' }) @IsString() @IsNotEmpty() language!: string;
  @ApiProperty({ example: 'UTILITY' }) @IsString() @IsNotEmpty() category!: string;
  @ApiProperty({ type: [TemplateComponentRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateComponentRequestDto)
  components!: TemplateComponentRequestDto[];
  @ApiPropertyOptional({ example: 'POSITIONAL' })
  @IsOptional()
  @IsString()
  parameterFormat?: string;
}
