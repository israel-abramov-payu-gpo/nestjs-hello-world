import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * Request DTO for creating a user session
 */
export class CreateSessionDto {
  @ApiProperty({
    description: 'The ID of the user to create a session for',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Session time-to-live in minutes (optional, defaults to 60)',
    example: 30,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1440) // Max 24 hours
  ttlMinutes?: number;
}
