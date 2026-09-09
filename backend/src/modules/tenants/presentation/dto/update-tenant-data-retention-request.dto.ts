import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateTenantDataRetentionRequestDto {
  @ApiProperty({ minimum: 1, maximum: 3650, example: 90 })
  @IsInt()
  @Min(1)
  @Max(3650)
  dataRetentionDays!: number;
}
