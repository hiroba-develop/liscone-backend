import { Test, TestingModule } from '@nestjs/testing';
import { MembercompanyproductsController } from './membercompanyproducts.controller';

describe('membercompanyproductsController', () => {
  let controller: MembercompanyproductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembercompanyproductsController],
    }).compile();

    controller = module.get<MembercompanyproductsController>(MembercompanyproductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
