// Import the Session entity and DTOs
import { Session } from '../entities/session.entity';
import { CreateSessionDto } from '../dto/requests/create-session.dto';

/**
 * Payload for JWT token
 */
export interface JwtPayload {
  userId: string;
  sessionId: string;
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

/**
 * Repository interface for Session operations
 */
export interface SessionRepository {
  /**
   * Find a session by ID
   */
  findById(sessionId: string): Promise<Session | null>;

  /**
   * Find a session by token
   */
  findByToken(token: string, userId: string): Promise<Session | null>;

  /**
   * Create a new session from a validated DTO
   * @param createSessionDto The validated session creation DTO
   * @param token The JWT token to store with the session
   * @returns The created session entity
   */
  create(createSessionDto: CreateSessionDto, token: string): Promise<Session>;
}
