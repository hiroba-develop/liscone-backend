import { Test, TestingModule } from '@nestjs/testing';
import { CorporationsController } from './corporations.controller';

describe('CorporationsController', () => {
  let controller: CorporationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporationsController],
    }).compile();

    controller = module.get<CorporationsController>(CorporationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
