import { CreatePhishingDto } from '../dto/requests/create-phishing.dto';
import { Phishing, PhishingStatus } from '../entities/phishing.entity';

export interface PhishingRepository {
  /**
   * Find a phishing attempt by ID
   */
  findById(phishingId: string): Promise<Phishing | null>;

  /**
   * Find phishing attempts by user ID
   */
  findByUserId(userId: string): Promise<Phishing[]>;

  /**
   * Find phishing attempts by email
   */
  findByEmail(email: string): Promise<Phishing[]>;

  /**
   * Find phishing attempts by status
   */
  findByStatus(status: PhishingStatus): Promise<Phishing[]>;

  /**
   * Get all phishing attempts
   */
  findAll(): Promise<Phishing[]>;

  /**
   * Create a new phishing attempt from a validated DTO
   */
  createFromDto(
    createPhishingDto: CreatePhishingDto,
    token: string,
  ): Promise<Phishing>;

  /**
   * Update an existing phishing attempt
   */
  update(
    phishingId: string,
    updateData: Partial<Phishing>,
  ): Promise<Phishing | null>;

  /**
   * Update the status of a phishing attempt
   */
  updateStatus(
    phishingId: string,
    status: PhishingStatus,
  ): Promise<Phishing | null>;
}
