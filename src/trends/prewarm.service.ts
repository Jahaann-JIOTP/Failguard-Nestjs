// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { TrendsService } from './trends.service';
// import * as moment from 'moment-timezone';

// @Injectable()
// export class PrewarmService implements OnModuleInit, OnModuleDestroy {
//   private refreshInterval: NodeJS.Timeout | null = null;
//   private readonly MAX_CONCURRENT = 2; // Max concurrent prewarm jobs

//   constructor(private readonly trendsService: TrendsService) {}

//   async onModuleInit() {
//     console.log('🚀 Prewarming cache (startup)...');
//     await this.runPrewarm();

//     // Refresh cache every 10 minutes
//     this.refreshInterval = setInterval(
//       () => {
//         this.runPrewarm().catch((err) =>
//           console.error('⚠️ Cache prewarm refresh failed:', err.message),
//         );
//       },
//       10 * 60 * 1000,
//     );
//   }

//   onModuleDestroy() {
//     if (this.refreshInterval) clearInterval(this.refreshInterval);
//   }

//   private async runPrewarm() {
//     const now = moment().utc();
//     const pastDay = now.clone().subtract(1, 'day');
//     const pastWeek = now.clone().subtract(7, 'days');

//     const prewarmConfigs = [
//       {
//         mode: 'range',
//         startDate: pastDay.toISOString(),
//         endDate: now.toISOString(),
//         params: [
//           'Genset_LN_Avg_Voltage',
//           'Oil_Pressure',
//           'Fuel_Rate',
//           'Genset_Total_kW',
//           'RPM_Stability_Index',
//           'Heat_Rate',
//         ],
//       },
//       {
//         mode: 'historic',
//         startDate: pastWeek.toISOString(),
//         endDate: now.toISOString(),
//         params: [
//           'Genset_L1_Current',
//           'Coolant_Temperature',
//           'Load_Percent',
//           'Fuel_Consumption',
//         ],
//       },
//       {
//         mode: 'live',
//         params: [
//           'Genset_Total_kW',
//           'Voltage_Imbalance',
//           'Current_Imbalance',
//           'Power_Loss_Factor',
//         ],
//       },
//       {
//         mode: 'range',
//         startDate: pastWeek.clone().subtract(3, 'days').toISOString(),
//         endDate: pastWeek.toISOString(),
//         params: ['Thermal_Stress', 'Neutral_Current', 'Lubrication_Risk_Index'],
//       },
//     ];

//     const batches = this.chunkArray(prewarmConfigs, this.MAX_CONCURRENT);

//     for (let i = 0; i < batches.length; i++) {
//       const batch = batches[i];
//       console.log(
//         `⚙️ Running batch ${i + 1}/${batches.length} (${batch.length} jobs)...`,
//       );

//       await Promise.all(
//         batch.map(async (cfg) => {
//           try {
//             const start = Date.now();
//             await this.trendsService.getTrends({ ...cfg, useCache: false });
//             console.log(`✅ Prewarmed ${cfg.mode} in ${Date.now() - start} ms`);
//           } catch (err: any) {
//             console.warn(`⚠️ Prewarm failed for ${cfg.mode}: ${err.message}`);
//           }
//         }),
//       );

//       // Small delay between batches
//       await new Promise((r) => setTimeout(r, 2000));
//     }

//     console.log(`✅ Prewarm completed for all configs`);
//   }

//   private chunkArray<T>(array: T[], chunkSize: number): T[][] {
//     const result: T[][] = [];
//     for (let i = 0; i < array.length; i += chunkSize) {
//       result.push(array.slice(i, i + chunkSize));
//     }
//     return result;
//   }

//   /** Expose cached data */
//   getCachedTrends(cfg: any) {
//     return (
//       this.trendsService['cache'][this.trendsService['getCacheKey'](cfg)] ??
//       null
//     );
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TrendsService } from './trends.service';
import * as moment from 'moment-timezone';

