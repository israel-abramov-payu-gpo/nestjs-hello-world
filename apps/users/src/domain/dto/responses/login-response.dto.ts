import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT session token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Session ID',
    example: '507f1f77bcf86cd799439011',
  })
  sessionId: string;

  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439012',
  })
  userId: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Token expiration date',
    example: '2024-01-15T10:30:00.000Z',
  })
  expiresAt: string;

  @ApiProperty({
    description: 'Session creation date',
    example: '2024-01-15T09:30:00.000Z',
  })
  createdAt: string;

  constructor(
    token: string,
    sessionId: string,
    userId: string,
    email: string,
    expiresAt: string,
    createdAt: string,
  ) {
    this.token = token;
    this.sessionId = sessionId;
    this.userId = userId;
    this.email = email;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
  }
}
