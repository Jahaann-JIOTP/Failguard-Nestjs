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
// //   Predicted_Genset_Total_kW: number | null;
// //   Predicted_Fuel_Rate: number | null;
// //   Genset_Total_kW_tmuaibn: number | null;
// //   Fuel_Rate_tmuaibn: number | null;
// //   source: 'prediction' | 'navy' | 'both';
// // }

// // @Injectable()
// // export class NavyDataService {
// //   private navyCollection: any;
// //   private tmuaibnCollection: any;
// //   private liveClients: Record<string, string> = {};
// //   private livePredictionCollection: any;

// //   // Cache only for historic mode
// //   private navyCache: Map<string, any> | null = null;
// //   private navyCachePromise: Promise<any> | null = null;

// //   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
// //     this.navyCollection = this.db.collection('rf_eng_prediction_12s_2');
// //     this.tmuaibnCollection = this.db.collection('navy_12s');
// //     this.livePredictionCollection = this.db.collection(
// //       'rf_eng_prediction_temp_12s_2',
// //     );
// //   }

// //   private generateClientId() {
// //     return Math.random().toString(36).substring(2) + Date.now().toString(36);
// //   }

// //   // 🔴 FIX 1: Convert UTC to Karachi time
// //   private utcToKarachi(utcDate: Date): string {
// //     const karachiTime = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000); // +5 hours
// //     return karachiTime.toISOString();
// //   }

// //   private timestampToString(ts: any): string {
// //     if (!ts) return '';
// //     if (typeof ts === 'string') return ts;
// //     if (ts instanceof Date) return this.utcToKarachi(ts); // Convert to Karachi
// //     if (ts && typeof ts === 'object' && ts.toISOString) {
// //       return this.utcToKarachi(new Date(ts)); // Convert to Karachi
// //     }
// //     return String(ts);
// //   }

// //   // Fast timestamp formatter - Karachi timezone
// //   private formatTimestamp(ts: any): {
// //     formatted: string;
// //     date: string;
// //     time: string;
// //   } {
// //     const dateStr = this.timestampToString(ts);

// //     // Handle Karachi timezone format
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

// //   // 🔴 FIX 2: Cache only for historic mode
// //   private async getNavyMap(
// //     mode: 'historic' | 'live',
// //   ): Promise<Map<string, any>> {
// //     // Live mode - no cache, fresh data
// //     if (mode === 'live') {
// //       const navyRecords = await this.tmuaibnCollection
// //         .find({})
// //         .project({
// //           timestampts: 1,
// //           timestamp: 1,
// //           Genset_Total_kW: 1,
// //           Fuel_Rate: 1,
// //         })
// //         .toArray();

// //       const map = new Map();
// //       navyRecords.forEach((navy: any) => {
// //         const ts = navy.timestampts || navy.timestamp;
// //         if (ts) {
// //           const tsStr = this.timestampToString(ts);
// //           map.set(tsStr, {
// //             Genset_Total_kW: navy.Genset_Total_kW,
// //             Fuel_Rate: navy.Fuel_Rate,
// //             timestamp: tsStr,
// //           });
// //         }
// //       });
// //       return map;
// //     }

// //     // Historic mode - use cache
// //     if (this.navyCache) {
// //       return this.navyCache;
// //     }

// //     if (this.navyCachePromise) {
// //       return this.navyCachePromise;
// //     }

// //     this.navyCachePromise = (async () => {
// //       const navyRecords = await this.tmuaibnCollection
// //         .find({})
// //         .project({
// //           timestampts: 1,
// //           timestamp: 1,
// //           Genset_Total_kW: 1,
// //           Fuel_Rate: 1,
// //         })
// //         .toArray();

// //       const map = new Map();
// //       navyRecords.forEach((navy: any) => {
// //         const ts = navy.timestampts || navy.timestamp;
// //         if (ts) {
// //           const tsStr = this.timestampToString(ts);
// //           map.set(tsStr, {
// //             Genset_Total_kW: navy.Genset_Total_kW,
// //             Fuel_Rate: navy.Fuel_Rate,
// //             timestamp: tsStr,
// //           });
// //         }
// //       });

// //       this.navyCache = map;
// //       this.navyCachePromise = null;
// //       return map;
// //     })();

// //     return this.navyCachePromise;
// //   }

