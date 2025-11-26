import { Controller, Get, Query } from '@nestjs/common';
import { NavyDataService } from './navy-data.service';

@Controller('prediction')
export class NavyDataController {
  constructor(private readonly navyDataService: NavyDataService) {}

  @Get('actual-vs-predicted')
  async getCombined(
    @Query('mode') mode: 'historic' | 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    if (!mode) return { error: 'mode query parameter is required' };

    try {
      return await this.navyDataService.getCombinedData(mode, start, end);
    } catch (err) {
      return { error: err.message };
    }
  }
}
