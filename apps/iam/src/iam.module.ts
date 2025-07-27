import { Module, Logger } from '@nestjs/common';
import { IamController } from './iam.controller';
import { IamService } from './iam.service';
import { MongoClientModule } from 'libs/mongo-client/src/lib/mongo-client.module';
import { HttpModule } from '@nestjs/axios';
import { MongoSessionRepository } from './domain/repositories/mongo-session.repository';
import { SESSION_REPOSITORY } from './domain/interfaces/constants';

@Module({
  imports: [
    MongoClientModule,
    HttpModule.register({
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  ],
  controllers: [IamController],
  providers: [
    {
      provide: SESSION_REPOSITORY,
      useClass: MongoSessionRepository,
    },
    IamService,
    Logger,
  ],
})
export class IamModule {}
