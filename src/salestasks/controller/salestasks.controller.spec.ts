import { Test, TestingModule } from '@nestjs/testing';
import { SalestasksController } from './salestasks.controller';

describe('salestasksController', () => {
  let controller: SalestasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalestasksController],
    }).compile();

    controller = module.get<SalestasksController>(SalestasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
