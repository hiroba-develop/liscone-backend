import { Test, TestingModule } from '@nestjs/testing';
import { MemberSalestasksService } from './membersalestasks.service';

describe('MemberSalestasksService', () => {
  let service: MemberSalestasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemberSalestasksService],
    }).compile();

    service = module.get<MemberSalestasksService>(MemberSalestasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