// //   async getCombinedData(
// //     mode: 'historic' | 'live',
// //     startDate?: string,
// //     endDate?: string,
// //   ): Promise<CombinedResult[]> {
// //     let start: string;
// //     let end: string;

// //     if (mode === 'historic') {
// //       if (!startDate || !endDate) {
// //         throw new Error('start and end dates are required for historic mode');
// //       }
// //       start = startDate;
// //       end = endDate;
// //     } else {
// //       const today = new Date();
// //       const yyyy = today.getFullYear();
// //       const mm = String(today.getMonth() + 1).padStart(2, '0');
// //       const dd = String(today.getDate()).padStart(2, '0');

// //       start = `${yyyy}-${mm}-${dd}T00:00:00+05:00`;
// //       end = `${yyyy}-${mm}-${dd}T23:59:59+05:00`;
// //     }

// //     // 🔴 FIX 3: Convert start/end to Karachi time for query
// //     const startKarachi = start.includes('+05:00')
// //       ? start
// //       : `${start}T00:00:00+05:00`;
// //     const endKarachi = end.includes('+05:00') ? end : `${end}T23:59:59+05:00`;

// //     // Parallel queries - pass mode to getNavyMap
// //     const [predictions, navyMap] = await Promise.all([
// //       this.navyCollection
// //         .find({
// //           timestamp: { $gte: startKarachi, $lte: endKarachi },
// //         })
// //         .project({
// //           timestamp: 1,
// //           Predicted_Genset_Total_kW: 1,
// //           Predicted_Fuel_Rate: 1,
// //         })
// //         .sort({ timestamp: 1 })
// //         .toArray(),
// //       this.getNavyMap(mode), // 🔴 FIX 4: Pass mode to control caching
// //     ]);

// //     const startDateStr = start.split('T')[0];
// //     const endDateStr = end.split('T')[0];

// //     // Track added timestamps
// //     const addedTimestamps = new Set<string>();
// //     const result: CombinedResult[] = [];

// //     // Add all predictions first
// //     for (let i = 0; i < predictions.length; i++) {
// //       const pred = predictions[i];
// //       const ts = this.timestampToString(pred.timestamp);
// //       const navy = navyMap.get(ts);

// //       const { formatted, date, time } = this.formatTimestamp(ts);

// //       addedTimestamps.add(ts);
// //       result.push({
// //         timestamp: formatted,
// //         date,
// //         time,
// //         Predicted_Genset_Total_kW: pred.Predicted_Genset_Total_kW,
// //         Predicted_Fuel_Rate: pred.Predicted_Fuel_Rate,
// //         Genset_Total_kW_tmuaibn: navy?.Genset_Total_kW ?? null,
// //         Fuel_Rate_tmuaibn: navy?.Fuel_Rate ?? null,
// //         source: navy ? 'both' : 'prediction',
// //       });
// //     }

// //     // Add navy-only records
// //     if (navyMap.size > 0) {
// //       const navyEntries = Array.from(navyMap.entries());
// //       for (let i = 0; i < navyEntries.length; i++) {
// //         const [ts, navy] = navyEntries[i];
// //         const dateStr = ts.split('T')[0];

// //         if (
// //           dateStr >= startDateStr &&
// //           dateStr <= endDateStr &&
// //           !addedTimestamps.has(ts)
// //         ) {
// //           const { formatted, date, time } = this.formatTimestamp(ts);

// //           result.push({
// //             timestamp: formatted,
// //             date,
// //             time,
// //             Predicted_Genset_Total_kW: null,
// //             Predicted_Fuel_Rate: null,
// //             Genset_Total_kW_tmuaibn: navy.Genset_Total_kW,
// //             Fuel_Rate_tmuaibn: navy.Fuel_Rate,
// //             source: 'navy',
// //           });

// //           addedTimestamps.add(ts);
// //         }
// //       }
// //     }

// //     // Sort by date and time
// //     if (result.length > 0) {
// //       result.sort((a, b) => {
// //         if (a.date !== b.date) return a.date.localeCompare(b.date);
// //         return a.time.localeCompare(b.time);
// //       });
// //     }

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
//   Predicted_Genset_Total_kW: number | null;
//   Predicted_Fuel_Rate: number | null;
//   Genset_Total_kW_tmuaibn: number | null;
//   Fuel_Rate_tmuaibn: number | null;
//   source: 'prediction' | 'navy' | 'both';
// }

