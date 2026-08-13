import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ConfigureApplicationQuotasRequestDto {
  @ApiProperty({ minimum: 1, maximum: 100000 })
  @IsInt()
  @Min(1)
  @Max(100000)
  quotaPerMinute!: number;

  @ApiProperty({ minimum: 1, maximum: 100000000 })
  @IsInt()
  @Min(1)
  @Max(100000000)
  quotaPerDay!: number;
}
