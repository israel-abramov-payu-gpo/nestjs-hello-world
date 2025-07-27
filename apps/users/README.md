# Users Service

The Users service is responsible for user management in the phishing simulation platform. It provides APIs for creating users, retrieving user information, and validating user credentials across the system.

## Service Overview

The Users service is built using NestJS and follows Domain-Driven Design (DDD) principles. It provides the following key functionalities:

- **User Creation**: Register new users with email and password
- **User Retrieval**: Get user information by ID or email
- **Password Validation**: Validate user passwords for authentication
- **User Management**: Complete CRUD operations for user entities

## Directory Structure

```
/src
  /domain             # Domain layer - core business logic and entities
    /dto              # Data Transfer Objects for API communication
      /requests       # Request DTOs (input)
        - create-user.dto.ts
      /responses      # Response DTOs (output)
        - user-response.dto.ts
    /entities         # Domain entities that encapsulate business rules
      - user.entity.ts
    /interfaces       # Domain interfaces, constants, error codes
      - user-repository.interface.ts
      - constants.ts
    /repositories     # Repository implementations
      - mongo-user.repository.ts
    /mappers          # Data transformation utilities
      - user.mapper.ts
  
  - users.controller.ts # REST API endpoints
  - users.module.ts     # NestJS module configuration
  - users.service.ts    # Service orchestration layer
  - main.ts            # Application entry point
```

## Architecture

The service follows a layered architecture based on Domain-Driven Design:

1. **Domain Layer**: Contains the core business logic in the form of entities (like User), repository interfaces, and domain-specific types and constants.

2. **Application Layer**: The service layer that coordinates domain objects to implement use cases.

3. **Infrastructure Layer**: Contains technical implementations of domain interfaces, primarily the MongoDB repository.

4. **Interface Layer**: REST API endpoints exposed through the controller.

## Dependencies

The Users service depends on:

- **MongoDB**: For storing user data
- **bcrypt**: For password hashing and validation
- **IAM Service**: For creating session tokens during login
- **@nestjs/axios**: For HTTP communication with other services

## Configuration

The service is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| CONTAINER_PORT | Service port | 3002 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017 |
| MONGODB_DB | MongoDB database name | phishing-platform |
| IAM_SERVICE_URL | IAM service URL for session creation | http://localhost:3003 |
| NODE_ENV | Environment mode | development |

## API Endpoints

### Create User
- **POST** `/users`
- Creates a new user with email and password
- Password is automatically hashed using bcrypt
- Returns user information (excluding password)

### User Login
- **POST** `/users/login`
- Authenticates user with email and password
- Creates a JWT session token via IAM service
- Returns session token with expiration details
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123"
  }
  ```
- **Response:**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "sessionId": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "email": "user@example.com",
    "expiresAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T09:30:00.000Z"
  }
  ```

### Get User by ID
- **GET** `/users/:id`
- Retrieves user information by user ID
- Returns 404 if user not found

### Get User by Email
- **GET** `/users/getByEmail/:email`
- Retrieves user information by email address
- Returns 404 if user not found

## Running the Service

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start MongoDB:
   ```bash
   npm run docker:up
   ```

3. Run the service:
   ```bash
   npm run start:users
   ```

The service will be available at http://localhost:3002

### Using Docker

```bash
# Build the Docker image
docker build -f apps/users/Dockerfile -t phishing-platform/users .

# Run the container
docker run -p 3002:3002 \
  -e MONGODB_URI=mongodb://mongo:27017 \
  -e MONGODB_DB=phishing-platform \
  phishing-platform/users
```

### Using Docker Compose

```bash
# Start all services including Users
docker-compose up users
```

## API Documentation

When running the service, Swagger API documentation is available at:
- http://localhost:3002/api/docs

## Data Models

### User Entity

```typescript
{
  id: string;           // Unique user identifier
  email: string;        // User email address (unique)
  password: string;     // Hashed password
  createdAt: Date;      // Account creation timestamp
}
```

### User Response DTO

```typescript
{
  id: string;           // Unique user identifier
  email: string;        // User email address
  createdAt: Date;      // Account creation timestamp
  // Note: password is never exposed in responses
}
```

### Login Request DTO

```typescript
{
  email: string;        // User email address
  password: string;     // Plain text password (minimum 6 characters)
}
```

### Login Response DTO

```typescript
{
  token: string;        // JWT session token
  sessionId: string;    // Session identifier
  userId: string;       // User identifier
  email: string;        // User email address
  expiresAt: string;    // Token expiration timestamp
  createdAt: string;    // Session creation timestamp
}
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt with salt factor of 10
- **Input Validation**: All inputs are validated using class-validator decorators
- **Email Uniqueness**: Prevents duplicate user registration with same email
- **Password Security**: Enforces minimum password length requirements

## Error Handling

The service provides detailed error responses:

- **400 Bad Request**: Invalid input data, missing required fields, or session creation failed
- **401 Unauthorized**: Invalid login credentials (wrong email or password)
- **404 Not Found**: User not found by ID or email
- **409 Conflict**: User already exists with provided email

## Logging

The service includes comprehensive logging at multiple levels:

- **Info logs**: Important operations like user creation and retrieval
- **Debug logs**: Detailed operation tracking for development
- **Warn logs**: Potential issues like invalid IDs or missing users
- **Error logs**: Exceptions and system errors

## Testing

Run tests with:

```bash
# Unit tests
npm run test:users

# End-to-end tests
npm run test:users:e2e

# Test coverage
npm run test:users:cov
```

## Development

### Adding New Features

1. **Domain First**: Add new entities or interfaces in the domain layer
2. **Repository**: Implement data access in the repository layer
3. **Service**: Add business logic in the service layer
4. **Controller**: Expose API endpoints in the controller
5. **Tests**: Add comprehensive tests for new functionality

### Code Style

- Follow NestJS conventions and best practices
- Use TypeScript strict mode
- Implement proper error handling
- Add comprehensive logging
- Follow domain-driven design principles

## Future Enhancements

Planned features for future releases:

- User profile management
- Password reset functionality
- Email verification
- User role and permission system
- Audit logging for user activities
- Soft delete functionality
- User search and filtering
