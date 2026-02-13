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
//   private navyCollection: any;
//   private tmuaibnCollection: any;
//   private liveClients: Record<string, string> = {};
//   private livePredictionCollection: any;

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.navyCollection = this.db.collection('rf_eng_prediction_12s_2');
//     this.tmuaibnCollection = this.db.collection('navy');
//     this.livePredictionCollection = this.db.collection(
//       'rf_eng_prediction_temp_12s_2',
//     );
//   }

//   private generateClientId() {
//     return Math.random().toString(36).substring(2) + Date.now().toString(36);
//   }

//   private formatTimestamp(ts: any): {
//     formatted: string;
//     date: string;
//     time: string;
//   } {
//     try {
//       let dateObj: Date;
//       let dateStr: string;

//       if (ts instanceof Date) {
//         dateObj = ts;
//         dateStr = dateObj.toISOString();
//       } else if (typeof ts === 'string') {
//         dateObj = new Date(ts);
//         dateStr = ts;
//       } else if (ts && typeof ts === 'object' && ts.toISOString) {
//         dateObj = new Date(ts);
//         dateStr = dateObj.toISOString();
//       } else {
//         dateObj = new Date();
//         dateStr = dateObj.toISOString();
//       }

//       const formatted = dateObj
//         .toLocaleString('en-US', {
//           month: 'short',
//           day: '2-digit',
//           hour: '2-digit',
//           minute: '2-digit',
//           second: '2-digit',
//           hour12: false,
//           timeZone: 'Asia/Karachi',
//         })
//         .replace(',', '');

//       let date = '';
//       let time = '';

//       if (dateStr && typeof dateStr === 'string') {
//         const parts = dateStr.split('T');
//         date = parts[0] || '';
//         time = parts[1] ? parts[1].split('+')[0]?.split('.')[0] || '' : '';
//       } else {
//         date = dateObj.toISOString().split('T')[0];
//         time = dateObj.toISOString().split('T')[1]?.split('.')[0] || '';
//       }

//       return { formatted, date, time };
//     } catch (error) {
//       const now = new Date();
//       return {
//         formatted: now
//           .toLocaleString('en-US', {
//             month: 'short',
//             day: '2-digit',
//             hour: '2-digit',
//             minute: '2-digit',
//             second: '2-digit',
//             hour12: false,
//           })
//           .replace(',', ''),
//         date: now.toISOString().split('T')[0],
//         time: now.toISOString().split('T')[1]?.split('.')[0] || '',
//       };
//     }
//   }

//   async getCombinedData(
//     mode: 'historic' | 'live',
//     startDate?: string,
//     endDate?: string,
//   ): Promise<CombinedResult[]> {
//     let start: string;
//     let end: string;

//     if (mode === 'historic') {
//       if (!startDate || !endDate) {
//         throw new Error('start and end dates are required for historic mode');
//       }
//       start = startDate;
//       end = endDate;
//     } else {
//       const today = new Date();
//       const yyyy = today.getFullYear();
//       const mm = String(today.getMonth() + 1).padStart(2, '0');
//       const dd = String(today.getDate()).padStart(2, '0');

//       start = `${yyyy}-${mm}-${dd}T00:00:00+05:00`;
//       end = `${yyyy}-${mm}-${dd}T23:59:59+05:00`;
//     }

//     // 🔴 STEP 1: Get ALL predictions in range
//     let predictions: any[] = [];
//     try {
//       predictions = await this.navyCollection
//         .find({
//           timestamp: { $gte: start, $lte: end },
//         })
//         .project({
//           timestamp: 1,
//           Predicted_Genset_Total_kW: 1,
//           Predicted_Fuel_Rate: 1,
//         })
//         .sort({ timestamp: 1 })
//         .toArray();
//     } catch (error) {
//       // Silently handle error
//     }

//     // 🔴 STEP 2: Get ALL navy records (full collection)
//     let navyRecords: any[] = [];
//     try {
//       navyRecords = await this.tmuaibnCollection
//         .find({})
//         .project({
//           timestampts: 1,
//           timestamp: 1,
//           Genset_Total_kW: 1,
//           Fuel_Rate: 1,
//         })
//         .sort({ timestampts: 1, timestamp: 1 })
//         .toArray();
//     } catch (error) {
//       // Silently handle error
//     }

//     // 🔴 STEP 3: Create map of all records
//     const resultMap = new Map<string, CombinedResult>();

//     // Add all predictions
//     predictions.forEach((pred) => {
//       try {
//         const ts = pred.timestamp;
//         const { formatted, date, time } = this.formatTimestamp(ts);
//         const key = typeof ts === 'string' ? ts : new Date(ts).toISOString();

//         resultMap.set(key, {
//           timestamp: formatted,
//           date,
//           time,
//           Predicted_Genset_Total_kW: pred.Predicted_Genset_Total_kW,
//           Predicted_Fuel_Rate: pred.Predicted_Fuel_Rate,
//           Genset_Total_kW_tmuaibn: null,
//           Fuel_Rate_tmuaibn: null,
//           source: 'prediction',
//         });
//       } catch (error) {
//         // Silently handle error
//       }
//     });

//     // Add all navy records
//     navyRecords.forEach((navy) => {
//       try {
//         const ts = navy.timestampts || navy.timestamp;
//         const { formatted, date, time } = this.formatTimestamp(ts);
//         const key = typeof ts === 'string' ? ts : new Date(ts).toISOString();

