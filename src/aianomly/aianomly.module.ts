import { Module } from '@nestjs/common';
import { AianomlyService } from './aianomly.service';
import { AianomlyController } from './aianomly.controller';
import { FormulasService } from 'src/trends/formulas.service';

@Module({
  controllers: [AianomlyController],
  providers: [AianomlyService, FormulasService],
})
export class AianomlyModule {}
