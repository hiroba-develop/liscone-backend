import { Test, TestingModule } from '@nestjs/testing';
import { CompanystaffsService } from './companystaffs.service';

describe('CompanystaffsService', () => {
  let service: CompanystaffsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanystaffsService],
    }).compile();

    service = module.get<CompanystaffsService>(CompanystaffsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
