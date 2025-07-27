import { ApiProperty } from '@nestjs/swagger';
import { PhishingStatus } from '../../interfaces/phishing.interface';

export class PhishingResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the phishing attempt',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the targeted user',
    example: '507f1f77bcf86cd799439012',
  })
  userId: string;

  @ApiProperty({
    description: 'Email of the targeted user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Name of the targeted user',
    example: 'John Doe',
  })
  targetName: string;

  @ApiProperty({
    description: 'Current status of the phishing attempt',
    enum: PhishingStatus,
    example: PhishingStatus.PENDING,
  })
  status: PhishingStatus;

  @ApiProperty({
    description: 'Human-readable description of the phishing status',
    example: 'User clicked the phishing link and was scammed',
    required: false,
  })
  statusDescription?: string;

  @ApiProperty({
    description: 'When the phishing attempt was created',
    example: '2025-07-26T14:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the phishing attempt was last updated',
    example: '2025-07-26T14:30:00.000Z',
    required: false,
  })
  updatedAt?: Date;
}