@Injectable()
export class PrewarmService implements OnModuleInit, OnModuleDestroy {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly MAX_CONCURRENT = 1; // ⚙️ Keep concurrency low to avoid DB overload

  constructor(private readonly trendsService: TrendsService) {}

  async onModuleInit() {
    console.log('🚀 Prewarming cache (startup)...');
    this.runPrewarm().catch((err) =>
      console.error('🔥 Prewarm startup error:', err.message),
    );

    // Refresh cache every 10 minutes in background
    this.refreshInterval = setInterval(
      () => {
        this.runPrewarm().catch((err) =>
          console.error('⚠️ Cache prewarm refresh failed:', err.message),
        );
      },
      10 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  /** Main prewarm routine (non-blocking) */
  private async runPrewarm() {
    const now = moment().utc();
    const pastDay = now.clone().subtract(1, 'day');
    const pastWeek = now.clone().subtract(7, 'days');

    // ⚙️ Prewarm configurations
    const prewarmConfigs = [
      {
        mode: 'range',
        startDate: pastDay.toISOString(),
        endDate: now.toISOString(),
        params: [
          'Genset_LN_Avg_Voltage',
          'Oil_Pressure',
          'Fuel_Rate',
          'Genset_Total_kW',
          'RPM_Stability_Index',
          'Heat_Rate',
        ],
      },
      {
        mode: 'historic',
        startDate: pastWeek.toISOString(),
        endDate: now.toISOString(),
        params: [
          'Genset_L1_Current',
          'Coolant_Temperature',
          'Load_Percent',
          'Fuel_Consumption',
        ],
      },
      {
        mode: 'live',
        params: [
          'Genset_Total_kW',
          'Voltage_Imbalance',
          'Current_Imbalance',
          'Power_Loss_Factor',
        ],
      },
      {
        mode: 'range',
        startDate: pastWeek.clone().subtract(3, 'days').toISOString(),
        endDate: pastWeek.toISOString(),
        params: ['Thermal_Stress', 'Neutral_Current', 'Lubrication_Risk_Index'],
      },
    ];

    console.log(`🧠 Prewarm starting: ${prewarmConfigs.length} total configs`);

    // Slice historical configs into daily chunks to reduce DB load
    const slicedConfigs = this.sliceConfigs(prewarmConfigs);

    // Run batches with limited concurrency
    const batches = this.chunkArray(slicedConfigs, this.MAX_CONCURRENT);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `⚙️ Running batch ${i + 1}/${batches.length} (${batch.length} jobs)...`,
      );

      batch.forEach((cfg) => {
        // Fire-and-forget each config to avoid blocking
        setImmediate(async () => {
          try {
            const start = Date.now();
            await this.trendsService.getTrends({ ...cfg, useCache: false });
            console.log(`✅ Prewarmed ${cfg.mode} in ${Date.now() - start} ms`);
          } catch (err: any) {
            console.warn(`⚠️ Prewarm failed for ${cfg.mode}: ${err.message}`);
          }
        });
      });

      // Small delay between batches to reduce DB spike
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log(`✅ Prewarm process initiated for all configs`);
  }

  /** Slice historical configs by day for smaller queries */
  private sliceConfigs(configs: any[]) {
    const result: any[] = [];

    for (const cfg of configs) {
      if (cfg.mode === 'historic' || cfg.mode === 'range') {
        const start = moment(cfg.startDate);
        const end = moment(cfg.endDate);

        let current = start.clone();
        while (current.isBefore(end)) {
          const next = current.clone().add(1, 'day');
          result.push({
            ...cfg,
            startDate: current.toISOString(),
            endDate: next.isAfter(end) ? end.toISOString() : next.toISOString(),
          });
          current = next;
        }
      } else {
        result.push(cfg);
      }
    }

    return result;
  }

  /** Split array into smaller chunks for concurrency control */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }

  /** Expose cached data if needed */
  getCachedTrends(cfg: any) {
    return (
      this.trendsService['cache'][this.trendsService['getCacheKey'](cfg)] ??
      null
    );
  }
}
