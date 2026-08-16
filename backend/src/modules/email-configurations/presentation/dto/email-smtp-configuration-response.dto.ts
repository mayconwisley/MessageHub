import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailSmtpConfigurationDto } from '../../application/dto/email-smtp-configuration.dto';

export class EmailSmtpConfigurationResponseDto {
  @ApiPropertyOptional() id!: string | null;
  @ApiProperty({ enum: ['default', 'tenant', 'none'] }) source!: 'default' | 'tenant' | 'none';
  @ApiPropertyOptional() host!: string | null;
  @ApiPropertyOptional() port!: number | null;
  @ApiPropertyOptional() secure!: boolean | null;
  @ApiPropertyOptional() username!: string | null;
  @ApiPropertyOptional() fromEmail!: string | null;
  @ApiPropertyOptional() fromName!: string | null;
  @ApiPropertyOptional() createdAt!: Date | null;
  @ApiPropertyOptional() updatedAt!: Date | null;

  static fromDto(dto: EmailSmtpConfigurationDto): EmailSmtpConfigurationResponseDto {
    return Object.assign(new EmailSmtpConfigurationResponseDto(), dto);
  }
}
