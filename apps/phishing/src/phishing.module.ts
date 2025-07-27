import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhishingController } from './phishing.controller';
import { PhishingService } from './phishing.service';
import { EmailClientModule } from 'libs/email-client/src';
import { MongoClientModule } from 'libs/mongo-client/src';
import { HttpModule } from '@nestjs/axios';
import { MongoPhishingRepository } from './domain/repositories/mongo-phishing.repository';
import { PHISHING_REPOSITORY } from './domain/interfaces/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule.register({
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    EmailClientModule,
    MongoClientModule,
  ],
  controllers: [PhishingController],
  providers: [
    {
      provide: PHISHING_REPOSITORY,
      useClass: MongoPhishingRepository,
    },
    PhishingService,
    Logger,
  ],
})
export class PhishingModule {}
