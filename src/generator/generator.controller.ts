/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Get, Body } from '@nestjs/common';
import { GeneratorService } from './generator.service';

@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('runtime-since-service')
  handle(@Body() body: any) {
    return this.generatorService.handleService(body);
  }

  @Get('runtime-results')
  getLatest() {
    return this.generatorService.getLatestHistory();
  }
}
