/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Db } from 'mongodb';
import * as moment from 'moment-timezone';
import { cache } from 'utils/cache';

@Injectable()
export class PrewarmDashboardService implements OnModuleInit {
  private collection;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.collection = this.db.collection('navy');
  }

  async onModuleInit() {
    console.log('🚀 Starting dashboard prewarm...');
    await this.prewarmAllDashboards();

    // ♻️ Auto-refresh cache every 30 minutes
    setInterval(
      async () => {
        console.log('♻️ Refreshing dashboard cache...');
        await this.prewarmAllDashboards();
      },
      30 * 60 * 1000,
    );
  }

  /**
   * Prewarm all dashboards at once
   */
  async prewarmAllDashboards() {
    const start = performance.now();

    const dashboards = [
      {
        name: 'dashboard1',
        query: { Genset_Run_SS: { $gte: 1, $lte: 6 } },
        projection: {
          timestamp: 1,
          Genset_Total_kW: 1,
          Genset_Application_kW_Rating_PC2X: 1,
          Averagr_Engine_Speed: 1,
          Genset_L1L2_Voltage: 1,
          Genset_L2L3_Voltage: 1,
          Genset_L3L1_Voltage: 1,
          Genset_Frequency_OP_calculated: 1,
          Genset_L1_Current: 1,
          Genset_L2_Current: 1,
          Genset_L3_Current: 1,
          Coolant_Temperature: 1,
          Oil_Temperature: 1,
          Oil_Pressure: 1,
          Fuel_Rate: 1,
          Total_Fuel_Consumption_calculated: 1,
          Engine_Running_TIME_calculated: 1,
          Battery_Voltage_calculated: 1,
          Genset_Total_Power_Factor_calculated: 1,
        },
      },
      {
        name: 'dashboard2',
        query: { Genset_Run_SS: { $gte: 1, $lte: 6 } },
        projection: {
          timestamp: 1,
          Genset_L1_Active_Power: 1,
          Genset_L2_Active_Power: 1,
          Genset_L3_Active_Power: 1,
          I2Rated: 1,
          Genset_Total_kW: 1,
          Genset_Application_kW_Rating_PC2X: 1,
          Averagr_Engine_Speed: 1,
          Genset_L1L2_Voltage: 1,
          Genset_L2L3_Voltage: 1,
          Genset_L3L1_Voltage: 1,
          Genset_Frequency_OP_calculated: 1,
          Genset_L1_Current: 1,
          Genset_L2_Current: 1,
          Genset_L3_Current: 1,
          Coolant_Temperature: 1,
          Oil_Temperature: 1,
          Oil_Pressure: 1,
          Fuel_Rate: 1,
          Total_Fuel_Consumption_calculated: 1,
          Engine_Running_TIME_calculated: 1,
          Battery_Voltage_calculated: 1,
          Genset_Total_Power_Factor_calculated: 1,
        },
      },
      // ✅ Add dashboard3..dashboard6 here if needed
    ];

    for (const dash of dashboards) {
      await this.prewarmDashboard(dash.name, dash.query, dash.projection);
    }

    const total = (performance.now() - start).toFixed(2);
    console.log(`🔥 All dashboards prewarmed in ${total} ms`);
  }

  /**
   * Fetch dashboard data (cached)
   */
  private async prewarmDashboard(
    name: string,
    query: any,
    projection: any,
  ): Promise<any[]> {
    const cacheKey = `dashboard_${name}`;

    // ⚡ Return instantly if cached
    if (cache.has(cacheKey)) {
      console.log(`⚡ Using cached data for ${name}`);
      return cache.get(cacheKey);
    }

    console.log(`Fetching fresh data for ${name}...`);
    const pipeline = [
      { $match: query },
      { $project: projection },
      { $sort: { timestamp: 1 } },
    ];

    const docs = await this.collection.aggregate(pipeline).toArray();

    // Format timestamps for consistency
    const formatted = docs.map((d) => ({
      ...d,
      timestamp: moment(d.timestamp)
        .tz('Asia/Karachi')
        .format('YYYY-MM-DD HH:mm:ss.SSS'),
    }));

    cache.set(cacheKey, formatted);
    console.log(`✅ ${name} cached (${formatted.length} records)`);

    return formatted;
  }
}
