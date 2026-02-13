/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query } from '@nestjs/common';
import { NavyDataService } from './navy-data.service';

// navy-data.service.ts - EXPORT INTERFACE
interface CombinedResult {
  timestamp: string;
  Predicted_Genset_Total_kW: number | null;
  Predicted_Fuel_Rate: number | null;
  Genset_Total_kW_tmuaibn: number | null;
  Fuel_Rate_tmuaibn: number | null;
}

@Controller('prediction')
export class NavyDataController {
  constructor(private readonly navyDataService: NavyDataService) {}

  @Get('actual-vs-predicted')
  // async getCombined(
  //   @Query('mode') mode: 'historic' | 'live',
  //   @Query('start') start?: string,
  //   @Query('end') end?: string,
  // ) {
  //   if (!mode) return { error: 'mode query parameter is required' };

  //   try {
  //     return await this.navyDataService.getCombinedData(mode, start, end);
  //   } catch (err) {
  //     return { error: err.message };
  //   }
  // }
  async getCombined(
    @Query('mode') mode: 'historic' | 'live',
    @Query('start') startDate?: string,
    @Query('end') endDate?: string,
  ): Promise<CombinedResult[]> {
    // 🔴 FIX: Use imported type
    return this.navyDataService.getCombinedData(mode, startDate, endDate);
  }
}
