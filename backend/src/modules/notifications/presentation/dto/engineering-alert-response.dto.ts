import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EngineeringAlertDto } from '../../application/ports/engineering-alert.repository.interface';

export class EngineeringAlertResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() severity!: string;
  @ApiProperty() title!: string;
  @ApiProperty() message!: string;
  @ApiProperty() metadata!: Record<string, unknown>;
  @ApiProperty() occurredAt!: Date;
  @ApiPropertyOptional() dispatchedAt!: Date | null;
  static fromDto(dto: EngineeringAlertDto): EngineeringAlertResponseDto {
    return Object.assign(new EngineeringAlertResponseDto(), dto);
  }
}
