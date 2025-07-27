/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ObjectId } from 'mongodb';
import { UserResponseDto } from '../dto/responses/user-response.dto';
import { LoginResponseDto } from '../dto/responses/login-response.dto';

/**
 * User entity representing a user in the system
 */
export class User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;

  constructor(params: {
    id?: string;
    email: string;
    password: string;
    createdAt: Date;
  }) {
    this.id = params.id || new ObjectId().toString();
    this.email = params.email;
    this.password = params.password;
    this.createdAt = params.createdAt;
  }

  /**
   * Creates a User entity from a MongoDB document
   * @param doc MongoDB document from the database
   * @returns User entity or null if document is null
   */
  public static fromDocument(doc: any): User | null {
    if (!doc) return null;

    return new User({
      id: doc._id instanceof ObjectId ? doc._id.toString() : doc._id,
      email: doc.email,
      password: doc.password,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
    });
  }

  /**
   * Converts the user entity to a UserResponseDto
   * @returns User response DTO
   */
  toUserResponseDto(): UserResponseDto {
    return new UserResponseDto({
      id: this.id,
      email: this.email,
      createdAt: this.createdAt,
    });
  }

  /**
   * Creates a LoginResponseDto with session data
   * @param sessionData Session information from IAM service
   * @returns Login response DTO
   */
  toLoginResponseDto(sessionData: {
    token: string;
    id: string;
    createdAt: string;
    expiresAt: string;
  }): LoginResponseDto {
    return new LoginResponseDto(
      sessionData.token,
      sessionData.id,
      this.id,
      this.email,
      sessionData.expiresAt,
      sessionData.createdAt,
    );
  }
}
