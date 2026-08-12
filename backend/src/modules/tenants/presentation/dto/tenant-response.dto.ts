import { ApiProperty } from '@nestjs/swagger';
import { TenantDto } from '../../application/dto/tenant.dto';

export class TenantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromDto(dto: TenantDto): TenantResponseDto {
    const response = new TenantResponseDto();
    response.id = dto.id;
    response.name = dto.name;
    response.status = dto.status;
    response.createdAt = dto.createdAt;
    return response;
  }
}
