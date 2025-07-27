/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Inject,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { CreateSessionDto } from './domain/dto/requests/create-session.dto';
import { SessionResponseDto } from './domain/dto/responses/session-response.dto';
import { VerifySessionResponseDto } from './domain/dto/responses/verify-session-response.dto';
import {
  JwtPayload,
  SessionRepository,
} from './domain/interfaces/session.interface';
import { SessionErrorCode } from './domain/interfaces/error-codes.interface';
import * as jwt from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SESSION_REPOSITORY } from './domain/interfaces/constants';

@Injectable()
export class IamService {
  private readonly JWT_SECRET: string;
  private readonly USERS_SERVICE_URL: string;
  private readonly logger = new Logger(IamService.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly httpService: HttpService,
  ) {
    this.JWT_SECRET = process.env.JWT_SECRET!;
    this.USERS_SERVICE_URL = process.env.USERS_SERVICE_URL!;
  }

  /**
   * Create a new session for a user
   * @param createSessionDto The session creation data
   * @returns The created session response
   */
  /**
   * Check if user exists by making a call to the users service
   * @param userId The user ID to check
   * @throws NotFoundException if user does not exist
   */
  private async checkUserExists(userId: string): Promise<void> {
    this.logger.debug(`Checking if user exists: ${userId}`);
    try {
      // Make a request to users service to check if user exists
      const url = `${this.USERS_SERVICE_URL}/users/${userId}`;
      this.logger.debug(`Making request to users service: GET ${url}`);

      await firstValueFrom(this.httpService.get(url));

      this.logger.debug(`User ${userId} exists`);
      // If we get here, the user exists
      return;
    } catch (error) {
      // If user service returns 404, user doesn't exist
      if (error.status === 404) {
        this.logger.warn(`User not found: ${userId}`);
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Any other error is a service error
      this.logger.error(
        `Error communicating with users service for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Error communicating with users service: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a new session for a user
   * @param createSessionDto The session creation data
   * @returns The created session response
   */
  async createSession(
    createSessionDto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    const { userId, ttlMinutes = 60 } = createSessionDto;

    this.logger.log(
      `Creating session for user ${userId} with TTL ${ttlMinutes} minutes`,
    );

    // Check if the user exists by calling the users service
    await this.checkUserExists(userId);

    // Create session ID
    const sessionId = new ObjectId().toString();
    this.logger.debug(`Generated session ID: ${sessionId}`);

    // Create JWT payload
    const payload: JwtPayload = {
      userId,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ttlMinutes * 60,
    };

    this.logger.debug(
      `Creating JWT token with expiry in ${ttlMinutes} minutes`,
    );
    // Generate JWT token
    const token = jwt.sign(payload, this.JWT_SECRET);

    // Create a new session using the repository method that accepts the DTO
    this.logger.debug(`Saving session to repository`);
    const session = await this.sessionRepository.create(
      createSessionDto,
      token,
    );

    this.logger.log(`Session created successfully for user ${userId}`);
    // Return the session response DTO using the toDto method
    return session.toSessionResponseDto();
  }

  /**
   * Extract JWT token from authorization header
   * @param authHeader The authorization header value
   * @returns The JWT token or null if not found or invalid format
   */
  private extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) {
      this.logger.debug('Authorization header is missing');
      return null;
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.debug('Authorization header does not start with "Bearer "');
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    this.logger.debug(
      `Token extracted successfully: ${token.substring(0, 10)}...`,
    );
    return token;
  }

  /**
   * Verify a session token
   * @param userId The user ID to verify
   * @param authHeader The authorization header with the JWT token
   * @returns Session verification result
   */
  async verifySession(
    userId: string,
    authHeader: string,
  ): Promise<VerifySessionResponseDto> {
    this.logger.log(`Verifying session for user ${userId}`);

    // Extract token from header
    const token = this.extractTokenFromHeader(authHeader);
    if (!token) {
      this.logger.warn(
        `Invalid authorization header format for user ${userId}`,
      );
      return new VerifySessionResponseDto({
        valid: false,
        message: 'Invalid authorization header format',
        errorCode: SessionErrorCode.INVALID_TOKEN,
      });
    }

    try {
      // Verify token and decode payload
      this.logger.debug(`Verifying JWT token for user ${userId}`);
      const payload = jwt.verify(token, this.JWT_SECRET) as JwtPayload;

      // Check if token belongs to the requested user
      if (payload.userId !== userId) {
        this.logger.warn(
          `Token user ID mismatch. Token: ${payload.userId}, Requested: ${userId}`,
        );
        return new VerifySessionResponseDto({
          valid: false,
          message: 'Token does not match the requested user',
          errorCode: SessionErrorCode.TOKEN_MISMATCH,
        });
      }

      // Find session in database
      this.logger.debug(
        `Looking up session in database for token: ${token.substring(0, 10)}...`,
      );
      const session = await this.sessionRepository.findByToken(token, userId);

      // Check if session exists
      if (!session) {
        this.logger.warn(`Session not found or revoked for user ${userId}`);
        return new VerifySessionResponseDto({
          valid: false,
          message: 'Session not found or revoked',
          errorCode: SessionErrorCode.SESSION_NOT_FOUND,
        });
      }

      // Check if session is expired
      if (session.isExpired()) {
        this.logger.warn(`Session expired for user ${userId}`);
        return session.toVerifySessionResponseDto({
          valid: false,
          message: 'Session expired',
          errorCode: SessionErrorCode.SESSION_EXPIRED,
        });
      }

      // Verify user still exists in users service
      try {
        this.logger.debug(`Verifying user ${userId} still exists`);
        await this.checkUserExists(userId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn(`User no longer exists: ${userId}`);
          return session.toVerifySessionResponseDto({
            valid: false,
            message: 'User no longer exists',
            errorCode: SessionErrorCode.USER_NOT_FOUND,
          });
        }
        // For other errors, we'll consider the session valid if everything else checks out
        this.logger.warn(
          `Error checking if user exists, but continuing: ${error.message}`,
        );
      }

      // Session is valid
      this.logger.log(`Session verified successfully for user ${userId}`);
      return session.toVerifySessionResponseDto({
        valid: true,
      });
    } catch (error) {
      // Different types of JWT verification errors
      if (error.name === 'JsonWebTokenError') {
        this.logger.warn(
          `Invalid JWT token for user ${userId}: ${error.message}`,
        );
        return new VerifySessionResponseDto({
          valid: false,
          message: 'Invalid token: ' + error.message,
          errorCode: SessionErrorCode.INVALID_TOKEN,
        });
      } else {
        this.logger.error(
          `Unknown error during token verification for user ${userId}: ${error.message}`,
        );
        return new VerifySessionResponseDto({
          valid: false,
          message: error.message || 'Unknown error during token verification',
          errorCode: SessionErrorCode.UNKNOWN_ERROR,
        });
      }
    }
  }
}
