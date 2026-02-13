// /* eslint-disable @typescript-eslint/no-unsafe-return */
// import { Controller, Get, Query } from '@nestjs/common';
// import { NavyDataService } from './navy-data.service';
// import type { CombinedResult } from './navy-data.service';

// @Controller('prediction')
// export class NavyDataController {
//   constructor(private readonly navyDataService: NavyDataService) {}

//   @Get('actual-vs-predicted')
//   // async getCombined(
//   //   @Query('mode') mode: 'historic' | 'live',
//   //   @Query('start') start?: string,
//   //   @Query('end') end?: string,
//   // ) {
//   //   if (!mode) return { error: 'mode query parameter is required' };

//   //   try {
//   //     return await this.navyDataService.getCombinedData(mode, start, end);
//   //   } catch (err) {
//   //     return { error: err.message };
//   //   }
//   // }
//   async getCombined(
//     @Query('mode') mode: 'historic' | 'live',
//     @Query('start') startDate?: string,
//     @Query('end') endDate?: string,
//   ): Promise<CombinedResult[]> {
//     // 🔴 FIX: Use imported type
//     return this.navyDataService.getCombinedData(mode, startDate);
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query } from '@nestjs/common';
import { NavyDataService } from './navy-data.service';
import type { CombinedResult } from './navy-data.service';

@Controller('prediction')
export class NavyDataController {
  constructor(private readonly navyDataService: NavyDataService) {}

  @Get('actual-vs-predicted')
  async getCombined(
    @Query('mode') mode: 'historic' | 'live' | 'both' = 'both', // Added 'both' option
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
  ): Promise<CombinedResult[]> {
    return this.navyDataService.getCombinedData(mode, startDate, endDate); // Now passing all 3 parameters
  }
}