// @Injectable()
// export class NavyDataService {
//   private navyCollection: any; // Historic predictions
//   private tmuaibnCollection: any; // Navy actual data
//   private livePredictionCollection: any; // LIVE predictions collection
//   private liveClients: Record<string, string> = {};

//   // Cache only for historic mode
//   private navyCache: Map<string, any> | null = null;
//   private navyCachePromise: Promise<any> | null = null;

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.navyCollection = this.db.collection('rf_eng_prediction_12s_2');
//     this.tmuaibnCollection = this.db.collection('navy_12s');
//     this.livePredictionCollection = this.db.collection(
//       'rf_eng_prediction_temp_12s_2',
//     );
//   }

//   private generateClientId() {
//     return Math.random().toString(36).substring(2) + Date.now().toString(36);
//   }

//   // Convert UTC to Karachi time
//   private utcToKarachi(utcDate: Date): string {
//     const karachiTime = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000);
//     return karachiTime.toISOString();
//   }

//   private timestampToString(ts: any): string {
//     if (!ts) return '';
//     if (typeof ts === 'string') return ts;
//     if (ts instanceof Date) return this.utcToKarachi(ts);
//     if (ts && typeof ts === 'object' && ts.toISOString) {
//       return this.utcToKarachi(new Date(ts));
//     }
//     return String(ts);
//   }

//   private formatTimestamp(ts: any): {
//     formatted: string;
//     date: string;
//     time: string;
//   } {
//     const dateStr = this.timestampToString(ts);

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

//   private async getNavyMap(
//     mode: 'historic' | 'live',
//     startKarachi?: string,
//     endKarachi?: string,
//   ): Promise<Map<string, any>> {
//     // 🔴 FIX: Live mode - sirf last 1 hour ka navy data
//     if (mode === 'live') {
//       console.log(
//         `🔴 Live mode: Fetching navy data from ${startKarachi} to ${endKarachi}`,
//       );

//       const query: any = {};
//       if (startKarachi && endKarachi) {
//         query.timestamp = { $gte: startKarachi, $lte: endKarachi };
//       }

//       const navyRecords = await this.tmuaibnCollection
//         .find(query)
//         .project({
//           timestampts: 1,
//           timestamp: 1,
//           Genset_Total_kW: 1,
//           Fuel_Rate: 1,
//         })
//         .toArray();

//       console.log(`Found ${navyRecords.length} navy records for live mode`);

//       const map = new Map();
//       navyRecords.forEach((navy: any) => {
//         const ts = navy.timestampts || navy.timestamp;
//         if (ts) {
//           const tsStr = this.timestampToString(ts);
//           map.set(tsStr, {
//             Genset_Total_kW: navy.Genset_Total_kW,
//             Fuel_Rate: navy.Fuel_Rate,
//             timestamp: tsStr,
//           });
//         }
//       });
//       return map;
//     }

//     // Historic mode - full cache
//     console.log('📜 Historic mode: Using cached navy data');
//     if (this.navyCache) {
//       return this.navyCache;
//     }

//     if (this.navyCachePromise) {
//       return this.navyCachePromise;
//     }

//     this.navyCachePromise = (async () => {
//       const navyRecords = await this.tmuaibnCollection
//         .find({})
//         .project({
//           timestampts: 1,
//           timestamp: 1,
//           Genset_Total_kW: 1,
//           Fuel_Rate: 1,
//         })
//         .toArray();

//       const map = new Map();
//       navyRecords.forEach((navy: any) => {
//         const ts = navy.timestampts || navy.timestamp;
//         if (ts) {
//           const tsStr = this.timestampToString(ts);
//           map.set(tsStr, {
//             Genset_Total_kW: navy.Genset_Total_kW,
//             Fuel_Rate: navy.Fuel_Rate,
//             timestamp: tsStr,
//           });
//         }
//       });

//       this.navyCache = map;
//       this.navyCachePromise = null;
//       return map;
//     })();

//     return this.navyCachePromise;
//   }

//   async getCombinedData(
//     mode: 'historic' | 'live',
//     startDate?: string,
//     endDate?: string,
//   ): Promise<CombinedResult[]> {
//     let start: string;
//     let end: string;
//     let predictionCollection: any;

