import { ApiProperty } from '@nestjs/swagger';
import { SessionErrorCode } from '../../interfaces/error-codes.interface';

/**
 * Response DTO for session verification
 */
export class VerifySessionResponseDto {
  @ApiProperty({
    description: 'Whether the session is valid',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'User ID if session is valid',
    example: '507f1f77bcf86cd799439011',
    nullable: true,
  })
  userId?: string;

  @ApiProperty({
    description: 'Error message if session is invalid',
    example: 'Session expired',
    nullable: true,
  })
  message?: string;

  @ApiProperty({
    description: 'Error code if session verification failed',
    enum: SessionErrorCode,
    example: SessionErrorCode.SESSION_EXPIRED,
    nullable: true,
  })
  errorCode?: SessionErrorCode;

  constructor(data: {
    valid: boolean;
    userId?: string;
    message?: string;
    errorCode?: SessionErrorCode;
  }) {
    this.valid = data.valid;
    this.userId = data.userId;
    this.message = data.message;
    this.errorCode = data.errorCode;
  }
}
