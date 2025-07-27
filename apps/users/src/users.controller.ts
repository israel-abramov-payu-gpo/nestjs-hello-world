import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Param,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './domain/dto/requests/create-user.dto';
import { LoginDto } from './domain/dto/requests/login.dto';
import { UserResponseDto } from './domain/dto/responses/user-response.dto';
import { LoginResponseDto } from './domain/dto/responses/login-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get user by email' })
  @ApiParam({
    name: 'email',
    description: 'Email of the user to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user information by email',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Get('getByEmail/:email')
  async getUserByEmail(
    @Param('email') email: string,
  ): Promise<UserResponseDto> {
    this.logger.log(`Getting user by email: ${email}`);

    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      this.logger.warn(`User not found with email: ${email}`);
      throw new NotFoundException(`User with email ${email} not found`);
    }

    this.logger.log(`User found successfully by email: ${email}`);
    return user;
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    description: 'Returns user information by id',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    this.logger.log(`Getting user by ID: ${id}`);

    const user = await this.usersService.findUserById(id);
    if (!user) {
      this.logger.warn(`User not found with ID: ${id}`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.logger.log(`User found successfully by ID: ${id}`);
    return user;
  }

  @ApiOperation({ summary: 'User login - authenticate and get session token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful - returns session token',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or session creation failed',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for user: ${loginDto.email}`);

    const result = await this.usersService.login(loginDto);

    this.logger.log(`Login successful for user: ${loginDto.email}`);
    return result;
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({
    description: 'User successfully created',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user already exists',
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Creating new user with email: ${createUserDto.email}`);

    const result = await this.usersService.createUser(createUserDto);

    this.logger.log(
      `User created successfully with email: ${createUserDto.email}`,
    );
    return result;
  }
}
