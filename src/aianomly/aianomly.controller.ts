// import { Body, Controller, Post } from '@nestjs/common';
// import { AianomlyService } from './aianomly.service';

// @Controller('anomaly')
// export class AianomlyController {
//   constructor(private readonly service: AianomlyService) {}

//   // -----------------------------
//   // API-1: Get chart points
//   // -----------------------------
//   @Post('chart')
//   getAnomalyChart(@Body() body): Promise<any> {
//     return this.service.getChartData(body);
//   }

//   // -----------------------------
//   // API-2: Get last 100 points for selected features
//   // -----------------------------
//   @Post('features')
//   getFeatureValues(@Body('features') features: string[]): Promise<any> {
//     return this.service.getFeatureValues(features);
//   }
// }

import { Controller, Post, Body } from '@nestjs/common';
import { AianomlyService } from './aianomly.service';

@Controller('anomaly')
export class AianomlyController {
  constructor(private readonly service: AianomlyService) {}

  // ------------------------------------------------------------------
  // Combined chart + features API
  // ------------------------------------------------------------------
  @Post('chart-features')
  getChartAndFeatures(@Body() body): Promise<any> {
    return this.service.getChartAndFeatures(body);
  }
}
