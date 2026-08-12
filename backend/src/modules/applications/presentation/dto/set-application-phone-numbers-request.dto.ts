import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class SetApplicationPhoneNumbersRequestDto {
  @ApiProperty({ type: [String], description: 'IDs internos dos phone numbers vinculados.' })
  @IsArray()
  @IsUUID('4', { each: true })
  phoneNumberIds!: string[];
}
