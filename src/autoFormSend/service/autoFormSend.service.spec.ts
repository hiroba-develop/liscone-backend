import { Test, TestingModule } from '@nestjs/testing';
import { AutoFormSendService } from './autoFormSend.service';

describe('AutoFormSendServiceService', () => {
  let service: AutoFormSendService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AutoFormSendService],
    }).compile();

    service = module.get<AutoFormSendService>(AutoFormSendService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
