import { Test, TestingModule } from '@nestjs/testing';
import { SaleslistsService } from './saleslists.service';

describe('SaleslistsService', () => {
  let service: SaleslistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaleslistsService],
    }).compile();

    service = module.get<SaleslistsService>(SaleslistsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
