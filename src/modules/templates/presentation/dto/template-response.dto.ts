import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateDto } from '../../application/services/template-management.service';

export class TemplateResponseDto implements TemplateDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() language!: string;
  @ApiProperty() category!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: 'array', items: { type: 'object' } }) components!: Record<string, unknown>[];
  @ApiPropertyOptional() rejectedReason?: string;
  @ApiProperty() localId!: string;
  @ApiProperty() whatsAppAccountId!: string;
  @ApiPropertyOptional() lastError?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static from(value: TemplateDto): TemplateResponseDto {
    return Object.assign(new TemplateResponseDto(), value);
  }
}
