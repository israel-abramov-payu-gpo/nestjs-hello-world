/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Collection, ObjectId } from 'mongodb';
import { PHISHING_COLLECTION } from 'libs/mongo-client/src/lib/constants';
import { PhishingRepository } from '../interfaces/phishing-repository.interface';
import { CreatePhishingDto } from '../dto/requests/create-phishing.dto';
import { Phishing, PhishingStatus } from '../entities/phishing.entity';

@Injectable()
export class MongoPhishingRepository implements PhishingRepository {
  private readonly logger = new Logger(MongoPhishingRepository.name);

  constructor(
    @Inject(PHISHING_COLLECTION)
    private readonly phishingCollection: Collection,
  ) {}

  /**
   * Find a phishing attempt by ID
   */
  async findById(phishingId: string): Promise<Phishing | null> {
    this.logger.debug(`Finding phishing attempt by ID: ${phishingId}`);

    try {
      const phishingDoc = await this.phishingCollection.findOne({
        _id: new ObjectId(phishingId),
      });

      if (phishingDoc) {
        this.logger.debug(`Phishing attempt found by ID: ${phishingId}`);
      } else {
        this.logger.debug(`Phishing attempt not found by ID: ${phishingId}`);
      }

      return Phishing.fromDocument(phishingDoc);
    } catch (error) {
      if (error.name === 'BSONError' || error.name === 'BSONTypeError') {
        this.logger.warn(
          `Invalid ObjectId format for phishing ID: ${phishingId}`,
        );
        return null;
      }
      this.logger.error(
        `Error finding phishing attempt by ID ${phishingId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find phishing attempts by user ID
   */
  async findByUserId(userId: string): Promise<Phishing[]> {
    this.logger.debug(`Finding phishing attempts by user ID: ${userId}`);

    const phishingDocs = await this.phishingCollection
      .find({ userId })
      .toArray();

    this.logger.debug(
      `Found ${phishingDocs.length} phishing attempts for user ID: ${userId}`,
    );

    return phishingDocs
      .map((doc) => Phishing.fromDocument(doc))
      .filter((phishing): phishing is Phishing => phishing !== null);
  }

  /**
   * Find phishing attempts by email
   */
  async findByEmail(email: string): Promise<Phishing[]> {
    this.logger.debug(`Finding phishing attempts by email: ${email}`);

    const phishingDocs = await this.phishingCollection
      .find({ email })
      .toArray();

    this.logger.debug(
      `Found ${phishingDocs.length} phishing attempts for email: ${email}`,
    );

    return phishingDocs
      .map((doc) => Phishing.fromDocument(doc))
      .filter((phishing): phishing is Phishing => phishing !== null);
  }

  /**
   * Find phishing attempts by status
   */
  async findByStatus(status: PhishingStatus): Promise<Phishing[]> {
    this.logger.debug(`Finding phishing attempts by status: ${status}`);

    const phishingDocs = await this.phishingCollection
      .find({ status })
      .toArray();

    this.logger.debug(
      `Found ${phishingDocs.length} phishing attempts with status: ${status}`,
    );

    return phishingDocs
      .map((doc) => Phishing.fromDocument(doc))
      .filter((phishing): phishing is Phishing => phishing !== null);
  }

  /**
   * Get all phishing attempts
   */
  async findAll(): Promise<Phishing[]> {
    this.logger.debug('Finding all phishing attempts');

    const phishingDocs = await this.phishingCollection.find({}).toArray();

    this.logger.debug(`Found ${phishingDocs.length} total phishing attempts`);

    return phishingDocs
      .map((doc) => Phishing.fromDocument(doc))
      .filter((phishing): phishing is Phishing => phishing !== null);
  }

  /**
   * Create a new phishing attempt
   */
  async create(phishing: Phishing): Promise<Phishing> {
    this.logger.debug(`Creating phishing attempt for user: ${phishing.userId}`);

    const { id, ...phishingData } = phishing;
    const _id = id ? new ObjectId(id) : new ObjectId();

    const result = await this.phishingCollection.insertOne({
      _id,
      ...phishingData,
    });

    this.logger.debug(
      `Phishing attempt created with ID: ${result.insertedId.toString()}`,
    );

    // Return the phishing attempt with the new ID from the database
    return new Phishing({
      id: result.insertedId.toString(),
      userId: phishing.userId,
      email: phishing.email,
      targetName: phishing.targetName,
      token: phishing.token,
      status: phishing.status,
      createdAt: phishing.createdAt,
      updatedAt: phishing.updatedAt,
    });
  }

  /**
   * Create a new phishing attempt from a validated DTO
   */
  async createFromDto(
    createPhishingDto: CreatePhishingDto,
    token: string,
  ): Promise<Phishing> {
    this.logger.debug(
      `Creating phishing attempt for user: ${createPhishingDto.userId}`,
    );

    const _id = new ObjectId();

    const partialPhishing = {
      userId: createPhishingDto.userId,
      email: createPhishingDto.email,
      targetName: createPhishingDto.targetName,
      token,
      status: PhishingStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.phishingCollection.insertOne({
      _id,
      ...partialPhishing,
    });

    this.logger.debug(
      `Phishing attempt created with ID: ${result.insertedId.toString()}`,
    );

    // Return the phishing attempt with the new ID from the database
    return new Phishing({
      id: result.insertedId.toString(),
      ...partialPhishing,
    });
  }

  /**
   * Update an existing phishing attempt
   */
  async update(
    phishingId: string,
    updateData: Partial<Phishing>,
  ): Promise<Phishing | null> {
    this.logger.debug(`Updating phishing attempt with ID: ${phishingId}`);

    try {
      const { id, ...dataToUpdate } = updateData;

      // Add updatedAt timestamp
      const updatePayload = {
        ...dataToUpdate,
        updatedAt: new Date(),
      };

      const result = await this.phishingCollection.findOneAndUpdate(
        { _id: new ObjectId(phishingId) },
        { $set: updatePayload },
        { returnDocument: 'after' },
      );

      if (result && result.value) {
        this.logger.debug(
          `Phishing attempt updated successfully: ${phishingId}`,
        );
        return Phishing.fromDocument(result.value);
      } else {
        this.logger.debug(
          `Phishing attempt not found for update: ${phishingId}`,
        );
        return null;
      }
    } catch (error) {
      if (error.name === 'BSONError' || error.name === 'BSONTypeError') {
        this.logger.warn(
          `Invalid ObjectId format for phishing ID: ${phishingId}`,
        );
        return null;
      }
      this.logger.error(
        `Error updating phishing attempt ${phishingId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update the status of a phishing attempt
   */
  async updateStatus(
    phishingId: string,
    status: PhishingStatus,
  ): Promise<Phishing | null> {
    this.logger.debug(
      `Updating phishing attempt status to ${status} for ID: ${phishingId}`,
    );

    return this.update(phishingId, { status });
  }
}
