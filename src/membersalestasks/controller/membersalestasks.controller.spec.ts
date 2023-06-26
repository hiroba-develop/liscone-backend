import { Test, TestingModule } from '@nestjs/testing';
import { MemberSalestasksController } from './membersalestasks.controller';

describe('membersalestasksController', () => {
  let controller: MemberSalestasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberSalestasksController],
    }).compile();

    controller = module.get<MemberSalestasksController>(MemberSalestasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
