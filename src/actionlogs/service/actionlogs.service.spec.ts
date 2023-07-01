import { Test, TestingModule } from '@nestjs/testing';
import { ActionlogsService } from './actionlogs.service';

describe('ActionlogsService', () => {
  let service: ActionlogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActionlogsService],
    }).compile();

    service = module.get<ActionlogsService>(ActionlogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
