import { ApiProperty } from '@nestjs/swagger';
import { TenantDto } from '../../application/dto/tenant.dto';

export class TenantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Prazo de retenção de mensagens, e-mails e webhooks em dias.' })
  dataRetentionDays!: number;

  @ApiProperty()
  createdAt!: Date;

  static fromDto(dto: TenantDto): TenantResponseDto {
    const response = new TenantResponseDto();
    response.id = dto.id;
    response.name = dto.name;
    response.status = dto.status;
    response.dataRetentionDays = dto.dataRetentionDays;
    response.createdAt = dto.createdAt;
    return response;
  }
}
