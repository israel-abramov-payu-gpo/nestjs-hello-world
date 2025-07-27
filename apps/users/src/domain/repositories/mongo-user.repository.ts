/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Collection, ObjectId } from 'mongodb';
import { USER_COLLECTION } from 'libs/mongo-client/src/lib/constants';
import { UserRepository } from '../interfaces/user-repository.interface';
import { CreateUserDto } from '../dto/requests/create-user.dto';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MongoUserRepository implements UserRepository {
  private readonly logger = new Logger(MongoUserRepository.name);

  constructor(
    @Inject(USER_COLLECTION)
    private readonly userCollection: Collection,
  ) {}

  /**
   * Find a user by ID
   */
  async findById(userId: string): Promise<User | null> {
    this.logger.debug(`Finding user by ID: ${userId}`);

    try {
      const userDoc = await this.userCollection.findOne({
        _id: new ObjectId(userId),
      });

      if (userDoc) {
        this.logger.debug(`User found by ID: ${userId}`);
      } else {
        this.logger.debug(`User not found by ID: ${userId}`);
      }

      return User.fromDocument(userDoc);
    } catch (error) {
      if (error.name === 'BSONError' || error.name === 'BSONTypeError') {
        this.logger.warn(`Invalid ObjectId format for user ID: ${userId}`);
        return null;
      }
      this.logger.error(
        `Error finding user by ID ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);

    const userDoc = await this.userCollection.findOne({ email });

    if (userDoc) {
      this.logger.debug(`User found by email: ${email}`);
    } else {
      this.logger.debug(`User not found by email: ${email}`);
    }

    return User.fromDocument(userDoc);
  }

  /**
   * Create a new user from a validated DTO
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug(
      `Creating user from DTO with email: ${createUserDto.email}`,
    );

    // Hash the password
    this.logger.debug('Hashing password');
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    this.logger.debug(`Creating user with email: ${createUserDto.email}`);

    const _id = new ObjectId();

    const result = await this.userCollection.insertOne({
      _id,
      email: createUserDto.email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    this.logger.debug(`User created with ID: ${result.insertedId.toString()}`);

    return new User({
      email: createUserDto.email,
      password: hashedPassword,
      createdAt: new Date(),
    });
  }

  /**
   * Update an existing user
   */
  async update(
    userId: string,
    updateData: Partial<User>,
  ): Promise<User | null> {
    this.logger.debug(`Updating user with ID: ${userId}`);

    try {
      const { id, ...dataToUpdate } = updateData;

      const result = await this.userCollection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: dataToUpdate },
        { returnDocument: 'after' },
      );

      if (result && result.value) {
        this.logger.debug(`User updated successfully: ${userId}`);
        return User.fromDocument(result.value);
      } else {
        this.logger.debug(`User not found for update: ${userId}`);
        return null;
      }
    } catch (error) {
      if (error.name === 'BSONError' || error.name === 'BSONTypeError') {
        this.logger.warn(`Invalid ObjectId format for user ID: ${userId}`);
        return null;
      }
      this.logger.error(
        `Error updating user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
