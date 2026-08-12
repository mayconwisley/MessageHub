import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';

export class UpdateTenantStatusRequestDto {
  @ApiProperty({ enum: TenantStatus })
  @IsEnum(TenantStatus)
  status!: TenantStatus;
}
