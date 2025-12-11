import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
  @Get('details/:id')
  async getDetails(@Param('id') id: string) {
    return this.aianomlyService.getAnomalyDetails(id);
  }
}