//         if (resultMap.has(key)) {
//           const existing = resultMap.get(key)!;
//           existing.Genset_Total_kW_tmuaibn = navy.Genset_Total_kW;
//           existing.Fuel_Rate_tmuaibn = navy.Fuel_Rate;
//           existing.source = 'both';
//           resultMap.set(key, existing);
//         } else {
//           resultMap.set(key, {
//             timestamp: formatted,
//             date,
//             time,
//             Predicted_Genset_Total_kW: null,
//             Predicted_Fuel_Rate: null,
//             Genset_Total_kW_tmuaibn: navy.Genset_Total_kW,
//             Fuel_Rate_tmuaibn: navy.Fuel_Rate,
//             source: 'navy',
//           });
//         }
//       } catch (error) {
//         // Silently handle error
//       }
//     });

//     // 🔴 STEP 4: Filter by requested date range
//     const startDateStr = start.split('T')[0];
//     const endDateStr = end.split('T')[0];

//     const result = Array.from(resultMap.values())
//       .filter((item) => {
//         return item.date >= startDateStr && item.date <= endDateStr;
//       })
//       .sort((a, b) => {
//         if (a.date !== b.date) return a.date.localeCompare(b.date);
//         return a.time.localeCompare(b.time);
//       });

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
  private navyCollection: any;
  private tmuaibnCollection: any;
  private liveClients: Record<string, string> = {};
  private livePredictionCollection: any;

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

  // 🔴 FIX 1: Convert UTC to Karachi time
  private utcToKarachi(utcDate: Date): string {
    const karachiTime = new Date(utcDate.getTime() + 5 * 60 * 60 * 1000); // +5 hours
    return karachiTime.toISOString();
  }

  private timestampToString(ts: any): string {
    if (!ts) return '';
    if (typeof ts === 'string') return ts;
    if (ts instanceof Date) return this.utcToKarachi(ts); // Convert to Karachi
    if (ts && typeof ts === 'object' && ts.toISOString) {
      return this.utcToKarachi(new Date(ts)); // Convert to Karachi
    }
    return String(ts);
  }

  // Fast timestamp formatter - Karachi timezone
  private formatTimestamp(ts: any): {
    formatted: string;
    date: string;
    time: string;
  } {
    const dateStr = this.timestampToString(ts);

    // Handle Karachi timezone format
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

  // 🔴 FIX 2: Cache only for historic mode
  private async getNavyMap(
    mode: 'historic' | 'live',
  ): Promise<Map<string, any>> {
    // Live mode - no cache, fresh data
    if (mode === 'live') {
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
          const tsStr = this.timestampToString(ts);
          map.set(tsStr, {
            Genset_Total_kW: navy.Genset_Total_kW,
            Fuel_Rate: navy.Fuel_Rate,
            timestamp: tsStr,
          });
        }
      });
      return map;
    }

    // Historic mode - use cache
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
          const tsStr = this.timestampToString(ts);
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

    if (mode === 'historic') {
      if (!startDate || !endDate) {
        throw new Error('start and end dates are required for historic mode');
      }
      start = startDate;
      end = endDate;
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');

      start = `${yyyy}-${mm}-${dd}T00:00:00+05:00`;
      end = `${yyyy}-${mm}-${dd}T23:59:59+05:00`;
    }

    // 🔴 FIX 3: Convert start/end to Karachi time for query
    const startKarachi = start.includes('+05:00')
      ? start
      : `${start}T00:00:00+05:00`;
    const endKarachi = end.includes('+05:00') ? end : `${end}T23:59:59+05:00`;

    // Parallel queries - pass mode to getNavyMap
    const [predictions, navyMap] = await Promise.all([
      this.navyCollection
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
      this.getNavyMap(mode), // 🔴 FIX 4: Pass mode to control caching
    ]);

    const startDateStr = start.split('T')[0];
    const endDateStr = end.split('T')[0];

    // Track added timestamps
    const addedTimestamps = new Set<string>();
    const result: CombinedResult[] = [];

    // Add all predictions first
    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      const ts = this.timestampToString(pred.timestamp);
      const navy = navyMap.get(ts);

      const { formatted, date, time } = this.formatTimestamp(ts);

      addedTimestamps.add(ts);
      result.push({
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

    // Add navy-only records
    if (navyMap.size > 0) {
      const navyEntries = Array.from(navyMap.entries());
      for (let i = 0; i < navyEntries.length; i++) {
        const [ts, navy] = navyEntries[i];
        const dateStr = ts.split('T')[0];

        if (
          dateStr >= startDateStr &&
          dateStr <= endDateStr &&
          !addedTimestamps.has(ts)
        ) {
          const { formatted, date, time } = this.formatTimestamp(ts);

          result.push({
            timestamp: formatted,
            date,
            time,
            Predicted_Genset_Total_kW: null,
            Predicted_Fuel_Rate: null,
            Genset_Total_kW_tmuaibn: navy.Genset_Total_kW,
            Fuel_Rate_tmuaibn: navy.Fuel_Rate,
            source: 'navy',
          });

          addedTimestamps.add(ts);
        }
      }
    }

    // Sort by date and time
    if (result.length > 0) {
      result.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
    }

    return result;
  }
}
