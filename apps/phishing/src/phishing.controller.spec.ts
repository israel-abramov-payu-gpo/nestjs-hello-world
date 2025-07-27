/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { PhishingController } from './phishing.controller';
import { PhishingService } from './phishing.service';

describe('PhishingController', () => {
  let phishingController: PhishingController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PhishingController],
      providers: [PhishingService],
    }).compile();

    phishingController = app.get<PhishingController>(PhishingController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {});
  });
});
