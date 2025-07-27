/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * Response DTO for session creation
 */
export class SessionResponseDto {
  @ApiProperty({
    description: 'Session ID',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'JWT token with Bearer prefix',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Date and time when the session was created',
    example: '2025-07-25T12:34:56.789Z',
    type: String,
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  createdAt: Date | string;

  @ApiProperty({
    description: 'Date and time when the session expires',
    example: '2025-07-25T13:34:56.789Z',
    type: String,
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  expiresAt: Date | string;

  constructor(data: {
    id: string;
    userId: string;
    token: string;
    createdAt: Date | string;
    expiresAt: Date | string;
  }) {
    this.id = data.id;
    this.userId = data.userId;
    this.token = data.token;
    this.createdAt = data.createdAt;
    this.expiresAt = data.expiresAt;
  }
}
