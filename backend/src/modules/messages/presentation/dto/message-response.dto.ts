import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageAttemptDto, MessageDto } from '../../application/dto/message.dto';

class MessageLastErrorDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  occurredAt!: Date;
}

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

  @ApiPropertyOptional({ type: MessageLastErrorDto })
  lastError!: { code: string; message: string; occurredAt: Date } | null;

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
    response.lastError = dto.lastError;
    response.createdAt = dto.createdAt;
    response.updatedAt = dto.updatedAt;
    return response;
  }
}

export class MessageAttemptResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  attemptNumber!: number;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  errorCode!: string | null;

  @ApiPropertyOptional()
  errorMessage!: string | null;

  @ApiProperty()
  occurredAt!: Date;

  static fromDto(dto: MessageAttemptDto): MessageAttemptResponseDto {
    const response = new MessageAttemptResponseDto();
    response.id = dto.id;
    response.attemptNumber = dto.attemptNumber;
    response.status = dto.status;
    response.errorCode = dto.errorCode;
    response.errorMessage = dto.errorMessage;
    response.occurredAt = dto.occurredAt;
    return response;
  }
}
