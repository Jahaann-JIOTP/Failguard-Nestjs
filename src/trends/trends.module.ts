import { Module } from '@nestjs/common';
import { TrendsService } from './trends.service';
import { TrendsController } from './trends.controller';
import { FormulasService } from './formulas.service';
import { PrewarmService } from './prewarm.service';
// import { PrewarmService } from './prewarm.service';

@Module({
  controllers: [TrendsController],
  providers: [TrendsService, PrewarmService, FormulasService],
})
export class TrendsModule {}
