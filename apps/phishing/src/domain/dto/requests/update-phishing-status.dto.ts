import { IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PhishingStatus } from '../../interfaces/phishing.interface';

export class UpdatePhishingStatusDto {
  @ApiProperty({
    description: 'The new status for the phishing attempt',
    enum: PhishingStatus,
    example: PhishingStatus.SCAMMED,
  })
  @IsEnum(PhishingStatus)
  @IsNotEmpty()
  status: PhishingStatus;
}
