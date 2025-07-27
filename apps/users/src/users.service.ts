/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Inject,
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateUserDto } from './domain/dto/requests/create-user.dto';
import { LoginDto } from './domain/dto/requests/login.dto';
import { UserResponseDto } from './domain/dto/responses/user-response.dto';
import { LoginResponseDto } from './domain/dto/responses/login-response.dto';
import { UserRepository } from './domain/interfaces/user-repository.interface';
import { USER_REPOSITORY } from './domain/interfaces/constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly iamServiceUrl = process.env.IAM_SERVICE_URL!;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly httpService: HttpService,
  ) {}
  /**
   * Authenticate user and create session token
   * @param loginDto The login credentials
   * @returns Login response with session token
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for user: ${loginDto.email}`);

    // Find user by email
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(`Login failed - user not found: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      this.logger.warn(
        `Login failed - invalid password for user: ${loginDto.email}`,
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    // Call IAM service to create session token
    try {
      this.logger.debug(
        `Calling IAM service to create session for user: ${user.id}`,
      );

      const iamResponse = await firstValueFrom(
        this.httpService.post(`${this.iamServiceUrl}/iam/sessions`, {
          userId: user.id,
          ttlMinutes: 60, // Default 1 hour session
        }),
      );

      const sessionData = iamResponse.data;

      this.logger.log(
        `Login successful for user: ${loginDto.email}, session created: ${sessionData.id}`,
      );

      return new LoginResponseDto(
        sessionData.token,
        sessionData.id,
        user.id,
        user.email,
        sessionData.expiresAt,
        sessionData.createdAt,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create session for user ${loginDto.email}:`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        'Failed to create session. Please try again.',
      );
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);

    // Basic validation
    if (!createUserDto.email || !createUserDto.password) {
      this.logger.warn(`Missing required fields for user creation`);
      throw new BadRequestException('Email and password are required');
    }

    // Check if user already exists
    this.logger.debug(
      `Checking if user already exists with email: ${createUserDto.email}`,
    );
    const existingUser = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      this.logger.warn(
        `User creation failed - user already exists with email: ${createUserDto.email}`,
      );
      throw new ConflictException('User with this email already exists');
    }

    // Create user using repository
    this.logger.debug(`Creating user via repository: ${createUserDto.email}`);
    const user = await this.userRepository.create(createUserDto);

    this.logger.log(`User created successfully with ID: ${user.id}`);
    return user.toUserResponseDto();
  }

  /**
   * Validates a user's password
   * @param email The user's email
   * @param plainTextPassword The plain text password to verify
   * @returns boolean indicating if the password is valid
   */
  async validateUserPassword(
    email: string,
    plainTextPassword: string,
  ): Promise<boolean> {
    this.logger.debug(`Validating password for user: ${email}`);

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.debug(`User not found for password validation: ${email}`);
      return false;
    }

    const isValid = await bcrypt.compare(plainTextPassword, user.password);
    this.logger.debug(
      `Password validation result for ${email}: ${isValid ? 'valid' : 'invalid'}`,
    );
    return isValid;
  }

  /**
   * Validates a user's password (legacy method - kept for backward compatibility)
   * @param plainTextPassword The plain text password to verify
   * @param hashedPassword The stored hashed password to compare against
   * @returns boolean indicating if the password is valid
   */
  async validatePassword(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    this.logger.debug('Validating user password (legacy method)');
    const isValid = await bcrypt.compare(plainTextPassword, hashedPassword);
    this.logger.debug(
      `Password validation result: ${isValid ? 'valid' : 'invalid'}`,
    );
    return isValid;
  }

  /**
   * Find a user by email and return as a DTO
   * @param email The email to search for
   * @returns The user response DTO or null if not found
   */
  async findUserByEmail(email: string): Promise<UserResponseDto | null> {
    this.logger.debug(`Finding user by email: ${email}`);

    const user = await this.userRepository.findByEmail(email);

    if (user) {
      this.logger.debug(`User found by email: ${email}`);
      return user.toUserResponseDto();
    } else {
      this.logger.debug(`User not found by email: ${email}`);
      return null;
    }
  }

  /**
   * Find a user by id and return as a DTO
   * @param id The id to search for
   * @returns The user response DTO or null if not found
   */
  async findUserById(id: string): Promise<UserResponseDto | null> {
    this.logger.debug(`Finding user by ID: ${id}`);

    const user = await this.userRepository.findById(id);

    if (user) {
      this.logger.debug(`User found by ID: ${id}`);
      return user.toUserResponseDto();
    } else {
      this.logger.debug(`User not found by ID: ${id}`);
      return null;
    }
  }
}
