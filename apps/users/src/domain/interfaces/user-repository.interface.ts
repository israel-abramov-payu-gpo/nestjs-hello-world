import { CreateUserDto } from '../dto/requests/create-user.dto';
import { User } from '../entities/user.entity';

export interface UserRepository {
  /**
   * Find a user by ID
   */
  findById(userId: string): Promise<User | null>;

  /**
   * Find a user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Create a new user from a validated DTO
   */
  create(createUserDto: CreateUserDto): Promise<User>;

  /**
   * Update an existing user
   */
  update(userId: string, updateData: Partial<User>): Promise<User | null>;
}
