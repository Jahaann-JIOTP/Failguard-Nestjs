// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { TrendsService } from './trends.service';
// import * as moment from 'moment-timezone';

// @Injectable()
// export class PrewarmService implements OnModuleInit, OnModuleDestroy {
//   private refreshInterval: NodeJS.Timeout | null = null;
//   private readonly MAX_CONCURRENT = 2; // ⚙️ Max concurrent prewarm jobs

//   constructor(private readonly trendsService: TrendsService) {}

//   async onModuleInit() {
//     console.log('🚀 Prewarming cache (startup)...');
//     await this.runPrewarm();

//     // ♻️ Refresh cache every 10 minutes
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

//   /**
//    * Main prewarm routine
//    */
//   private async runPrewarm() {
//     try {
//       const startTime = Date.now();
//       const now = moment().utc();
//       const pastDay = now.clone().subtract(1, 'day');
//       const pastWeek = now.clone().subtract(7, 'days');

//       // ⚙️ Prewarm configurations
//       const prewarmConfigs = [
//         {
//           mode: 'range',
//           startDate: pastDay.toISOString(),
//           endDate: now.toISOString(),
//           params: [
//             'Genset_LN_Avg_Voltage',
//             'Oil_Pressure',
//             'Fuel_Rate',
//             'Genset_Total_kW',
//             'RPM_Stability_Index',
//             'Heat_Rate',
//           ],
//         },
//         {
//           mode: 'historic',
//           startDate: pastWeek.toISOString(),
//           endDate: now.toISOString(),
//           params: [
//             'Genset_L1_Current',
//             'Coolant_Temperature',
//             'Load_Percent',
//             'Fuel_Consumption',
//           ],
//         },
//         {
//           mode: 'live',
//           params: [
//             'Genset_Total_kW',
//             'Voltage_Imbalance',
//             'Current_Imbalance',
//             'Power_Loss_Factor',
//           ],
//         },
//         {
//           mode: 'range',
//           startDate: pastWeek.clone().subtract(3, 'days').toISOString(),
//           endDate: pastWeek.toISOString(),
//           params: [
//             'Thermal_Stress',
//             'Neutral_Current',
//             'Lubrication_Risk_Index',
//           ],
//         },
//       ];

//       console.log(
//         `🧠 Prewarm starting: ${prewarmConfigs.length} total configs`,
//       );

//       // 🧩 Filter out already cached configs
//       const uncached = prewarmConfigs
//         .filter
//         // (cfg) => !this.trendsService.isCached(cfg),
//         ();
//       const cached = prewarmConfigs.length - uncached.length;

//       if (cached > 0) console.log(`⚡ Skipping ${cached} cached configs`);
//       if (uncached.length === 0) {
//         console.log('✅ All data already cached, skipping prewarm');
//         return;
//       }

//       // 🔥 Split into batches (parallel processing)
//       const batches = this.chunkArray(uncached, this.MAX_CONCURRENT);

//       for (let i = 0; i < batches.length; i++) {
//         const batch = batches[i];
//         console.log(
//           `⚙️ Running batch ${i + 1}/${batches.length} (${batch.length} jobs)...`,
//         );

//         const results = await Promise.allSettled(
//           batch.map(async (config) => {
//             const label = config.mode.toUpperCase();
//             const start = Date.now();

//             try {
//               await this.trendsService.getTrends(config);
//               const ms = Date.now() - start;
//               console.log(`   ✅ ${label} prewarmed in ${ms} ms`);
//               return `${label} done in ${ms} ms`;
//             } catch (err: any) {
//               console.warn(`   ⚠️ ${label} prewarm failed: ${err.message}`);
//               return `${label} failed`;
//             }
//           }),
//         );

//         // Small delay between batches (prevent overload)
//         await new Promise((r) => setTimeout(r, 2000));
//       }

//       console.log(
//         `✅ Prewarm completed: ${uncached.length} configs in ${Date.now() - startTime} ms`,
//       );
//     } catch (err: any) {
//       console.error('🔥 Prewarm service error:', err.message);
//     }
//   }

//   /** Utility to split array into smaller chunks */
//   private chunkArray<T>(array: T[], chunkSize: number): T[][] {
//     const result: T[][] = [];
//     for (let i = 0; i < array.length; i += chunkSize) {
//       result.push(array.slice(i, i + chunkSize));
//     }
//     return result;
//   }
// }
