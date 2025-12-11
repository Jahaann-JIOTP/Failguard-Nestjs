import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './dashboard/database.module';
import { NodeRedLinkModule } from './nodered/node_red_link.module';
import { PrivellegesModule } from './privelleges/privelleges.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { TimestampUpdateModule } from './timestamp-update/timestamp-update.module';
import { TrendsModule } from './trends/trends.module';
import { FormulasService } from './trends/formulas.service';
import { ReportsModule } from './reports/reports.module';
// import { AlarmsModule } from './alarms/alarms.module';
import { GeneratorModule } from './generator/generator.module';
import { NavyDataModule } from './navy-data/navy-data.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StreamModule } from './stream/stream.module';
import { AianomlyModule } from './aianomly/aianomly.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''), // Default connection, no connectionName
    UsersModule,
    AuthModule,
    RolesModule,
    PrivellegesModule,
    NodeRedLinkModule,
    DatabaseModule,
    DashboardModule,
    TimestampUpdateModule,
    TrendsModule,
    ReportsModule,
    // AlarmsModule,
    GeneratorModule,
    NavyDataModule,
    StreamModule,
    AianomlyModule,
  ],
  controllers: [AppController],
  providers: [AppService, FormulasService],
})
export class AppModule {}
