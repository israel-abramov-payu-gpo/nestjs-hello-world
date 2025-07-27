/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { PhishingModule } from './phishing.module';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { useContainer } from 'class-validator';

// Create a logger instance
const logger = new Logger('Bootstrap');

// Load environment variables from .env.local if it exists, otherwise use .env
const localEnvPath = resolve(__dirname, '../../../../.env.local');
const defaultEnvPath = resolve(__dirname, '../../../../.env');
const envPath = fs.existsSync(localEnvPath) ? localEnvPath : defaultEnvPath;

logger.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath, override: true });

// Debug environment variables
logger.log(`MONGO_URI: ${process.env.MONGO_URI}`);
logger.log(`MONGO_DB_NAME: ${process.env.MONGO_DB_NAME}`);
logger.log(`PHISHING_COLLECTION: ${process.env.PHISHING_COLLECTION}`);

async function bootstrap() {
  logger.log('Starting Phishing service...');

  // Create app with logging enabled
  const app = await NestFactory.create(PhishingModule, {
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
  useContainer(app.select(PhishingModule), { fallbackOnErrors: true });

  // Enable CORS
  app.enableCors();

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Phishing Service API')
    .setDescription('API documentation for Phishing Simulation service')
    .setVersion('1.0')
    .addTag('phishing', 'Phishing simulation operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.CONTAINER_PORT!;
  await app.listen(port, '0.0.0.0');
  logger.log(`Phishing service is running on port ${port}`);
  logger.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
