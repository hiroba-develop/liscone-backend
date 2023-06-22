import { Test, TestingModule } from '@nestjs/testing';
import { SalestasksService } from './salestasks.service';

describe('SalestasksService', () => {
  let service: SalestasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalestasksService],
    }).compile();

    service = module.get<SalestasksService>(SalestasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
