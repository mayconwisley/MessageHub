import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageDto } from '../../application/dto/message.dto';

export class MessageResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiProperty()
  phoneNumberId!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty() type!: string;
  @ApiPropertyOptional() template!: MessageDto['template'];

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  idempotencyKey!: string | null;

  @ApiPropertyOptional()
  providerMessageId!: string | null;

  @ApiProperty()
  attemptCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromDto(dto: MessageDto): MessageResponseDto {
    const response = new MessageResponseDto();
    response.id = dto.id;
    response.tenantId = dto.tenantId;
    response.applicationId = dto.applicationId;
    response.phoneNumberId = dto.phoneNumberId;
    response.to = dto.to;
    response.content = dto.content;
    response.type = dto.type;
    response.template = dto.template;
    response.status = dto.status;
    response.idempotencyKey = dto.idempotencyKey;
    response.providerMessageId = dto.providerMessageId;
    response.attemptCount = dto.attemptCount;
    response.createdAt = dto.createdAt;
    response.updatedAt = dto.updatedAt;
    return response;
  }
}
