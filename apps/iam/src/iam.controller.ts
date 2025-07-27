import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Param,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateSessionDto } from './domain/dto/requests/create-session.dto';
import { SessionResponseDto } from './domain/dto/responses/session-response.dto';
import { VerifySessionResponseDto } from './domain/dto/responses/verify-session-response.dto';
import { SessionErrorCode } from './domain/interfaces/error-codes.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { IamService } from './iam.service';

@ApiTags('iam')
@Controller('iam')
export class IamController {
  private readonly logger = new Logger(IamController.name);

  constructor(private readonly iamService: IamService) {}

  @ApiOperation({ summary: 'Create a new session' })
  @ApiBody({ type: CreateSessionDto })
  @ApiCreatedResponse({
    description: 'Session successfully created',
    type: SessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input parameters',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal server error - Error communicating with users service',
  })
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    this.logger.log(`Creating session for user ID: ${createSessionDto.userId}`);
    const result = await this.iamService.createSession(createSessionDto);
    this.logger.log(
      `Session created successfully for user ID: ${createSessionDto.userId}`,
    );
    return result;
  }

  @ApiOperation({
    summary: 'Verify a session',
    description:
      'Verifies if a session token is valid for a specific user. Returns detailed error codes for different types of failures.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to verify the session for',
  })
  @ApiHeader({
    name: 'Authorization',
    description: 'Bearer token for authentication',
    required: true,
    schema: {
      type: 'string',
      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns verification result with detailed error code if invalid',
    type: VerifySessionResponseDto,
    schema: {
      properties: {
        valid: { type: 'boolean', example: false },
        userId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
          nullable: true,
        },
        message: { type: 'string', example: 'Session expired', nullable: true },
        errorCode: {
          type: 'string',
          enum: Object.values(SessionErrorCode),
          example: SessionErrorCode.SESSION_EXPIRED,
          nullable: true,
          description:
            'Error code identifying the specific failure reason when validation fails',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input parameters',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal server error - Error communicating with users service',
  })
  @Get('sessions/:userId/verify')
  async verifySession(
    @Param('userId') userId: string,
    @Headers('authorization') authorization: string,
  ): Promise<VerifySessionResponseDto> {
    this.logger.log(`Verifying session for user ID: ${userId}`);

    if (!authorization) {
      this.logger.warn(
        `Session verification failed: Missing authorization header for user ID: ${userId}`,
      );
      throw new BadRequestException('Authorization header is required');
    }

    const result = await this.iamService.verifySession(userId, authorization);

    if (result.valid) {
      this.logger.log(`Session verified successfully for user ID: ${userId}`);
    } else {
      this.logger.warn(
        `Session verification failed for user ID: ${userId}: ${result.message}`,
      );
    }

    return result;
  }
}
