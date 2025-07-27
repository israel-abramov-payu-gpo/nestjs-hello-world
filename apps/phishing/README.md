# Phishing Service

The Phishing service is responsible for orchestrating phishing simulation campaigns in the phishing simulation platform. It provides APIs for creating phishing attempts, validating phishing tokens when users click malicious links, and tracking the success of simulated phishing attacks.

## Service Overview

The Phishing service is built using NestJS and follows Domain-Driven Design (DDD) principles. It provides the following key functionalities:

- **Phishing Campaign Creation**: Create and launch targeted phishing attempts
- **Email Generation**: Send realistic phishing emails to target users
- **Token Validation**: Process user interactions with phishing links
- **Status Tracking**: Monitor the success/failure of phishing attempts
- **Campaign Management**: Retrieve and manage phishing attempt data

## Directory Structure

```
/src
  /domain             # Domain layer - core business logic and entities
    /dto              # Data Transfer Objects for API communication
      /requests       # Request DTOs (input)
        - create-phishing.dto.ts
      /responses      # Response DTOs (output)
        - phishing-response.dto.ts
    /entities         # Domain entities that encapsulate business rules
      - phishing.entity.ts
    /interfaces       # Domain interfaces, constants, error codes
      - phishing-repository.interface.ts
      - session-error-codes.interface.ts
      - constants.ts
    /repositories     # Repository implementations
      - mongo-phishing.repository.ts
    /mappers          # Data transformation utilities
      - phishing.mapper.ts
  
  - phishing.controller.ts # REST API endpoints
  - phishing.module.ts     # NestJS module configuration
  - phishing.service.ts    # Service orchestration layer
  - main.ts               # Application entry point
```

## Architecture

The service follows a layered architecture based on Domain-Driven Design:

1. **Domain Layer**: Contains the core business logic in the form of entities (like Phishing), repository interfaces, and domain-specific types and constants.

2. **Application Layer**: The service layer that coordinates domain objects to implement use cases and integrates with external services.

3. **Infrastructure Layer**: Contains technical implementations of domain interfaces, primarily the MongoDB repository and email client integration.

4. **Interface Layer**: REST API endpoints exposed through the controller.

## Dependencies

The Phishing service depends on:

- **MongoDB**: For storing phishing attempt data
- **IAM Service**: For validating user session tokens
- **Email Client**: For sending phishing emails
- **HTTP Client**: For making requests to other services

## Configuration

The service is configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| CONTAINER_PORT | Service port | 3003 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017 |
| MONGODB_DB | MongoDB database name | phishing-platform |
| BASE_URL | Base URL for phishing links | http://localhost:3003 |
| IAM_SERVICE_URL | URL for the IAM service | http://localhost:3001 |
| NODE_ENV | Environment mode | development |

## API Endpoints

### Create Phishing Attempt
- **POST** `/phishing`
- Creates a new phishing attempt and sends a phishing email
- Automatically generates tracking tokens and links
- Returns phishing attempt information

### Validate Phishing Token
- **GET** `/phishing/validate?token={token}&id={phishingId}`
- Validates when a user clicks on a phishing link
- Updates phishing attempt status based on validation result
- Redirects user to a safe page after processing

### Get All Phishing Attempts
- **GET** `/phishing`
- Retrieves all phishing attempts in the system
- Returns comprehensive campaign data and statistics

## Phishing Status Flow

The service tracks phishing attempts through the following statuses:

