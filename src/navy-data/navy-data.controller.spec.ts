import { Test, TestingModule } from '@nestjs/testing';
import { NavyDataController } from './navy-data.controller';
import { NavyDataService } from './navy-data.service';

describe('NavyDataController', () => {
  let controller: NavyDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NavyDataController],
      providers: [NavyDataService],
    }).compile();

    controller = module.get<NavyDataController>(NavyDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
