// // // /* eslint-disable @typescript-eslint/no-unused-vars */
// // // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // // /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // // import { Injectable, Inject } from '@nestjs/common';
// // // import { Db } from 'mongodb';

// // // export interface CombinedResult {
// // //   timestamp: string;
// // //   date: string;
// // //   time: string;
// // //   Predicted_Genset_Total_kW: number | null;
// // //   Predicted_Fuel_Rate: number | null;
// // //   Genset_Total_kW_tmuaibn: number | null;
// // //   Fuel_Rate_tmuaibn: number | null;
// // //   source: 'prediction' | 'navy' | 'both';
// // // }

// // // @Injectable()
// // // export class NavyDataService {
// // //   private navyCollection: any; // Historic predictions
// // //   private tmuaibnCollection: any; // Navy actual data
// // //   private livePredictionCollection: any; // LIVE predictions collection
// // //   private liveClients: Record<string, string> = {};

// // //   // Cache only for historic mode
// // //   private navyCache: Map<string, any> | null = null;
// // //   private navyCachePromise: Promise<any> | null = null;

// // //   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
// // //     this.navyCollection = this.db.collection('rf_eng_prediction_12s_2');
// // //     this.tmuaibnCollection = this.db.collection('navy_12s');
// // //     this.livePredictionCollection = this.db.collection(
// // //       'rf_eng_prediction_temp_12s_2',
// // //     );
// // //   }

// // //   private generateClientId() {
// // //     return Math.random().toString(36).substring(2) + Date.now().toString(36);
// // //   }

// // //   // Convert UTC to Karachi time
// // //   private utcToKarachi(utcDate: Date): string {
// // //     const karachiTime = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
// // //     return karachiTime.toISOString();
// // //   }

// // //   // Normalize timestamp for matching (remove milliseconds and timezone)
// // //   private normalizeTimestamp(ts: any): string {
// // //     if (!ts) return '';

// // //     let dateStr: string;

// // //     if (typeof ts === 'string') {
// // //       dateStr = ts;
// // //     } else if (ts instanceof Date) {
// // //       dateStr = this.utcToKarachi(ts);
// // //     } else if (ts && typeof ts === 'object' && ts.toISOString) {
// // //       dateStr = this.utcToKarachi(new Date(ts));
// // //     } else {
// // //       dateStr = String(ts);
// // //     }

// // //     // Remove milliseconds and timezone for matching
// // //     return dateStr.split('.')[0].split('+')[0];
// // //   }

// // //   private timestampToString(ts: any): string {
// // //     return this.normalizeTimestamp(ts);
// // //   }

// // //   // Format timestamp for display
// // //   private formatTimestamp(ts: any): {
// // //     formatted: string;
// // //     date: string;
// // //     time: string;
// // //   } {
// // //     const dateStr = this.normalizeTimestamp(ts);

// // //     let cleanDateStr = dateStr;
// // //     if (dateStr.includes('+05:00')) {
// // //       cleanDateStr = dateStr.replace('+05:00', '');
// // //     }

// // //     const [date, timeWithOffset] = cleanDateStr.split('T');
// // //     const time = timeWithOffset?.split('+')[0]?.split('.')[0] || '';

// // //     const [y, m, d] = date.split('-');
// // //     const monthNames = [
// // //       'Jan',
// // //       'Feb',
// // //       'Mar',
// // //       'Apr',
// // //       'May',
// // //       'Jun',
// // //       'Jul',
// // //       'Aug',
// // //       'Sep',
// // //       'Oct',
// // //       'Nov',
// // //       'Dec',
// // //     ];
// // //     const month = monthNames[parseInt(m) - 1] || 'Jan';

// // //     return {
// // //       formatted: `${month} ${parseInt(d) || 1}, ${time}`,
// // //       date,
// // //       time,
// // //     };
// // //   }

// // //   private async getNavyMap(
// // //     mode: 'historic' | 'live',
// // //     startKarachi?: string,
// // //     endKarachi?: string,
// // //   ): Promise<Map<string, any>> {
// // //     // Live mode - sirf last 1 hour ka navy data
// // //     if (mode === 'live') {
// // //       console.log(
// // //         `🔴 Live mode: Fetching navy data from ${startKarachi} to ${endKarachi}`,
// // //       );

// // //       const query: any = {};
// // //       if (startKarachi && endKarachi) {
// // //         query.$or = [
// // //           { timestamp: { $gte: startKarachi, $lte: endKarachi } },
// // //           { timestampts: { $gte: startKarachi, $lte: endKarachi } },
// // //         ];
// // //       }

// // //       const navyRecords = await this.navyCollection
// // //         .find(query)
// // //         .project({
// // //           timestampts: 1,
// // //           timestamp: 1,
// // //           Genset_Total_kW: 1,
// // //           Fuel_Rate: 1,
// // //         })
// // //         .toArray();

// // //       console.log(`Found ${navyRecords.length} navy records for live mode`);

