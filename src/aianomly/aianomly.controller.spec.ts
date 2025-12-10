import { Test, TestingModule } from '@nestjs/testing';
import { AianomlyController } from './aianomly.controller';
import { AianomlyService } from './aianomly.service';

describe('AianomlyController', () => {
  let controller: AianomlyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AianomlyController],
      providers: [AianomlyService],
    }).compile();

    controller = module.get<AianomlyController>(AianomlyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
