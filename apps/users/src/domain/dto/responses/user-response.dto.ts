/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for user creation
 * Using class-transformer for value transformations and Swagger for API documentation
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '507f1f77bcf86cd799439011',
  })
  @Transform(({ obj }) => obj._id?.toString() || obj.id)
  id: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Date and time when the user was created',
    example: '2025-07-25T12:34:56.789Z',
    type: String,
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  createdAt: Date | string;

  constructor(data: { id: string; email: string; createdAt: Date | string }) {
    this.id = data.id;
    this.email = data.email;
    this.createdAt = data.createdAt;
  }
}