// // //       const map = new Map();
// // //       navyRecords.forEach((navy: any) => {
// // //         const ts = navy.timestampts || navy.timestamp;
// // //         if (ts) {
// // //           const tsStr = this.normalizeTimestamp(ts);
// // //           map.set(tsStr, {
// // //             Genset_Total_kW: navy.Genset_Total_kW,
// // //             Fuel_Rate: navy.Fuel_Rate,
// // //             timestamp: tsStr,
// // //           });
// // //         }
// // //       });

// // //       console.log(`Created map with ${map.size} unique timestamps`);
// // //       return map;
// // //     }

// // //     // Historic mode - full cache
// // //     console.log('📜 Historic mode: Using cached navy data');
// // //     if (this.navyCache) {
// // //       return this.navyCache;
// // //     }

// // //     if (this.navyCachePromise) {
// // //       return this.navyCachePromise;
// // //     }

// // //     this.navyCachePromise = (async () => {
// // //       const navyRecords = await this.navyCollection
// // //         .find({})
// // //         .project({
// // //           timestampts: 1,
// // //           timestamp: 1,
// // //           Genset_Total_kW: 1,
// // //           Fuel_Rate: 1,
// // //         })
// // //         .toArray();

// // //       const map = new Map();
// // //       navyRecords.forEach((navy: any) => {
// // //         const ts = navy.timestampts || navy.timestamp;
// // //         if (ts) {
// // //           const tsStr = this.normalizeTimestamp(ts);
// // //           map.set(tsStr, {
// // //             Genset_Total_kW: navy.Genset_Total_kW,
// // //             Fuel_Rate: navy.Fuel_Rate,
// // //             timestamp: tsStr,
// // //           });
// // //         }
// // //       });

// // //       this.navyCache = map;
// // //       this.navyCachePromise = null;
// // //       return map;
// // //     })();

// // //     return this.navyCachePromise;
// // //   }

// // //   async getCombinedData(
// // //     mode: 'historic' | 'live',
// // //     startDate?: string,
// // //     endDate?: string,
// // //   ): Promise<CombinedResult[]> {
// // //     let start: string;
// // //     let end: string;
// // //     let predictionCollection: any;

// // //     if (mode === 'historic') {
// // //       if (!startDate || !endDate) {
// // //         throw new Error('start and end dates are required for historic mode');
// // //       }
// // //       start = startDate;
// // //       end = endDate;
// // //       predictionCollection = this.navyCollection;
// // //       console.log('📜 Using historic predictions collection');
// // //     } else {
// // //       // Last 1 hour for live mode
// // //       const now = new Date();
// // //       const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

// // //       const yyyy = now.getFullYear();
// // //       const mm = String(now.getMonth() + 1).padStart(2, '0');
// // //       const dd = String(now.getDate()).padStart(2, '0');

// // //       const yyyyStart = oneHourAgo.getFullYear();
// // //       const mmStart = String(oneHourAgo.getMonth() + 1).padStart(2, '0');
// // //       const ddStart = String(oneHourAgo.getDate()).padStart(2, '0');
// // //       const hhStart = String(oneHourAgo.getHours()).padStart(2, '0');
// // //       const minStart = String(oneHourAgo.getMinutes()).padStart(2, '0');
// // //       const secStart = String(oneHourAgo.getSeconds()).padStart(2, '0');

// // //       const hhNow = String(now.getHours()).padStart(2, '0');
// // //       const minNow = String(now.getMinutes()).padStart(2, '0');
// // //       const secNow = String(now.getSeconds()).padStart(2, '0');

// // //       start = `${yyyyStart}-${mmStart}-${ddStart}T${hhStart}:${minStart}:${secStart}+05:00`;
// // //       end = `${yyyy}-${mm}-${dd}T${hhNow}:${minNow}:${secNow}+05:00`;

// // //       predictionCollection = this.livePredictionCollection;
// // //       console.log(
// // //         `🔴 Using LIVE predictions collection from ${start} to ${end}`,
// // //       );
// // //     }

// // //     // Convert start/end to Karachi time for query
// // //     const startKarachi = start.includes('+05:00')
// // //       ? start
// // //       : `${start}T00:00:00+05:00`;
// // //     const endKarachi = end.includes('+05:00') ? end : `${end}T23:59:59+05:00`;

// // //     // Parallel queries
// // //     const [predictions, navyMap] = await Promise.all([
// // //       predictionCollection
// // //         .find({
// // //           timestamp: { $gte: startKarachi, $lte: endKarachi },
// // //         })
// // //         .project({
// // //           timestamp: 1,
// // //           Predicted_Genset_Total_kW: 1,
// // //           Predicted_Fuel_Rate: 1,
// // //         })
// // //         .sort({ timestamp: 1 })
// // //         .toArray(),
// // //       this.getNavyMap(mode, startKarachi, endKarachi),
// // //     ]);

// // //     console.log(
// // //       `Found ${predictions.length} predictions, ${navyMap.size} navy records`,
// // //     );

