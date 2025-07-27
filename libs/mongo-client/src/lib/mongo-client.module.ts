/* eslint-disable @typescript-eslint/require-await */
import { Module, Global } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';
import {
  MONGO_CLIENT,
  MONGO_DB,
  PHISHING_COLLECTION,
  USER_COLLECTION,
  SESSION_COLLECTION,
} from './constants';

@Global()
@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      useFactory: async () => {
        const uri = process.env.MONGO_URI!;
        console.log(`[MONGO] Attempting to connect to MongoDB at: ${uri}`);
        console.log(
          `[MONGO] Environment check - MONGO_URI exists: ${!!process.env.MONGO_URI}`,
        );

        if (!uri) {
          throw new Error('MONGO_URI environment variable is not set');
        }

        const client = new MongoClient(uri);
        console.log(`[MONGO] MongoClient created, attempting connection...`);
        await client.connect();
        console.log(`[MONGO] Successfully connected to MongoDB`);
        return client;
      },
    },
    {
      provide: MONGO_DB,
      useFactory: async (client: MongoClient): Promise<Db> => {
        const dbName = process.env.MONGO_DB_NAME!;
        return client.db(dbName);
      },
      inject: [MONGO_CLIENT],
    },
    {
      provide: USER_COLLECTION,
      useFactory: (db: Db): Collection =>
        db.collection(process.env.USERS_COLLECTION!),
      inject: [MONGO_DB],
    },
    {
      provide: PHISHING_COLLECTION,
      useFactory: (db: Db): Collection =>
        db.collection(process.env.PHISHING_COLLECTION!),
      inject: [MONGO_DB],
    },
    {
      provide: SESSION_COLLECTION,
      useFactory: (db: Db): Collection =>
        db.collection(process.env.SESSION_COLLECTION!),
      inject: [MONGO_DB],
    },
  ],
  exports: [
    MONGO_CLIENT,
    MONGO_DB,
    USER_COLLECTION,
    PHISHING_COLLECTION,
    SESSION_COLLECTION,
  ],
})
export class MongoClientModule {}
