# Email Client Library

A lightweight email client for NestJS applications based on nodemailer.

## Installation

This library is part of the monorepo and doesn't need separate installation.

## Configuration

Configure the email client using environment variables:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=user@example.com
EMAIL_PASSWORD=yourpassword
```

## Usage

### Import the Module

```typescript
// In your application module
import { Module } from '@nestjs/common';
import { EmailClientModule } from '@libs/email-client';

@Module({
  imports: [
    EmailClientModule,
    // ... other imports
  ],
})
export class AppModule {}
```

### Use the Email Client

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { EMAIL_CLIENT, SendEmailOptions } from '@libs/email-client';

@Injectable()
export class YourService {
  constructor(
    @Inject(EMAIL_CLIENT) private readonly emailClient
  ) {}

  async sendNotification(userEmail: string) {
    const emailOptions = {
      to: userEmail,
      from: 'notifications@your-company.com',
      subject: 'Important Notification',
      html: '<h1>Hello</h1><p>This is an important notification.</p>',
    };

    return this.emailClient.sendEmail(emailOptions);
  }
}
```