// // //     const startDateStr = start.split('T')[0];
// // //     const endDateStr = end.split('T')[0];

// // //     // 🔴 FIX: Use Map to merge data by timestamp
// // //     const mergedMap = new Map<string, CombinedResult>();

// // //     // First add all predictions
// // //     for (let i = 0; i < predictions.length; i++) {
// // //       const pred = predictions[i];
// // //       const predTs = this.normalizeTimestamp(pred.timestamp);
// // //       const navy = navyMap.get(predTs);

// // //       const { formatted, date, time } = this.formatTimestamp(pred.timestamp);

// // //       mergedMap.set(predTs, {
// // //         timestamp: formatted,
// // //         date,
// // //         time,
// // //         Predicted_Genset_Total_kW: pred.Predicted_Genset_Total_kW,
// // //         Predicted_Fuel_Rate: pred.Predicted_Fuel_Rate,
// // //         Genset_Total_kW_tmuaibn: navy?.Genset_Total_kW ?? null,
// // //         Fuel_Rate_tmuaibn: navy?.Fuel_Rate ?? null,
// // //         source: navy ? 'both' : 'prediction',
// // //       });
// // //     }

// // //     // Then add navy-only records (that weren't in predictions)
// // //     if (navyMap.size > 0) {
// // //       const navyEntries = Array.from(navyMap.entries());
// // //       for (let i = 0; i < navyEntries.length; i++) {
// // //         const [ts, navy] = navyEntries[i];
// // //         const dateStr = ts.split('T')[0];

// // //         if (
// // //           dateStr >= startDateStr &&
// // //           dateStr <= endDateStr &&
// // //           !mergedMap.has(ts) // Only add if not already present
// // //         ) {
// // //           const { formatted, date, time } = this.formatTimestamp(ts);

// // //           mergedMap.set(ts, {
// // //             timestamp: formatted,
// // //             date,
// // //             time,
// // //             Predicted_Genset_Total_kW: null,
// // //             Predicted_Fuel_Rate: null,
// // //             Genset_Total_kW_tmuaibn: navy.Genset_Total_kW,
// // //             Fuel_Rate_tmuaibn: navy.Fuel_Rate,
// // //             source: 'navy',
// // //           });
// // //         }
// // //       }
// // //     }

// // //     // Convert Map to array and sort
// // //     const result = Array.from(mergedMap.values());

// // //     if (result.length > 0) {
// // //       result.sort((a, b) => {
// // //         if (a.date !== b.date) return a.date.localeCompare(b.date);
// // //         return a.time.localeCompare(b.time);
// // //       });
// // //     }

// // //     // Count stats
// // //     const bothCount = result.filter((r) => r.source === 'both').length;
// // //     const predCount = result.filter((r) => r.source === 'prediction').length;
// // //     const navyOnlyCount = result.filter((r) => r.source === 'navy').length;

// // //     console.log(
// // //       `Returning ${result.length} records for ${mode} mode (${bothCount} both, ${predCount} pred-only, ${navyOnlyCount} navy-only)`,
// // //     );
// // //     return result;
// // //   }
// // // }

// // /* eslint-disable @typescript-eslint/no-unused-vars */
// // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // import { Injectable, Inject } from '@nestjs/common';
// // import { Db } from 'mongodb';

// // export interface CombinedResult {
// //   timestamp: string;
// //   date: string;
// //   time: string;
// //   Genset_Total_kW: number | null;
// //   Predicted_Genset_Total_kW: number | null;
// //   Fuel_Rate: number | null;
// //   Predicted_Fuel_Rate: number | null;
// //   source: 'historic' | 'live' | 'both';
// // }

// // @Injectable()
// // export class NavyDataService {
// //   private historicCollection: any; // rf_eng_prediction_12s_2
// //   private liveCollection: any; // rf_eng_prediction_temp_12s_2

// //   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
// //     this.historicCollection = this.db.collection('rf_eng_prediction_12s_2');
// //     this.liveCollection = this.db.collection('rf_eng_prediction_temp_12s_2');
// //   }

// //   // Convert UTC to Karachi time
// //   private utcToKarachi(utcDate: Date): string {
// //     const karachiTime = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
// //     return karachiTime.toISOString();
// //   }

// //   // Normalize timestamp for matching (remove milliseconds and timezone)
// //   private normalizeTimestamp(ts: any): string {
// //     if (!ts) return '';

// //     let dateStr: string;

// //     if (typeof ts === 'string') {
// //       dateStr = ts;
// //     } else if (ts instanceof Date) {
// //       dateStr = this.utcToKarachi(ts);
// //     } else if (ts && typeof ts === 'object' && ts.toISOString) {
// //       dateStr = this.utcToKarachi(new Date(ts));
// //     } else {
// //       dateStr = String(ts);
// //     }

// //     // Remove milliseconds and timezone for matching
// //     return dateStr.split('.')[0].split('+')[0];
// //   }

