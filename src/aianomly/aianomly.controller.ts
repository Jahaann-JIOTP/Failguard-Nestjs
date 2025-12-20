import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AianomlyService } from './aianomly.service';

@Controller('anomly')
export class AianomlyController {
  constructor(private readonly aianomlyService: AianomlyService) {}

  // -------------------------------------------------------
  // API 1 → Chart only
  // -------------------------------------------------------
  @Post('chart')
  async getChart(@Body() body: { mode: string; start?: string; end?: string }) {
    return this.aianomlyService.getChartOnly(body);
  }

  // -------------------------------------------------------
  // API 2 → Anomaly details by ID
  // -------------------------------------------------------
  // @Get('details/:id')
  // async getDetails(@Param('id') id: string) {
  //   return this.aianomlyService.getAnomalyDetails(id);
  // }

  // GET /anomly/details/:id?mode=historic&start=...&end=...
  // @Get('details/:id')
  // async getDetails(
  //   @Param('id') id: string,
  //   @Query('mode') mode?: string,
  //   @Query('start') start?: string,
  //   @Query('end') end?: string,
  // ) {
  //   return this.aianomlyService.getAnomalyDetails({
  //     id,
  //     mode: mode || 'live',
  //     start,
  //     end,
  //   });
  // }

  @Get('details/:id')
  async getDetails(
    @Param('id') id: string,
    @Query('mode') mode?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    // mode ko 'live' ya 'historic' mai convert karo
    const modeTyped: 'live' | 'historic' =
      mode === 'historic' ? 'historic' : 'live';

    return this.aianomlyService.getAnomalyDetails({
      id,
      mode: modeTyped,
      start,
      end,
    });
  }
}
