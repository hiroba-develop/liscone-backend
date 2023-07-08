import { Test, TestingModule } from '@nestjs/testing';
import { CorporationstaffsController } from './corporationstaffs.controller';

describe('corporationtaffsController', () => {
  let controller: CorporationstaffsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporationstaffsController],
    }).compile();

    controller = module.get<CorporationstaffsController>(
      CorporationstaffsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