//     if (mode === 'historic') {
//       if (!startDate || !endDate) {
//         throw new Error('start and end dates are required for historic mode');
//       }
//       start = startDate;
//       end = endDate;
//       predictionCollection = this.navyCollection;
//       console.log('📜 Using historic predictions collection');
//     } else {
//       // Last 1 hour for live mode
//       const now = new Date();
//       const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

//       const yyyy = now.getFullYear();
//       const mm = String(now.getMonth() + 1).padStart(2, '0');
//       const dd = String(now.getDate()).padStart(2, '0');

//       const yyyyStart = oneHourAgo.getFullYear();
//       const mmStart = String(oneHourAgo.getMonth() + 1).padStart(2, '0');
//       const ddStart = String(oneHourAgo.getDate()).padStart(2, '0');
//       const hhStart = String(oneHourAgo.getHours()).padStart(2, '0');
//       const minStart = String(oneHourAgo.getMinutes()).padStart(2, '0');
//       const secStart = String(oneHourAgo.getSeconds()).padStart(2, '0');

//       const hhNow = String(now.getHours()).padStart(2, '0');
//       const minNow = String(now.getMinutes()).padStart(2, '0');
//       const secNow = String(now.getSeconds()).padStart(2, '0');

//       start = `${yyyyStart}-${mmStart}-${ddStart}T${hhStart}:${minStart}:${secStart}+05:00`;
//       end = `${yyyy}-${mm}-${dd}T${hhNow}:${minNow}:${secNow}+05:00`;

//       predictionCollection = this.livePredictionCollection;
//       console.log(
//         `🔴 Using LIVE predictions collection from ${start} to ${end}`,
//       );
//     }

//     // Convert start/end to Karachi time for query
//     const startKarachi = start.includes('+05:00')
//       ? start
//       : `${start}T00:00:00+05:00`;
//     const endKarachi = end.includes('+05:00') ? end : `${end}T23:59:59+05:00`;

//     // 🔴 FIX: Pass time range to getNavyMap for live mode
//     const [predictions, navyMap] = await Promise.all([
//       predictionCollection
//         .find({
//           timestamp: { $gte: startKarachi, $lte: endKarachi },
//         })
//         .project({
//           timestamp: 1,
//           Predicted_Genset_Total_kW: 1,
//           Predicted_Fuel_Rate: 1,
//         })
//         .sort({ timestamp: 1 })
//         .toArray(),
//       this.getNavyMap(mode, startKarachi, endKarachi), // 🔴 Pass time range
//     ]);

//     console.log(
//       `Found ${predictions.length} predictions, ${navyMap.size} navy records`,
//     );

//     const startDateStr = start.split('T')[0];
//     const endDateStr = end.split('T')[0];

//     const addedTimestamps = new Set<string>();
//     const result: CombinedResult[] = [];

//     // Add all predictions first
//     for (let i = 0; i < predictions.length; i++) {
//       const pred = predictions[i];
//       const ts = this.timestampToString(pred.timestamp);
//       const navy = navyMap.get(ts);

//       const { formatted, date, time } = this.formatTimestamp(ts);

//       addedTimestamps.add(ts);
//       result.push({
//         timestamp: formatted,
//         date,
//         time,
//         Predicted_Genset_Total_kW: pred.Predicted_Genset_Total_kW,
//         Predicted_Fuel_Rate: pred.Predicted_Fuel_Rate,
//         Genset_Total_kW_tmuaibn: navy?.Genset_Total_kW ?? null,
//         Fuel_Rate_tmuaibn: navy?.Fuel_Rate ?? null,
//         source: navy ? 'both' : 'prediction',
//       });
//     }

//     // Add navy-only records
//     if (navyMap.size > 0) {
//       const navyEntries = Array.from(navyMap.entries());
//       for (let i = 0; i < navyEntries.length; i++) {
//         const [ts, navy] = navyEntries[i];
//         const dateStr = ts.split('T')[0];

//         if (
//           dateStr >= startDateStr &&
//           dateStr <= endDateStr &&
//           !addedTimestamps.has(ts)
//         ) {
//           const { formatted, date, time } = this.formatTimestamp(ts);

//           result.push({
//             timestamp: formatted,
//             date,
//             time,
//             Predicted_Genset_Total_kW: null,
//             Predicted_Fuel_Rate: null,
//             Genset_Total_kW_tmuaibn: navy.Genset_Total_kW,
//             Fuel_Rate_tmuaibn: navy.Fuel_Rate,
//             source: 'navy',
//           });

