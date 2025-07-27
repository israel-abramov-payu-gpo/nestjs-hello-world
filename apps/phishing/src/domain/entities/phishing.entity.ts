/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ObjectId } from 'mongodb';
import { PhishingResponseDto } from '../dto/responses/phishing-response.dto';

export enum PhishingStatus {
  PENDING = 'PENDING',
  SCAMMED = 'SCAMMED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

/**
 * Phishing entity representing a phishing simulation attempt
 */
export class Phishing {
  id: string;
  userId: string;
  email: string;
  targetName: string;
  token: string;
  status: PhishingStatus;
  createdAt: Date;
  updatedAt?: Date;

  constructor(params: {
    id?: string;
    userId: string;
    email: string;
    targetName: string;
    token: string;
    status: PhishingStatus;
    createdAt: Date;
    updatedAt?: Date;
  }) {
    this.id = params.id || new ObjectId().toString();
    this.userId = params.userId;
    this.email = params.email;
    this.targetName = params.targetName;
    this.token = params.token;
    this.status = params.status;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  /**
   * Creates a Phishing entity from a MongoDB document
   * @param doc MongoDB document from the database
   * @returns Phishing entity or null if document is null
   */
  public static fromDocument(doc: any): Phishing | null {
    if (!doc) return null;

    return new Phishing({
      id: doc._id instanceof ObjectId ? doc._id.toString() : doc._id,
      userId: doc.userId,
      email: doc.email,
      targetName: doc.targetName,
      token: doc.token,
      status: doc.status,
      createdAt:
        doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      updatedAt: doc.updatedAt
        ? doc.updatedAt instanceof Date
          ? doc.updatedAt
          : new Date(doc.updatedAt)
        : undefined,
    });
  }

  /**
   * Check if the phishing attempt is expired
   * This can be extended to include actual expiration logic based on business rules
   */
  isExpired(): boolean {
    // For now, just check if status is EXPIRED
    // This could be enhanced with actual time-based expiration logic
    return this.status === PhishingStatus.EXPIRED;
  }

  /**
   * Check if the phishing attempt is successful (user was scammed)
   */
  isSuccessful(): boolean {
    return this.status === PhishingStatus.SCAMMED;
  }

  /**
   * Update the status of the phishing attempt
   */
  updateStatus(newStatus: PhishingStatus): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * Converts the phishing entity to a PhishingResponseDto
   * @returns Phishing response DTO
   */
  toPhishingResponseDto(): PhishingResponseDto {
    const dto = new PhishingResponseDto();
    dto.id = this.id;
    dto.userId = this.userId;
    dto.email = this.email;
    dto.targetName = this.targetName;
    dto.status = this.status;
    dto.createdAt = this.createdAt;
    dto.updatedAt = this.updatedAt;
    return dto;
  }
}
