/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ObjectId } from 'mongodb';
import { SessionResponseDto } from '../dto/responses/session-response.dto';
import { VerifySessionResponseDto } from '../dto/responses/verify-session-response.dto';
import { SessionErrorCode } from '../interfaces/error-codes.interface';

/**
 * Session entity representing a user authentication session
 */
export class Session {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;

  constructor(params: {
    id?: string;
    userId: string;
    token: string;
    createdAt: Date;
    expiresAt: Date;
  }) {
    this.id = params.id || new ObjectId().toString();
    this.userId = params.userId;
    this.token = params.token;
    this.createdAt = params.createdAt;
    this.expiresAt = params.expiresAt;
  }

  /**
   * Creates a Session entity from a MongoDB document
   * @param doc MongoDB document from the database
   * @returns Session entity or null if document is null
   */
  public static fromDocument(doc: any): Session | null {
    if (!doc) return null;

    return new Session({
      id: doc._id instanceof ObjectId ? doc._id.toString() : doc._id,
      userId: doc.userId,
      token: doc.token,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      expiresAt:
        doc.expiresAt instanceof Date ? doc.expiresAt : new Date(doc.expiresAt),
    });
  }

  /**
   * Convert this session entity to a VerifySessionResponseDto
   * @param options Additional options for verification
   * @returns VerifySessionResponseDto
   */
  toVerifySessionResponseDto(
    options: {
      valid?: boolean;
      message?: string;
      errorCode?: SessionErrorCode;
    } = {},
  ): VerifySessionResponseDto {
    const isValid =
      options.valid !== undefined ? options.valid : !this.isExpired();

    return new VerifySessionResponseDto({
      valid: isValid,
      userId: isValid ? this.userId : undefined,
      message: !isValid ? options.message : undefined,
      errorCode: !isValid ? options.errorCode : undefined,
    });
  }

  /**
   * Check if the session is expired
   */
  isExpired(): boolean {
    const now = new Date();
    return now > this.expiresAt;
  }

  /**
   * Converts the session entity to a SessionResponseDto
   * @param withBearerPrefix Whether to add 'Bearer ' prefix to token
   * @returns Session response DTO
   */
  toSessionResponseDto(withBearerPrefix = true): SessionResponseDto {
    return new SessionResponseDto({
      id: this.id,
      userId: this.userId,
      token: withBearerPrefix ? `Bearer ${this.token}` : this.token,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
    });
  }
}
