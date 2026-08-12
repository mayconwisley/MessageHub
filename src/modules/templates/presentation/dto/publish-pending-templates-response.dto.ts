import { ApiProperty } from '@nestjs/swagger';

export class PublishPendingTemplatesResponseDto {
  @ApiProperty({ example: 3 })
  published!: number;

  @ApiProperty({ example: 1 })
  failed!: number;

  @ApiProperty({ example: 0 })
  skipped!: number;
}
