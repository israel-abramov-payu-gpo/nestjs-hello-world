import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePhishingDto {
  @ApiProperty({
    description: 'The ID of the user to target with the phishing attempt',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Email address of the target',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Name of the target user',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  targetName: string;
}
