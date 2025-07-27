import { Module, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongoClientModule } from 'libs/mongo-client/src/lib/mongo-client.module';
import { MongoUserRepository } from './domain/repositories/mongo-user.repository';
import { USER_REPOSITORY } from './domain/interfaces/constants';

@Module({
  imports: [MongoClientModule, HttpModule],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: MongoUserRepository,
    },
    UsersService,
    Logger,
  ],
})
export class UsersModule {}