1. **PENDING**: Initial state when phishing attempt is created
2. **SCAMMED**: User clicked the link and had a valid session
3. **FAILED**: Validation failed (invalid token, user doesn't exist, etc.)
4. **EXPIRED**: Token expired without user interaction

## Running the Service

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start MongoDB and dependent services:
   ```bash
   npm run docker:up
   ```

3. Start IAM and Users services (dependencies):
   ```bash
   npm run start:iam
   npm run start:users
   ```

4. Run the phishing service:
   ```bash
   npm run start:phishing
   ```

The service will be available at http://localhost:3003

### Using Docker

```bash
# Build the Docker image
docker build -f apps/phishing/Dockerfile -t phishing-platform/phishing .

# Run the container
docker run -p 3003:3003 \
  -e MONGODB_URI=mongodb://mongo:27017 \
  -e BASE_URL=http://localhost:3003 \
  -e IAM_SERVICE_URL=http://iam:3001 \
  phishing-platform/phishing
```

### Using Docker Compose

```bash
# Start all services including Phishing
docker-compose up phishing
```

## API Documentation

When running the service, Swagger API documentation is available at:
- http://localhost:3003/api/docs

## Data Models

### Phishing Entity

```typescript
{
  id: string;           // Unique phishing attempt identifier
  userId: string;       // ID of the admin user creating the phishing attempt
  email: string;        // Target email address
  targetName: string;   // Target user name
  token: string;        // JWT token for validation
  status: PhishingStatus; // Current status of the attempt
  createdAt: Date;      // Campaign creation timestamp
  updatedAt?: Date;     // Last update timestamp
}
```

### Phishing Response DTO

```typescript
{
  id: string;
  userId: string;
  email: string;
  targetName: string;
  status: PhishingStatus;
  statusDescription?: string;
  createdAt: Date;
  updatedAt?: Date;
  // Note: token is never exposed in responses for security
}
```

## Security Features

- **Token Validation**: Validates JWT tokens through IAM service
- **Status Tracking**: Comprehensive tracking of user interactions
- **Secure Redirects**: Always redirects to safe pages after processing
- **Input Validation**: All inputs are validated using class-validator decorators
- **Error Handling**: Graceful handling of invalid tokens and expired sessions

## Email Templates

The service generates realistic phishing emails with:

- Professional HTML formatting
- Legitimate-looking sender information
- Compelling call-to-action buttons
- Tracking links with embedded tokens
- Security-themed messaging to encourage clicks

## Integration Points

### IAM Service Integration
- Validates user session tokens
- Determines if phishing attempt succeeded
- Handles various error codes from IAM service

### Email Client Integration
- Sends HTML-formatted phishing emails
- Handles email delivery failures gracefully
- Supports various email templates

## Error Handling

The service provides detailed error responses and logging:

- **400 Bad Request**: Invalid input data or missing required fields
- **404 Not Found**: Phishing attempt not found
- **500 Internal Server Error**: Service communication failures

## Logging

The service includes comprehensive logging at multiple levels:

- **Info logs**: Campaign creation, token validation, user interactions
- **Debug logs**: Detailed operation tracking and service integration
- **Warn logs**: Token mismatches, expired attempts, validation failures
- **Error logs**: Service communication errors and exceptions

## Testing

Run tests with:

```bash
# Unit tests
npm run test:phishing

# End-to-end tests
npm run test:phishing:e2e

# Test coverage
npm run test:phishing:cov
```

## Development

### Adding New Features

1. **Domain First**: Add new entities or interfaces in the domain layer
2. **Repository**: Implement data access in the repository layer
3. **Service**: Add business logic in the service layer
4. **Controller**: Expose API endpoints in the controller
5. **Integration**: Test with dependent services
6. **Tests**: Add comprehensive tests for new functionality

### Email Template Customization

Email templates can be customized by modifying the `sendPhishingEmail` method in the service. Consider:

- Different phishing scenarios (security alerts, password resets, etc.)
- Company-specific branding
- Localization for different languages
- A/B testing different message approaches

### Code Style

- Follow NestJS conventions and best practices
- Use TypeScript strict mode
- Implement proper error handling
- Add comprehensive logging
- Follow domain-driven design principles

## Analytics and Reporting

The service provides data for:

- **Success Rates**: Percentage of users who clicked phishing links
- **Response Times**: How quickly users respond to phishing emails
- **Status Distribution**: Breakdown of PENDING/SCAMMED/FAILED/EXPIRED attempts
- **User Behavior**: Patterns in user susceptibility to phishing

## Security Considerations

- **Token Security**: Tokens are validated through secure IAM service
- **Data Protection**: Sensitive user data is handled securely
- **Audit Trails**: All phishing attempts are logged for compliance
- **Responsible Disclosure**: Service is designed for authorized security testing only

## Future Enhancements

Planned features for future releases:

- **Campaign Templates**: Pre-built phishing scenarios
- **Scheduling**: Time-delayed phishing campaigns
- **A/B Testing**: Multiple email variants per campaign
- **Advanced Analytics**: Detailed reporting dashboard
- **User Training**: Integrate with security awareness training
- **Mobile Targeting**: Phishing campaigns for mobile devices
- **Social Engineering**: Multi-channel attack simulations