// //   // Format timestamp for display
// //   private formatTimestamp(ts: any): {
// //     formatted: string;
// //     date: string;
// //     time: string;
// //   } {
// //     const dateStr = this.normalizeTimestamp(ts);

// //     let cleanDateStr = dateStr;
// //     if (dateStr.includes('+05:00')) {
// //       cleanDateStr = dateStr.replace('+05:00', '');
// //     }

// //     const [date, timeWithOffset] = cleanDateStr.split('T');
// //     const time = timeWithOffset?.split('+')[0]?.split('.')[0] || '';

// //     const [y, m, d] = date.split('-');
// //     const monthNames = [
// //       'Jan',
// //       'Feb',
// //       'Mar',
// //       'Apr',
// //       'May',
// //       'Jun',
// //       'Jul',
// //       'Aug',
// //       'Sep',
// //       'Oct',
// //       'Nov',
// //       'Dec',
// //     ];
// //     const month = monthNames[parseInt(m) - 1] || 'Jan';

// //     return {
// //       formatted: `${month} ${parseInt(d) || 1}, ${time}`,
// //       date,
// //       time,
// //     };
// //   }

// //   async getCombinedData(
// //     startDate?: string,
// //     // endDate?: string,
// //     endDate?: string | undefined,
// //   ): Promise<CombinedResult[]> {
// //     let start: string;
// //     let end: string;

// //     // Default to last 24 hours if no dates provided
// //     if (!startDate || !endDate) {
// //       const now = new Date();
// //       const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

// //       const yyyy = now.getFullYear();
// //       const mm = String(now.getMonth() + 1).padStart(2, '0');
// //       const dd = String(now.getDate()).padStart(2, '0');

// //       const yyyyStart = twentyFourHoursAgo.getFullYear();
// //       const mmStart = String(twentyFourHoursAgo.getMonth() + 1).padStart(
// //         2,
// //         '0',
// //       );
// //       const ddStart = String(twentyFourHoursAgo.getDate()).padStart(2, '0');
// //       const hhStart = String(twentyFourHoursAgo.getHours()).padStart(2, '0');
// //       const minStart = String(twentyFourHoursAgo.getMinutes()).padStart(2, '0');
// //       const secStart = String(twentyFourHoursAgo.getSeconds()).padStart(2, '0');

// //       const hhNow = String(now.getHours()).padStart(2, '0');
// //       const minNow = String(now.getMinutes()).padStart(2, '0');
// //       const secNow = String(now.getSeconds()).padStart(2, '0');

// //       start = `${yyyyStart}-${mmStart}-${ddStart}T${hhStart}:${minStart}:${secStart}+05:00`;
// //       end = `${yyyy}-${mm}-${dd}T${hhNow}:${minNow}:${secNow}+05:00`;
// //     } else {
// //       start = startDate.includes('+05:00')
// //         ? startDate
// //         : `${startDate}T00:00:00+05:00`;
// //       end = endDate.includes('+05:00') ? endDate : `${endDate}T23:59:59+05:00`;
// //     }

// //     console.log(`Fetching data from ${start} to ${end}`);

// //     // Parallel queries from both collections
// //     const [historicData, liveData] = await Promise.all([
// //       this.historicCollection
// //         .find({
// //           timestamp: { $gte: start, $lte: end },
// //         })
// //         .project({
// //           timestamp: 1,
// //           Genset_Total_kW: 1,
// //           Predicted_Genset_Total_kW: 1,
// //           Fuel_Rate: 1,
// //           Predicted_Fuel_Rate: 1,
// //         })
// //         .sort({ timestamp: 1 })
// //         .toArray(),
// //       this.liveCollection
// //         .find({
// //           timestamp: { $gte: start, $lte: end },
// //         })
// //         .project({
// //           timestamp: 1,
// //           Genset_Total_kW: 1,
// //           Predicted_Genset_Total_kW: 1,
// //           Fuel_Rate: 1,
// //           Predicted_Fuel_Rate: 1,
// //         })
// //         .sort({ timestamp: 1 })
// //         .toArray(),
// //     ]);

// //     console.log(
// //       `Found ${historicData.length} historic records, ${liveData.length} live records`,
// //     );

// //     // Merge data by timestamp
// //     const mergedMap = new Map<string, CombinedResult>();

// //     // Add historic data
// //     for (let i = 0; i < historicData.length; i++) {
// //       const record = historicData[i];
// //       const ts = this.normalizeTimestamp(record.timestamp);
// //       const { formatted, date, time } = this.formatTimestamp(record.timestamp);

// //       mergedMap.set(ts, {
// //         timestamp: formatted,
// //         date,
// //         time,
// //         Genset_Total_kW: record.Genset_Total_kW ?? null,
// //         Predicted_Genset_Total_kW: record.Predicted_Genset_Total_kW ?? null,
// //         Fuel_Rate: record.Fuel_Rate ?? null,
// //         Predicted_Fuel_Rate: record.Predicted_Fuel_Rate ?? null,
// //         source: 'historic',
// //       });
// //     }

