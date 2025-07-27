import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
  Headers,
  Logger,
} from '@nestjs/common';
import { PhishingService } from './phishing.service';
import { CreatePhishingDto } from './domain/dto/requests/create-phishing.dto';
import { PhishingResponseDto } from './domain/dto/responses/phishing-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('phishing')
@Controller('phishing')
export class PhishingController {
  private readonly logger = new Logger(PhishingController.name);

  constructor(private readonly phishingService: PhishingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new phishing attempt' })
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
    status: HttpStatus.CREATED,
    description: 'The phishing attempt has been successfully created.',
    type: PhishingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error - unexpected error occurred',
  })
  async createPhishingAttempt(
    @Body() createPhishingDto: CreatePhishingDto,
    @Headers('authorization') authorization: string,
  ): Promise<PhishingResponseDto> {
    this.logger.log(
      `Creating phishing attempt for user: ${createPhishingDto.userId}`,
    );

    const result = await this.phishingService.createPhishingAttempt(
      createPhishingDto,
      authorization,
    );
    this.logger.log(
      `Phishing attempt created successfully for user: ${createPhishingDto.userId}`,
    );
    return result;
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate a phishing token and redirect user' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'The phishing token to validate',
  })
  @ApiQuery({
    name: 'id',
    required: true,
    description: 'The phishing attempt ID',
  })
  async validateToken(
    @Query('token') token: string,
    @Query('id') phishingId: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Validating phishing token for attempt ID: ${phishingId}`);

    const { redirectUrl } = await this.phishingService.validatePhishingToken(
      token,
      phishingId,
    );

    this.logger.log(`Phishing token validated, redirecting to: ${redirectUrl}`);
    // Redirect the user to the specified URL
    res.redirect(redirectUrl);
  }

  @Get('getAll')
  @ApiOperation({ summary: 'Get all phishing attempts' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error - unexpected error occurred',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all phishing attempts',
    type: [PhishingResponseDto],
  })
  async getAllPhishingAttempts(): Promise<PhishingResponseDto[]> {
    this.logger.log('Getting all phishing attempts');
    const result = await this.phishingService.getAllPhishingAttempts();
    this.logger.log(`Retrieved ${result.length} phishing attempts`);
    return result;
  }
}
