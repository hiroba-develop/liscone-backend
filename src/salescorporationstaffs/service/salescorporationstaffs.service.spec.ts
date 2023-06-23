import { Test, TestingModule } from '@nestjs/testing';
import { SalesCorporationstaffsService } from './salescorporationstaffs.service';

describe('SalesCorporationstaffsService', () => {
  let service: SalesCorporationstaffsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesCorporationstaffsService],
    }).compile();

    service = module.get<SalesCorporationstaffsService>(SalesCorporationstaffsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
