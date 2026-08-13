import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemLogDto } from '../../application/ports/system-log.repository.interface';

export class SystemLogResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() occurredAt!: Date;
  @ApiProperty() level!: string;
  @ApiPropertyOptional() context!: string | null;
  @ApiProperty() message!: string;
  @ApiPropertyOptional() requestId!: string | null;
  @ApiProperty() metadata!: Record<string, unknown>;

  static fromDto(dto: SystemLogDto): SystemLogResponseDto {
    return Object.assign(new SystemLogResponseDto(), dto);
  }
}
