/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { UsersModule } from './users.module';
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
  const app = await NestFactory.create(UsersModule, {
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
  useContainer(app.select(UsersModule), { fallbackOnErrors: true });

  // Enable CORS
  app.enableCors();

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Users Service API')
    .setDescription('API documentation for User Management service')
    .setVersion('1.0')
    .addTag('users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  const port = process.env.CONTAINER_PORT!;
  await app.listen(port, '0.0.0.0');
  logger.log(`Users service is running on port ${port}`);
  logger.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
