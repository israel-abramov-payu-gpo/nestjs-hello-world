import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Request DTO for verifying a user session
 */
export class VerifySessionDto {
  @ApiProperty({
    description: 'The ID of the user to verify the session for',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
