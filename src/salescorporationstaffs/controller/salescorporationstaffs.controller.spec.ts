import { Test, TestingModule } from '@nestjs/testing';
import { SalesCorporationstaffsController } from './salescorporationstaffs.controller';

describe('SalesCorporationstaffsController', () => {
  let controller: SalesCorporationstaffsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesCorporationstaffsController],
    }).compile();

    controller = module.get<SalesCorporationstaffsController>(SalesCorporationstaffsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
