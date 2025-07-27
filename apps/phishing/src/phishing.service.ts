/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Inject,
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
} from '@nestjs/common';
import { EMAIL_CLIENT } from 'libs/email-client/src/lib/constants';
import { EmailClient } from 'libs/email-client/src/lib/interfaces/email.interfaces';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreatePhishingDto } from './domain/dto/requests/create-phishing.dto';
import { Phishing, PhishingStatus } from './domain/entities/phishing.entity';
import { PhishingResponseDto } from './domain/dto/responses/phishing-response.dto';
import { PhishingRepository } from './domain/interfaces/phishing-repository.interface';
import { PHISHING_REPOSITORY } from './domain/interfaces/constants';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class PhishingService {
  private readonly logger = new Logger(PhishingService.name);
  private readonly BASE_URL = process.env.BASE_URL!;
  private readonly IAM_SERVICE_URL = process.env.IAM_SERVICE_URL!;

  constructor(
    @Inject(EMAIL_CLIENT)
    private readonly emailClient: EmailClient,
    @Inject(PHISHING_REPOSITORY)
    private readonly phishingRepository: PhishingRepository,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Create a new phishing attempt and send an email
   */
  async createPhishingAttempt(
    createPhishingDto: CreatePhishingDto,
    authorization: string,
  ): Promise<PhishingResponseDto> {
    this.logger.log(
      `Creating phishing attempt for user: ${createPhishingDto.userId}`,
    );
    // Extract token from Bearer format
    const token = authorization.split(' ')[1];

    try {
      // Create phishing attempt using repository
      const phishing = await this.phishingRepository.createFromDto(
        createPhishingDto,
        token,
      );

      // Send phishing email
      await this.sendPhishingEmail(phishing);

      this.logger.log(
        `Created phishing attempt for user ${createPhishingDto.userId} with ID: ${phishing.id}`,
      );
      return phishing.toPhishingResponseDto();
    } catch (error) {
      this.logger.error(
        `Failed to create phishing attempt for user ${createPhishingDto.userId}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to create phishing attempt',
      );
    }
  }

  /**
   * Validate a phishing token when user clicks the link
   * @param token The JWT token from the phishing link
   * @param phishingId The ID of the phishing attempt
   */
  async validatePhishingToken(
    token: string,
    phishingId: string,
  ): Promise<{ redirectUrl: string }> {
    try {
      try {
        // Decode the token to get the userId (without verification)
        const decodedToken = jwt.decode(token) as { userId: string };
        if (!decodedToken || !decodedToken.userId) {
          this.logger.error('Invalid token format - could not decode token');
          await this.phishingRepository.updateStatus(
            phishingId,
            PhishingStatus.FAILED,
          );
          return { redirectUrl: 'https://www.google.com' };
        }
        const userId = decodedToken.userId;

        // Call the IAM service to verify the token
        const verifyUrl = `${this.IAM_SERVICE_URL}/iam/sessions/${userId}/verify`;

        this.logger.log(`Verifying token with IAM service at: ${verifyUrl}`);
        this.logger.log(
          `Using Authorization header: Bearer ${token.substring(0, 20)}...`,
        );

        const response = await firstValueFrom(
          this.httpService.get(verifyUrl, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
        const verificationResult = response.data;

        // If token verification failed, update status to FAILED
        if (!verificationResult.valid) {
          await this.phishingRepository.updateStatus(
            phishingId,
            PhishingStatus.FAILED,
          );
          this.logger.log(
            `Token verification failed for phishing ID ${phishingId}: ${verificationResult.message}, Error code: ${verificationResult.errorCode || 'UNKNOWN'}`,
          );
          return { redirectUrl: 'https://www.google.com' };
        }

        // Find the phishing attempt by its ID
        const phishing = await this.phishingRepository.findById(phishingId);

        if (!phishing || phishing.status !== PhishingStatus.PENDING) {
          this.logger.error(
            `Phishing attempt not found or not pending for ID: ${phishingId}`,
          );
          return { redirectUrl: 'https://www.google.com' };
        }

        // Verify that the token matches this specific phishing attempt
        if (phishing.token !== token) {
          this.logger.error(`Token mismatch for phishing ID: ${phishingId}`);
          await this.phishingRepository.updateStatus(
            phishingId,
            PhishingStatus.FAILED,
          );
          return { redirectUrl: 'https://www.google.com' };
        }

        // Update status to SCAMMED
        await this.phishingRepository.updateStatus(
          phishingId,
          PhishingStatus.SCAMMED,
        );

        this.logger.log(
          `User ${userId} was successfully phished (phishing ID: ${phishingId})`,
        );

        // In a real-world scenario, you might redirect to a legitimate-looking site
        // For this example, we'll redirect to a safe page
        return { redirectUrl: 'https://www.google.com' };
      } catch (error) {
        // Detailed error handling based on the type of error
        if (error.name === 'TokenExpiredError') {
          // Token is expired but not used - mark as EXPIRED (user didn't fall for the phish)
          await this.phishingRepository.updateStatus(
            phishingId,
            PhishingStatus.EXPIRED,
          );
          this.logger.log(
            `Phishing token expired without being used (phishing ID: ${phishingId})`,
          );
        } else if (
          error.response?.status === HttpStatus.UNAUTHORIZED ||
          error.response?.status === HttpStatus.FORBIDDEN
        ) {
          // Authentication failed for other reasons
          await this.phishingRepository.updateStatus(
            phishingId,
            PhishingStatus.FAILED,
          );
          this.logger.log(`Token unauthorized for phishing ID: ${phishingId}`);
        } else {
          this.logger.error(
            `Error validating phishing token for ID ${phishingId}: ${error.message}`,
            error,
          );
          await this.phishingRepository.updateStatus(
            phishingId,
            PhishingStatus.FAILED,
          );
        }

        // Redirect to a safe page
        return { redirectUrl: 'https://www.google.com' };
      }
    } catch (error) {
      this.logger.error(
        `Unexpected error during token validation for phishing ID ${phishingId}: ${error.message}`,
        error,
      );
      return { redirectUrl: 'https://www.google.com' };
    }
  }

  /**
   * Get all phishing attempts
   */
  async getAllPhishingAttempts(): Promise<PhishingResponseDto[]> {
    this.logger.debug('Getting all phishing attempts');

    try {
      const phishingAttempts = await this.phishingRepository.findAll();

      this.logger.debug(`Found ${phishingAttempts.length} phishing attempts`);

      return phishingAttempts.map((phishing) =>
        phishing.toPhishingResponseDto(),
      );
    } catch (error) {
      this.logger.error('Failed to retrieve phishing attempts:', error);
      throw new BadRequestException('Failed to retrieve phishing attempts');
    }
  }

  /**
   * Send the phishing email
   */
  private async sendPhishingEmail(phishingAttempt: Phishing): Promise<void> {
    const { id, email, targetName, token } = phishingAttempt;

    // Create the phishing URL with both token and phishing attempt ID
    const phishingUrl = `${this.BASE_URL}/phishing/validate?token=${token}&id=${id}`;

    // Create an HTML email that looks legitimate
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; margin-bottom: 20px;">Important Security Update</h2>
        <p>Dear ${targetName},</p>
        <p>We've detected some unusual activity on your account. For your security, please verify your account by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${phishingUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Account</a>
        </div>
        <p>If you didn't request this verification, please ignore this email or contact our support team.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    `;

    // Send the email
    await this.emailClient.sendEmail({
      to: email,
      from: 'security@yourcompany.com', // This would be spoofed in a real phishing attempt
      subject: 'Urgent: Security Verification Required',
      html,
    });

    this.logger.log(`Phishing email sent to ${email}`);
  }
}
