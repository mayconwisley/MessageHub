import { ApiProperty } from '@nestjs/swagger';

export class SyncTemplatesResponseDto {
  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 2 })
  created!: number;

  @ApiProperty({ example: 8 })
  updated!: number;

  @ApiProperty({ example: 2 })
  deleted!: number;
}
