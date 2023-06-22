import { Test, TestingModule } from '@nestjs/testing';
import { SaleslistsController } from './saleslists.controller';

describe('saleslistsController', () => {
  let controller: SaleslistsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleslistsController],
    }).compile();

    controller = module.get<SaleslistsController>(SaleslistsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
