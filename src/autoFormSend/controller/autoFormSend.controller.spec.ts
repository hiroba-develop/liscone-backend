import { Test, TestingModule } from '@nestjs/testing';
import { AutoFormSendController } from './autoFormSend.controller';

describe('SalesCorporationstaffsController', () => {
  let controller: AutoFormSendController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoFormSendController],
    }).compile();

    controller = module.get<AutoFormSendController>(AutoFormSendController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