// //     // Add/merge live data
// //     for (let i = 0; i < liveData.length; i++) {
// //       const record = liveData[i];
// //       const ts = this.normalizeTimestamp(record.timestamp);
// //       const existing = mergedMap.get(ts);
// //       const { formatted, date, time } = this.formatTimestamp(record.timestamp);

// //       if (existing) {
// //         // Merge with existing historic record
// //         mergedMap.set(ts, {
// //           timestamp: formatted,
// //           date,
// //           time,
// //           Genset_Total_kW:
// //             existing.Genset_Total_kW ?? record.Genset_Total_kW ?? null,
// //           Predicted_Genset_Total_kW:
// //             existing.Predicted_Genset_Total_kW ??
// //             record.Predicted_Genset_Total_kW ??
// //             null,
// //           Fuel_Rate: existing.Fuel_Rate ?? record.Fuel_Rate ?? null,
// //           Predicted_Fuel_Rate:
// //             existing.Predicted_Fuel_Rate ?? record.Predicted_Fuel_Rate ?? null,
// //           source: 'both',
// //         });
// //       } else {
// //         // Add new live record
// //         mergedMap.set(ts, {
// //           timestamp: formatted,
// //           date,
// //           time,
// //           Genset_Total_kW: record.Genset_Total_kW ?? null,
// //           Predicted_Genset_Total_kW: record.Predicted_Genset_Total_kW ?? null,
// //           Fuel_Rate: record.Fuel_Rate ?? null,
// //           Predicted_Fuel_Rate: record.Predicted_Fuel_Rate ?? null,
// //           source: 'live',
// //         });
// //       }
// //     }

// //     // Convert Map to array and sort
// //     const result = Array.from(mergedMap.values());

// //     if (result.length > 0) {
// //       result.sort((a, b) => {
// //         if (a.date !== b.date) return a.date.localeCompare(b.date);
// //         return a.time.localeCompare(b.time);
// //       });
// //     }

// //     // Count stats
// //     const bothCount = result.filter((r) => r.source === 'both').length;
// //     const historicCount = result.filter((r) => r.source === 'historic').length;
// //     const liveCount = result.filter((r) => r.source === 'live').length;

// //     console.log(
// //       `Returning ${result.length} records (${bothCount} both, ${historicCount} historic-only, ${liveCount} live-only)`,
// //     );

// //     return result;
// //   }
// // }

// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';

// export interface CombinedResult {
//   timestamp: string;
//   date: string;
//   time: string;
//   Genset_Total_kW_tmuaibn: number | null; // Renamed field with tmuaibn suffix
//   Predicted_Genset_Total_kW: number | null;
//   Fuel_Rate_tmuaibn: number | null; // Renamed field with tmuaibn suffix
//   Predicted_Fuel_Rate: number | null;
//   source: 'historic' | 'live' | 'both';
// }

// @Injectable()
// export class NavyDataService {
//   private historicCollection: any; // rf_eng_prediction_12s_2
//   private liveCollection: any; // rf_eng_prediction_temp_12s_2

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.historicCollection = this.db.collection('rf_eng_prediction_12s_2');
//     this.liveCollection = this.db.collection('rf_eng_prediction_temp_12s_2');
//   }

//   // Convert UTC to Karachi time
//   private utcToKarachi(utcDate: Date): string {
//     const karachiTime = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
//     return karachiTime.toISOString();
//   }

//   // Normalize timestamp for matching (remove milliseconds and timezone)
//   private normalizeTimestamp(ts: any): string {
//     if (!ts) return '';

//     let dateStr: string;

//     if (typeof ts === 'string') {
//       dateStr = ts;
//     } else if (ts instanceof Date) {
//       dateStr = this.utcToKarachi(ts);
//     } else if (ts && typeof ts === 'object' && ts.toISOString) {
//       dateStr = this.utcToKarachi(new Date(ts));
//     } else {
//       dateStr = String(ts);
//     }

//     // Remove milliseconds and timezone for matching
//     return dateStr.split('.')[0].split('+')[0];
//   }

//   // Format timestamp for display
//   private formatTimestamp(ts: any): {
//     formatted: string;
//     date: string;
//     time: string;
//   } {
//     const dateStr = this.normalizeTimestamp(ts);

//     let cleanDateStr = dateStr;
//     if (dateStr.includes('+05:00')) {
//       cleanDateStr = dateStr.replace('+05:00', '');
//     }

//     const [date, timeWithOffset] = cleanDateStr.split('T');
//     const time = timeWithOffset?.split('+')[0]?.split('.')[0] || '';

//     const [y, m, d] = date.split('-');
//     const monthNames = [
//       'Jan',
//       'Feb',
//       'Mar',
//       'Apr',
//       'May',
//       'Jun',
//       'Jul',
//       'Aug',
//       'Sep',
//       'Oct',
//       'Nov',
//       'Dec',
//     ];
//     const month = monthNames[parseInt(m) - 1] || 'Jan';

