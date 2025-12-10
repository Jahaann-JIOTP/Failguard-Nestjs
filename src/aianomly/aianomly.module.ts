import { Module } from '@nestjs/common';
import { AianomlyService } from './aianomly.service';
import { AianomlyController } from './aianomly.controller';

@Module({
  controllers: [AianomlyController],
  providers: [AianomlyService],
})
export class AianomlyModule {}
