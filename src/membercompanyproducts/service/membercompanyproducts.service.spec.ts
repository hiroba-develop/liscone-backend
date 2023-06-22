import { Test, TestingModule } from '@nestjs/testing';
import { MembercompanyproductsService } from './membercompanyproducts.service';

describe('MembercompanyproductsService', () => {
  let service: MembercompanyproductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembercompanyproductsService],
    }).compile();

    service = module.get<MembercompanyproductsService>(MembercompanyproductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
