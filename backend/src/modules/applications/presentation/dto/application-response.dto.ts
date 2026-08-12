import { ApiProperty } from '@nestjs/swagger';
import { ApplicationDto } from '../../application/dto/application.dto';

export class ApplicationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  static fromDto(dto: ApplicationDto): ApplicationResponseDto {
    const response = new ApplicationResponseDto();
    response.id = dto.id;
    response.tenantId = dto.tenantId;
    response.name = dto.name;
    response.status = dto.status;
    response.createdAt = dto.createdAt;
    return response;
  }
}