//     return {
//       formatted: `${month} ${parseInt(d) || 1}, ${time}`,
//       date,
//       time,
//     };
//   }

//   async getCombinedData(
//     startDate?: string,
//     endDate?: string | undefined,
//   ): Promise<CombinedResult[]> {
//     let start: string;
//     let end: string;

//     // Default to last 24 hours if no dates provided
//     if (!startDate || !endDate) {
//       const now = new Date();
//       const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

//       const yyyy = now.getFullYear();
//       const mm = String(now.getMonth() + 1).padStart(2, '0');
//       const dd = String(now.getDate()).padStart(2, '0');

//       const yyyyStart = twentyFourHoursAgo.getFullYear();
//       const mmStart = String(twentyFourHoursAgo.getMonth() + 1).padStart(
//         2,
//         '0',
//       );
//       const ddStart = String(twentyFourHoursAgo.getDate()).padStart(2, '0');
//       const hhStart = String(twentyFourHoursAgo.getHours()).padStart(2, '0');
//       const minStart = String(twentyFourHoursAgo.getMinutes()).padStart(2, '0');
//       const secStart = String(twentyFourHoursAgo.getSeconds()).padStart(2, '0');

//       const hhNow = String(now.getHours()).padStart(2, '0');
//       const minNow = String(now.getMinutes()).padStart(2, '0');
//       const secNow = String(now.getSeconds()).padStart(2, '0');

//       start = `${yyyyStart}-${mmStart}-${ddStart}T${hhStart}:${minStart}:${secStart}+05:00`;
//       end = `${yyyy}-${mm}-${dd}T${hhNow}:${minNow}:${secNow}+05:00`;
//     } else {
//       start = startDate.includes('+05:00')
//         ? startDate
//         : `${startDate}T00:00:00+05:00`;
//       end = endDate.includes('+05:00') ? endDate : `${endDate}T23:59:59+05:00`;
//     }

//     console.log(`Fetching data from ${start} to ${end}`);

//     // Parallel queries from both collections
//     const [historicData, liveData] = await Promise.all([
//       this.historicCollection
//         .find({
//           timestamp: { $gte: start, $lte: end },
//         })
//         .project({
//           timestamp: 1,
//           Genset_Total_kW: 1,
//           Predicted_Genset_Total_kW: 1,
//           Fuel_Rate: 1,
//           Predicted_Fuel_Rate: 1,
//         })
//         .sort({ timestamp: 1 })
//         .toArray(),
//       this.liveCollection
//         .find({
//           timestamp: { $gte: start, $lte: end },
//         })
//         .project({
//           timestamp: 1,
//           Genset_Total_kW: 1,
//           Predicted_Genset_Total_kW: 1,
//           Fuel_Rate: 1,
//           Predicted_Fuel_Rate: 1,
//         })
//         .sort({ timestamp: 1 })
//         .toArray(),
//     ]);

//     console.log(
//       `Found ${historicData.length} historic records, ${liveData.length} live records`,
//     );

//     // Merge data by timestamp
//     const mergedMap = new Map<string, CombinedResult>();

//     // Add historic data
//     for (let i = 0; i < historicData.length; i++) {
//       const record = historicData[i];
//       const ts = this.normalizeTimestamp(record.timestamp);
//       const { formatted, date, time } = this.formatTimestamp(record.timestamp);

//       mergedMap.set(ts, {
//         timestamp: formatted,
//         date,
//         time,
//         Genset_Total_kW_tmuaibn: record.Genset_Total_kW ?? null, // Renamed field
//         Predicted_Genset_Total_kW: record.Predicted_Genset_Total_kW ?? null,
//         Fuel_Rate_tmuaibn: record.Fuel_Rate ?? null, // Renamed field
//         Predicted_Fuel_Rate: record.Predicted_Fuel_Rate ?? null,
//         source: 'historic',
//       });
//     }

//     // Add/merge live data
//     for (let i = 0; i < liveData.length; i++) {
//       const record = liveData[i];
//       const ts = this.normalizeTimestamp(record.timestamp);
//       const existing = mergedMap.get(ts);
//       const { formatted, date, time } = this.formatTimestamp(record.timestamp);

//       if (existing) {
//         // Merge with existing historic record
//         mergedMap.set(ts, {
//           timestamp: formatted,
//           date,
//           time,
//           Genset_Total_kW_tmuaibn:
//             existing.Genset_Total_kW_tmuaibn ?? record.Genset_Total_kW ?? null, // Renamed field
//           Predicted_Genset_Total_kW:
//             existing.Predicted_Genset_Total_kW ??
//             record.Predicted_Genset_Total_kW ??
//             null,
//           Fuel_Rate_tmuaibn:
//             existing.Fuel_Rate_tmuaibn ?? record.Fuel_Rate ?? null, // Renamed field
//           Predicted_Fuel_Rate:
//             existing.Predicted_Fuel_Rate ?? record.Predicted_Fuel_Rate ?? null,
//           source: 'both',
//         });
//       } else {
//         // Add new live record
//         mergedMap.set(ts, {
//           timestamp: formatted,
//           date,
//           time,
//           Genset_Total_kW_tmuaibn: record.Genset_Total_kW ?? null, // Renamed field
//           Predicted_Genset_Total_kW: record.Predicted_Genset_Total_kW ?? null,
//           Fuel_Rate_tmuaibn: record.Fuel_Rate ?? null, // Renamed field
//           Predicted_Fuel_Rate: record.Predicted_Fuel_Rate ?? null,
//           source: 'live',
//         });
//       }
//     }

