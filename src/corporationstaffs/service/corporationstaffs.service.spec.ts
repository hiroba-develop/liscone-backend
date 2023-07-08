import { Test, TestingModule } from '@nestjs/testing';
import { CorporationstaffsService } from './corporationstaffs.service';

describe('CorporationtaffsService', () => {
  let service: CorporationstaffsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CorporationstaffsService],
    }).compile();

    service = module.get<CorporationstaffsService>(CorporationstaffsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
