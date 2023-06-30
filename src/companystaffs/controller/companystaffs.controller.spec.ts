import { Test, TestingModule } from '@nestjs/testing';
import { CompanystaffsController } from './companystaffs.controller';

describe('companystaffsController', () => {
  let controller: CompanystaffsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanystaffsController],
    }).compile();

    controller = module.get<CompanystaffsController>(CompanystaffsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