//     // Convert Map to array and sort
//     const result = Array.from(mergedMap.values());

//     if (result.length > 0) {
//       result.sort((a, b) => {
//         if (a.date !== b.date) return a.date.localeCompare(b.date);
//         return a.time.localeCompare(b.time);
//       });
//     }

//     // Count stats
//     const bothCount = result.filter((r) => r.source === 'both').length;
//     const historicCount = result.filter((r) => r.source === 'historic').length;
//     const liveCount = result.filter((r) => r.source === 'live').length;

//     console.log(
//       `Returning ${result.length} records (${bothCount} both, ${historicCount} historic-only, ${liveCount} live-only)`,
//     );

//     return result;
//   }
// }

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';

export interface CombinedResult {
  timestamp: string;
  date: string;
  time: string;
  Genset_Total_kW_tmuaibn: number | null;
  Predicted_Genset_Total_kW: number | null;
  Fuel_Rate_tmuaibn: number | null;
  Predicted_Fuel_Rate: number | null;
  source: 'historic' | 'live' | 'both';
}

@Injectable()
export class NavyDataService {
  private historicCollection: any; // rf_eng_prediction_12s_2
  private liveCollection: any; // rf_eng_prediction_temp_12s_2

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.historicCollection = this.db.collection('rf_eng_prediction_12s_2');
    this.liveCollection = this.db.collection('rf_eng_prediction_temp_12s_2');
  }

  // Convert UTC to Karachi time
  private utcToKarachi(utcDate: Date): string {
    const karachiTime = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
    return karachiTime.toISOString();
  }

  // Normalize timestamp for matching (remove milliseconds and timezone)
  private normalizeTimestamp(ts: any): string {
    if (!ts) return '';

    let dateStr: string;

    if (typeof ts === 'string') {
      dateStr = ts;
    } else if (ts instanceof Date) {
      dateStr = this.utcToKarachi(ts);
    } else if (ts && typeof ts === 'object' && ts.toISOString) {
      dateStr = this.utcToKarachi(new Date(ts));
    } else {
      dateStr = String(ts);
    }

    // Remove milliseconds and timezone for matching
    return dateStr.split('.')[0].split('+')[0];
  }

  // Format timestamp for display
  private formatTimestamp(ts: any): {
    formatted: string;
    date: string;
    time: string;
  } {
    const dateStr = this.normalizeTimestamp(ts);

    let cleanDateStr = dateStr;
    if (dateStr.includes('+05:00')) {
      cleanDateStr = dateStr.replace('+05:00', '');
    }

    const [date, timeWithOffset] = cleanDateStr.split('T');
    const time = timeWithOffset?.split('+')[0]?.split('.')[0] || '';

    const [y, m, d] = date.split('-');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[parseInt(m) - 1] || 'Jan';

    return {
      formatted: `${month} ${parseInt(d) || 1}, ${time}`,
      date,
      time,
    };
  }

  async getCombinedData(
    mode?: 'historic' | 'live' | 'both', // Updated type to include 'both'
    startDate?: string,
    endDate?: string | undefined,
  ): Promise<CombinedResult[]> {
    let start: string;
    let end: string;

    // Default to last 24 hours if no dates provided
    if (!startDate || !endDate) {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');

      const yyyyStart = twentyFourHoursAgo.getFullYear();
      const mmStart = String(twentyFourHoursAgo.getMonth() + 1).padStart(
        2,
        '0',
      );
      const ddStart = String(twentyFourHoursAgo.getDate()).padStart(2, '0');
      const hhStart = String(twentyFourHoursAgo.getHours()).padStart(2, '0');
      const minStart = String(twentyFourHoursAgo.getMinutes()).padStart(2, '0');
      const secStart = String(twentyFourHoursAgo.getSeconds()).padStart(2, '0');

      const hhNow = String(now.getHours()).padStart(2, '0');
      const minNow = String(now.getMinutes()).padStart(2, '0');
      const secNow = String(now.getSeconds()).padStart(2, '0');

      start = `${yyyyStart}-${mmStart}-${ddStart}T${hhStart}:${minStart}:${secStart}+05:00`;
      end = `${yyyy}-${mm}-${dd}T${hhNow}:${minNow}:${secNow}+05:00`;
    } else {
      start = startDate.includes('+05:00')
        ? startDate
        : `${startDate}T00:00:00+05:00`;
      end = endDate.includes('+05:00') ? endDate : `${endDate}T23:59:59+05:00`;
    }

    console.log(`Fetching data from ${start} to ${end}`);

    // Based on mode, fetch from appropriate collections
    let historicData: any[] = [];
    let liveData: any[] = [];

    // Simplified condition checks
    if (!mode || mode === 'both') {
      // Fetch both historic and live data
      [historicData, liveData] = await Promise.all([
        this.historicCollection
          .find({
            timestamp: { $gte: start, $lte: end },
          })
          .project({
            timestamp: 1,
            Genset_Total_kW: 1,
            Predicted_Genset_Total_kW: 1,
            Fuel_Rate: 1,
            Predicted_Fuel_Rate: 1,
          })
          .sort({ timestamp: 1 })
          .toArray(),
        this.liveCollection
          .find({
            timestamp: { $gte: start, $lte: end },
          })
          .project({
            timestamp: 1,
            Genset_Total_kW: 1,
            Predicted_Genset_Total_kW: 1,
            Fuel_Rate: 1,
            Predicted_Fuel_Rate: 1,
          })
          .sort({ timestamp: 1 })
          .toArray(),
      ]);
    } else if (mode === 'historic') {
      // Fetch only historic data
      historicData = await this.historicCollection
        .find({
          timestamp: { $gte: start, $lte: end },
        })
        .project({
          timestamp: 1,
          Genset_Total_kW: 1,
          Predicted_Genset_Total_kW: 1,
          Fuel_Rate: 1,
          Predicted_Fuel_Rate: 1,
        })
        .sort({ timestamp: 1 })
        .toArray();
    } else if (mode === 'live') {
      // Fetch only live data
      liveData = await this.liveCollection
        .find({
          timestamp: { $gte: start, $lte: end },
        })
        .project({
          timestamp: 1,
          Genset_Total_kW: 1,
          Predicted_Genset_Total_kW: 1,
          Fuel_Rate: 1,
          Predicted_Fuel_Rate: 1,
        })
        .sort({ timestamp: 1 })
        .toArray();
    }

    console.log(
      `Found ${historicData.length} historic records, ${liveData.length} live records`,
    );

    // Merge data by timestamp
    const mergedMap = new Map<string, CombinedResult>();

    // Add historic data
    for (let i = 0; i < historicData.length; i++) {
      const record = historicData[i];
      const ts = this.normalizeTimestamp(record.timestamp);
      const { formatted, date, time } = this.formatTimestamp(record.timestamp);

      mergedMap.set(ts, {
        timestamp: formatted,
        date,
        time,
        Genset_Total_kW_tmuaibn: record.Genset_Total_kW ?? null,
        Predicted_Genset_Total_kW: record.Predicted_Genset_Total_kW ?? null,
        Fuel_Rate_tmuaibn: record.Fuel_Rate ?? null,
        Predicted_Fuel_Rate: record.Predicted_Fuel_Rate ?? null,
        source: 'historic',
      });
    }

    // Add/merge live data
    for (let i = 0; i < liveData.length; i++) {
      const record = liveData[i];
      const ts = this.normalizeTimestamp(record.timestamp);
      const existing = mergedMap.get(ts);
      const { formatted, date, time } = this.formatTimestamp(record.timestamp);

      if (existing) {
        // Merge with existing historic record
        mergedMap.set(ts, {
          timestamp: formatted,
          date,
          time,
          Genset_Total_kW_tmuaibn:
            existing.Genset_Total_kW_tmuaibn ?? record.Genset_Total_kW ?? null,
          Predicted_Genset_Total_kW:
            existing.Predicted_Genset_Total_kW ??
            record.Predicted_Genset_Total_kW ??
            null,
          Fuel_Rate_tmuaibn:
            existing.Fuel_Rate_tmuaibn ?? record.Fuel_Rate ?? null,
          Predicted_Fuel_Rate:
            existing.Predicted_Fuel_Rate ?? record.Predicted_Fuel_Rate ?? null,
          source: 'both',
        });
      } else {
        // Add new live record
        mergedMap.set(ts, {
          timestamp: formatted,
          date,
          time,
          Genset_Total_kW_tmuaibn: record.Genset_Total_kW ?? null,
          Predicted_Genset_Total_kW: record.Predicted_Genset_Total_kW ?? null,
          Fuel_Rate_tmuaibn: record.Fuel_Rate ?? null,
          Predicted_Fuel_Rate: record.Predicted_Fuel_Rate ?? null,
          source: 'live',
        });
      }
    }

    // Convert Map to array and sort
    const result = Array.from(mergedMap.values());

    if (result.length > 0) {
      result.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
    }

    // Count stats
    const bothCount = result.filter((r) => r.source === 'both').length;
    const historicCount = result.filter((r) => r.source === 'historic').length;
    const liveCount = result.filter((r) => r.source === 'live').length;

    console.log(
      `Returning ${result.length} records (${bothCount} both, ${historicCount} historic-only, ${liveCount} live-only)`,
    );

    return result;
  }
}
