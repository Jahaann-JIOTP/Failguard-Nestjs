import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { FormulasService } from 'src/trends/formulas.service';
import { DashboardGateway } from './dashboard.gateway';
// import { PrewarmDashboardService } from './prewarm-dashboard.service';
// import { PrewarmDashboardService } from './prewarm-dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway, FormulasService],
})
export class DashboardModule {}
