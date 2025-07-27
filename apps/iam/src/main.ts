/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { IamModule } from './iam.module';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

// Create a logger instance
const logger = new Logger('Bootstrap');

// Load environment variables from .env.local if it exists, otherwise use .env
const localEnvPath = resolve(__dirname, '../../../../.env.local');
const defaultEnvPath = resolve(__dirname, '../../../../.env');
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : defaultEnvPath;

logger.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath, override: true });

async function bootstrap() {
  // Create app with logging enabled
  const app = await NestFactory.create(IamModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable class serialization globally (for response DTOs)
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector')),
  );

  // Allow class-validator to use NestJS dependency injection
  useContainer(app.select(IamModule), { fallbackOnErrors: true });

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('IAM Service API')
    .setDescription(
      'API documentation for Identity and Access Management service',
    )
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Inside a Docker container, always listen on CONTAINER_PORT (3000)
  // Docker handles the external port mapping
  const port = process.env.CONTAINER_PORT!;
  await app.listen(port, '0.0.0.0');
  logger.log(`IAM service is running on port ${port}`);
  logger.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
