import { Inject, Injectable, Logger } from '@nestjs/common';
import { Collection, ObjectId } from 'mongodb';
import { SESSION_COLLECTION } from 'libs/mongo-client/src/lib/constants';
import { SessionRepository } from '../interfaces/session.interface';
import { CreateSessionDto } from '../dto/requests/create-session.dto';
import { Session } from '../entities/session.entity';

@Injectable()
export class MongoSessionRepository implements SessionRepository {
  private readonly logger = new Logger(MongoSessionRepository.name);

  constructor(
    @Inject(SESSION_COLLECTION)
    private readonly sessionCollection: Collection,
  ) {}

  /**
   * Find a session by ID
   */
  async findById(sessionId: string): Promise<Session | null> {
    this.logger.debug(`Finding session by ID: ${sessionId}`);

    const session = await this.sessionCollection.findOne({
      _id: new ObjectId(sessionId),
    });

    if (session) {
      this.logger.debug(`Session found: ${sessionId}`);
    } else {
      this.logger.debug(`Session not found: ${sessionId}`);
    }

    return Session.fromDocument(session);
  }

  /**
   * Find a session by token
   */
  async findByToken(token: string, userId: string): Promise<Session | null> {
    this.logger.debug(`Finding session by token for user: ${userId}`);

    const session = await this.sessionCollection.findOne({
      token,
      userId,
    });

    if (session) {
      this.logger.debug(`Session found by token for user: ${userId}`);
    } else {
      this.logger.debug(`Session not found by token for user: ${userId}`);
    }

    return Session.fromDocument(session);
  }

  /**
   * Create a new session from a validated DTO
   * @param createSessionDto The validated session creation DTO
   * @param token The JWT token to store with the session
   * @returns The created session entity
   */
  async create(
    createSessionDto: CreateSessionDto,
    token: string,
  ): Promise<Session> {
    const { userId, ttlMinutes = 60 } = createSessionDto;
    this.logger.debug(
      `Creating session from DTO for user: ${userId} with TTL: ${ttlMinutes} minutes`,
    );

    // Calculate expiration time
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
    this.logger.debug(`Session will expire at: ${expiresAt.toISOString()}`);

    this.logger.debug(`Creating session for user: ${userId}`);
    const _id = new ObjectId();

    const result = await this.sessionCollection.insertOne({
      _id,
      userId,
      token,
      createdAt: now,
      expiresAt,
    });

    this.logger.debug(
      `Session created with ID: ${result.insertedId.toString()}`,
    );

    return new Session({
      id: _id.toString(),
      userId,
      token,
      createdAt: now,
      expiresAt,
    });
  }
}
