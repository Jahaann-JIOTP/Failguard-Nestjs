import { Test, TestingModule } from '@nestjs/testing';
import { NavyDataService } from './navy-data.service';

describe('NavyDataService', () => {
  let service: NavyDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NavyDataService],
    }).compile();

    service = module.get<NavyDataService>(NavyDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
