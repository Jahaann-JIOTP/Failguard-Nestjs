import { Module } from '@nestjs/common';
import { NavyDataService } from './navy-data.service';
import { NavyDataController } from './navy-data.controller';

@Module({
  controllers: [NavyDataController],
  providers: [NavyDataService],
})
export class NavyDataModule {}
