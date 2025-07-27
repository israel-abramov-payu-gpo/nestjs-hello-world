# IAM Service

The Identity and Access Management (IAM) service is responsible for user authentication and session management in the phishing simulation platform. It provides APIs for creating sessions (login), verifying session tokens, and managing authentication across the system.

## Service Overview

The IAM service is built using NestJS and follows Domain-Driven Design (DDD) principles. It provides the following key functionalities:

- **Session Creation**: Create authentication sessions for users
- **Token Verification**: Validate JWT tokens for authenticated requests
- **User Existence Validation**: Ensure users exist before creating sessions

## Directory Structure

```
/src
  /domain             # Domain layer - core business logic and entities
    /dto              # Data Transfer Objects for API communication
      /requests       # Request DTOs (input)
      /responses      # Response DTOs (output)
    /entities         # Domain entities that encapsulate business rules
      - session.ts
    /interfaces       # Domain interfaces, constants, error codes
    /repositories     # Repository implementations
      - mongo-session.repository.ts
  
  - iam.controller.ts # REST API endpoints
  - iam.module.ts     # NestJS module configuration
  - iam.service.ts    # Service orchestration layer
  - main.ts          # Application entry point
```

## Architecture

The service follows a layered architecture based on Domain-Driven Design:

1. **Domain Layer**: Contains the core business logic in the form of entities (like Session), repository interfaces, and domain-specific types and constants.

2. **Application Layer**: The service layer that coordinates domain objects to implement use cases.

3. **Infrastructure Layer**: Contains technical implementations of domain interfaces, primarily the MongoDB repository.

4. **Interface Layer**: REST API endpoints exposed through the controller.

## Dependencies

The IAM service depends on:

- **MongoDB**: For storing session data
- **Users Service**: For validating user existence during session creation

## Configuration

The service is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 3001 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017 |
| MONGODB_DB | MongoDB database name | phishing-platform |
| JWT_SECRET | Secret for signing JWT tokens | (must be provided) |
| USERS_SERVICE_URL | URL for the Users service | http://localhost:3002 |

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
   npm run start:iam
   ```

The service will be available at http://localhost:3001

### Using Docker

```bash
# Build the Docker image
docker build -f apps/iam/Dockerfile -t phishing-platform/iam .

# Run the container
docker run -p 3001:3001 \
  -e MONGODB_URI=mongodb://mongo:27017 \
  -e JWT_SECRET=your_jwt_secret \
  -e USERS_SERVICE_URL=http://users:3002 \
  phishing-platform/iam
```

### Using Docker Compose

The entire platform can be started using Docker Compose:

```bash
docker-compose up -d
```

This will start the IAM service along with its dependencies.

## API Endpoints

### Create Session

```
POST /iam/sessions
```

Creates a new authentication session for a user.

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "ttlMinutes": 60
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "createdAt": "2025-07-26T12:34:56.789Z",
  "expiresAt": "2025-07-26T13:34:56.789Z"
}
```

### Verify Session

```
GET /iam/sessions/verify/:userId
```

Verifies if a session token is valid for a specific user.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success):**
```json
{
  "valid": true,
  "userId": "507f1f77bcf86cd799439011"
}
```

**Response (Failure):**
```json
{
  "valid": false,
  "message": "Session expired",
  "errorCode": "SESSION_EXPIRED"
}
```

## Error Codes

| Error Code | Description |
|------------|-------------|
| INVALID_TOKEN | The provided token is invalid or malformed |
| TOKEN_MISMATCH | The token doesn't match the requested user |
| SESSION_NOT_FOUND | The session was not found or has been revoked |
| SESSION_EXPIRED | The session has expired |
| USER_NOT_FOUND | The user no longer exists |
| UNKNOWN_ERROR | An unexpected error occurred during verification |
