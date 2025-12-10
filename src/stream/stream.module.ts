import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { FormulasService } from 'src/trends/formulas.service';

@Module({
  controllers: [StreamController],
  providers: [StreamService, FormulasService],
})
export class StreamModule {}
