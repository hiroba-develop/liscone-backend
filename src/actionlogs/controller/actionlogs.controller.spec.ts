import { Test, TestingModule } from '@nestjs/testing';
import { ActionlogsController } from './actionlogs.controller';

describe('actionlogsController', () => {
  let controller: ActionlogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionlogsController],
    }).compile();

    controller = module.get<ActionlogsController>(ActionlogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