//           addedTimestamps.add(ts);
//         }
//       }
//     }

//     // Sort by date and time
//     if (result.length > 0) {
//       result.sort((a, b) => {
//         if (a.date !== b.date) return a.date.localeCompare(b.date);
//         return a.time.localeCompare(b.time);
//       });
//     }

//     console.log(`Returning ${result.length} records for ${mode} mode`);
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
  Predicted_Genset_Total_kW: number | null;
  Predicted_Fuel_Rate: number | null;
  Genset_Total_kW_tmuaibn: number | null;
  Fuel_Rate_tmuaibn: number | null;
  source: 'prediction' | 'navy' | 'both';
}

@Injectable()
export class NavyDataService {
  private navyCollection: any; // Historic predictions
  private tmuaibnCollection: any; // Navy actual data
  private livePredictionCollection: any; // LIVE predictions collection
  private liveClients: Record<string, string> = {};

  // Cache only for historic mode
  private navyCache: Map<string, any> | null = null;
  private navyCachePromise: Promise<any> | null = null;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.navyCollection = this.db.collection('rf_eng_prediction_12s_2');
    this.tmuaibnCollection = this.db.collection('navy_12s');
    this.livePredictionCollection = this.db.collection(
      'rf_eng_prediction_temp_12s_2',
    );
  }

  private generateClientId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
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

  private timestampToString(ts: any): string {
    return this.normalizeTimestamp(ts);
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

  private async getNavyMap(
    mode: 'historic' | 'live',
    startKarachi?: string,
    endKarachi?: string,
  ): Promise<Map<string, any>> {
    // Live mode - sirf last 1 hour ka navy data
    if (mode === 'live') {
      console.log(
        `🔴 Live mode: Fetching navy data from ${startKarachi} to ${endKarachi}`,
      );

      const query: any = {};
      if (startKarachi && endKarachi) {
        query.$or = [
          { timestamp: { $gte: startKarachi, $lte: endKarachi } },
          { timestampts: { $gte: startKarachi, $lte: endKarachi } },
        ];
      }

      const navyRecords = await this.tmuaibnCollection
        .find(query)
        .project({
          timestampts: 1,
          timestamp: 1,
          Genset_Total_kW: 1,
          Fuel_Rate: 1,
        })
        .toArray();

      console.log(`Found ${navyRecords.length} navy records for live mode`);

      const map = new Map();
      navyRecords.forEach((navy: any) => {
        const ts = navy.timestampts || navy.timestamp;
        if (ts) {
          const tsStr = this.normalizeTimestamp(ts);
          map.set(tsStr, {
            Genset_Total_kW: navy.Genset_Total_kW,
            Fuel_Rate: navy.Fuel_Rate,
            timestamp: tsStr,
          });
        }
      });

      console.log(`Created map with ${map.size} unique timestamps`);
      return map;
    }

    // Historic mode - full cache
    console.log('📜 Historic mode: Using cached navy data');
    if (this.navyCache) {
      return this.navyCache;
    }

    if (this.navyCachePromise) {
      return this.navyCachePromise;
    }

    this.navyCachePromise = (async () => {
      const navyRecords = await this.tmuaibnCollection
        .find({})
        .project({
          timestampts: 1,
          timestamp: 1,
          Genset_Total_kW: 1,
          Fuel_Rate: 1,
        })
        .toArray();

      const map = new Map();
      navyRecords.forEach((navy: any) => {
        const ts = navy.timestampts || navy.timestamp;
        if (ts) {
          const tsStr = this.normalizeTimestamp(ts);
          map.set(tsStr, {
            Genset_Total_kW: navy.Genset_Total_kW,
            Fuel_Rate: navy.Fuel_Rate,
            timestamp: tsStr,
          });
        }
      });

      this.navyCache = map;
      this.navyCachePromise = null;
      return map;
    })();

    return this.navyCachePromise;
  }

  async getCombinedData(
    mode: 'historic' | 'live',
    startDate?: string,
    endDate?: string,
  ): Promise<CombinedResult[]> {
    let start: string;
    let end: string;
    let predictionCollection: any;

    if (mode === 'historic') {
      if (!startDate || !endDate) {
        throw new Error('start and end dates are required for historic mode');
      }
      start = startDate;
      end = endDate;
      predictionCollection = this.navyCollection;
      console.log('📜 Using historic predictions collection');
    } else {
      // Last 1 hour for live mode
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');

      const yyyyStart = oneHourAgo.getFullYear();
      const mmStart = String(oneHourAgo.getMonth() + 1).padStart(2, '0');
      const ddStart = String(oneHourAgo.getDate()).padStart(2, '0');
      const hhStart = String(oneHourAgo.getHours()).padStart(2, '0');
      const minStart = String(oneHourAgo.getMinutes()).padStart(2, '0');
      const secStart = String(oneHourAgo.getSeconds()).padStart(2, '0');

      const hhNow = String(now.getHours()).padStart(2, '0');
      const minNow = String(now.getMinutes()).padStart(2, '0');
      const secNow = String(now.getSeconds()).padStart(2, '0');

      start = `${yyyyStart}-${mmStart}-${ddStart}T${hhStart}:${minStart}:${secStart}+05:00`;
      end = `${yyyy}-${mm}-${dd}T${hhNow}:${minNow}:${secNow}+05:00`;

      predictionCollection = this.livePredictionCollection;
      console.log(
        `🔴 Using LIVE predictions collection from ${start} to ${end}`,
      );
    }

    // Convert start/end to Karachi time for query
    const startKarachi = start.includes('+05:00')
      ? start
      : `${start}T00:00:00+05:00`;
    const endKarachi = end.includes('+05:00') ? end : `${end}T23:59:59+05:00`;

    // Parallel queries
    const [predictions, navyMap] = await Promise.all([
      predictionCollection
        .find({
          timestamp: { $gte: startKarachi, $lte: endKarachi },
        })
        .project({
          timestamp: 1,
          Predicted_Genset_Total_kW: 1,
          Predicted_Fuel_Rate: 1,
        })
        .sort({ timestamp: 1 })
        .toArray(),
      this.getNavyMap(mode, startKarachi, endKarachi),
    ]);

    console.log(
      `Found ${predictions.length} predictions, ${navyMap.size} navy records`,
    );

    const startDateStr = start.split('T')[0];
    const endDateStr = end.split('T')[0];

    // 🔴 FIX: Use Map to merge data by timestamp
    const mergedMap = new Map<string, CombinedResult>();

    // First add all predictions
    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      const predTs = this.normalizeTimestamp(pred.timestamp);
      const navy = navyMap.get(predTs);

      const { formatted, date, time } = this.formatTimestamp(pred.timestamp);

      mergedMap.set(predTs, {
        timestamp: formatted,
        date,
        time,
        Predicted_Genset_Total_kW: pred.Predicted_Genset_Total_kW,
        Predicted_Fuel_Rate: pred.Predicted_Fuel_Rate,
        Genset_Total_kW_tmuaibn: navy?.Genset_Total_kW ?? null,
        Fuel_Rate_tmuaibn: navy?.Fuel_Rate ?? null,
        source: navy ? 'both' : 'prediction',
      });
    }

    // Then add navy-only records (that weren't in predictions)
    if (navyMap.size > 0) {
      const navyEntries = Array.from(navyMap.entries());
      for (let i = 0; i < navyEntries.length; i++) {
        const [ts, navy] = navyEntries[i];
        const dateStr = ts.split('T')[0];

        if (
          dateStr >= startDateStr &&
          dateStr <= endDateStr &&
          !mergedMap.has(ts) // Only add if not already present
        ) {
          const { formatted, date, time } = this.formatTimestamp(ts);

          mergedMap.set(ts, {
            timestamp: formatted,
            date,
            time,
            Predicted_Genset_Total_kW: null,
            Predicted_Fuel_Rate: null,
            Genset_Total_kW_tmuaibn: navy.Genset_Total_kW,
            Fuel_Rate_tmuaibn: navy.Fuel_Rate,
            source: 'navy',
          });
        }
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
    const predCount = result.filter((r) => r.source === 'prediction').length;
    const navyOnlyCount = result.filter((r) => r.source === 'navy').length;

    console.log(
      `Returning ${result.length} records for ${mode} mode (${bothCount} both, ${predCount} pred-only, ${navyOnlyCount} navy-only)`,
    );
    return result;
  }
}
