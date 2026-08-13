import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditLogDto } from '../../application/ports/audit-log.repository.interface';

export class AuditLogResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() occurredAt!: Date;
  @ApiPropertyOptional() actorUserId!: string | null;
  @ApiPropertyOptional() actorEmail!: string | null;
  @ApiProperty() action!: string;
  @ApiProperty() resourceType!: string;
  @ApiPropertyOptional() resourceId!: string | null;
  @ApiPropertyOptional() tenantId!: string | null;
  @ApiPropertyOptional() requestId!: string | null;
  @ApiProperty() httpMethod!: string;
  @ApiProperty() httpPath!: string;
  @ApiProperty() httpStatus!: number;
  @ApiProperty() metadata!: Record<string, unknown>;

  static fromDto(dto: AuditLogDto): AuditLogResponseDto {
    return Object.assign(new AuditLogResponseDto(), dto);
  }
}
