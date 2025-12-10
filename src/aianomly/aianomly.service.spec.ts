import { Test, TestingModule } from '@nestjs/testing';
import { AianomlyService } from './aianomly.service';

describe('AianomlyService', () => {
  let service: AianomlyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AianomlyService],
    }).compile();

    service = module.get<AianomlyService>(AianomlyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
