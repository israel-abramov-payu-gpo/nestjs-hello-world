/**
 * Response interface for user creation
 */
export interface CreateUserResponse {
  id: string;
  email: string;
}

/**
 * Interface for user data stored in database
 */
export interface User {
  id: string; // MongoDB ID
  email: string;
  password: string;
  createdAt: Date;
}
