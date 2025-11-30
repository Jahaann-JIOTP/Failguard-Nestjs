// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from 'src/trends/formulas.service';

// @Injectable()
// export class ReportsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('navy_gen_on');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   private formatTimestamp(value: any): string {
//     if (!value) return '';
//     const date = new Date(value);
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const seconds = date.getSeconds().toString().padStart(2, '0');
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   }

//   // async getFuelReport(payload: {
//   //   startDate: string;
//   //   endDate: string;
//   //   fuelCostPerLitre: number;
//   // }) {
//   //   const { startDate, endDate, fuelCostPerLitre } = payload;

//   //   if (!startDate || !endDate)
//   //     throw new Error('startDate and endDate are required');

//   //   const sampleDoc = await this.collection.findOne(
//   //     {},
//   //     { projection: { timestamp: 1 } },
//   //   );
//   //   const isTimestampString =
//   //     sampleDoc && typeof sampleDoc.timestamp === 'string';

//   //   // 🔹 Generate all dates between start and end
//   //   const days: string[] = [];
//   //   let current = new Date(startDate);
//   //   const end = new Date(endDate);

//   //   while (current <= end) {
//   //     days.push(current.toISOString().split('T')[0]);
//   //     current.setDate(current.getDate() + 1);
//   //   }

//   //   const allRows: any[] = [];

//   //   for (const day of days) {
//   //     const dayStart = new Date(`${day}T00:00:00Z`);
//   //     const dayEnd = new Date(`${day}T23:59:59Z`);

//   //     const query = isTimestampString
//   //       ? {
//   //           timestamp: {
//   //             $gte: dayStart.toISOString(),
//   //             $lte: dayEnd.toISOString(),
//   //           },
//   //         }
//   //       : { timestamp: { $gte: dayStart, $lte: dayEnd } };

//   //     // ⭐ Correct Projection — Required Tags Added
//   //     const docs = await this.collection
//   //       .find(query, {
//   //         projection: {
//   //           timestamp: 1,
//   //           Genset_Run_SS: 1,
//   //           Load_Percent: 1,

//   //           // ⭐ Required fields for last – first formula
//   //           Total_Fuel_Consumption_calculated: 1,
//   //           Engine_Running_Time_calculated: 1,
//   //           // Load % k liye
//   //           Genset_Total_kW: 1,
//   //           Genset_Application_kW_Rating_PC2X: 1,
//   //         },
//   //       })
//   //       .sort({ timestamp: 1 })
//   //       .toArray();

//   //     if (!docs.length) continue;

//   //     const data = docs.map((d) => ({
//   //       ...d,
//   //       timestamp: this.formatTimestamp(d.timestamp),
//   //     }));

//   //     // ⭐ No fuelData now — only merge load%
//   //     const merged = data.map((doc) => ({
//   //       ...doc,
//   //       Load_Percent: this.formulasService.calculateLoadPercent(doc),
//   //       time: doc.timestamp,
//   //     }));

//   //     const dailyRows = this.processIntervals(merged, fuelCostPerLitre, day);
//   //     allRows.push(...dailyRows);
//   //   }

//   //   return allRows.length
//   //     ? allRows
//   //     : [{ message: 'No data found for selected dates' }];
//   // }

//   // private processIntervals(
//   //   merged: any[],
//   //   fuelCostPerLitre: number,
//   //   date: string,
//   // ) {
//   //   const intervals: any[] = [];
//   //   let currentInterval: any[] = [];

//   //   // Interval grouping based on Genset_Run_SS
//   //   for (const record of merged) {
//   //     if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
//   //       currentInterval.push(record);
//   //     } else if (currentInterval.length > 0) {
//   //       intervals.push(currentInterval);
//   //       currentInterval = [];
//   //     }
//   //   }
//   //   if (currentInterval.length > 0) intervals.push(currentInterval);

//   //   const rows: any[] = [];

//   //   for (const interval of intervals) {
//   //     const first = interval[0];
//   //     const last = interval[interval.length - 1];

//   //     const startDateObj = new Date(first.time);
//   //     const endDateObj = new Date(last.time);

//   //     // Run Hours
//   //     const durationMins =
//   //       (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
//   //     const runHours = +(durationMins / 60).toFixed(2);

//   //     // ⭐ Fuel = last - first (Correct Tag)
//   //     const fuelConsumed = +(
//   //       (last.Total_Fuel_Consumption_calculated ?? 0) -
//   //       (first.Total_Fuel_Consumption_calculated ?? 0)
//   //     ).toFixed(2);

//   //     // ⭐ Production = last - first (Correct Tag)
//   //     const production = +(
//   //       (last.Engine_Running_Time_calculated ?? 0) -
//   //       (first.Engine_Running_Time_calculated ?? 0)
//   //     ).toFixed(2);

//   //     // Avg Load
//   //     const avgLoad =
//   //       interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
//   //       (interval.length || 1);

//   //     // Cost
//   //     const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
//   //     const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//   //     const formatTime = (d: Date) =>
//   //       `${d.getHours().toString().padStart(2, '0')}:${d
//   //         .getMinutes()
//   //         .toString()
//   //         .padStart(2, '0')}`;

//   //     rows.push({
//   //       Date: date,
//   //       Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
//   //       Run_Hours: runHours,
//   //       Fuel_Consumed: `${fuelConsumed} Ltrs`,
//   //       Production: `${production} kWh`,
//   //       Load_Percent: +avgLoad.toFixed(2),
//   //       Cost: cost,
//   //       CostPerUnit: costPerUnit,
//   //       TotalCost: cost,
//   //     });
//   //   }

//   //   return rows;
//   // }

//   async getFuelReport(payload: {
//     startDate: string;
//     endDate: string;
//     fuelCostPerLitre: number;
//   }) {
//     const { startDate, endDate, fuelCostPerLitre } = payload;

//     if (!startDate || !endDate)
//       throw new Error('startDate and endDate are required');

//     const sampleDoc = await this.collection.findOne(
//       {},
//       { projection: { timestamp: 1 } },
//     );
//     const isTimestampString =
//       sampleDoc && typeof sampleDoc.timestamp === 'string';

//     // 🔹 Generate all dates between start and end
//     const days: string[] = [];
//     let current = new Date(startDate);
//     const end = new Date(endDate);

//     while (current <= end) {
//       days.push(current.toISOString().split('T')[0]);
//       current.setDate(current.getDate() + 1);
//     }

//     const allRows: any[] = [];
//     let cumulativeProduction = 0; // <-- cumulative production across days

//     for (const day of days) {
//       const dayStart = new Date(`${day}T00:00:00Z`);
//       const dayEnd = new Date(`${day}T23:59:59Z`);

//       const query = isTimestampString
//         ? {
//             timestamp: {
//               $gte: dayStart.toISOString(),
//               $lte: dayEnd.toISOString(),
//             },
//           }
//         : { timestamp: { $gte: dayStart, $lte: dayEnd } };

//       const docs = await this.collection
//         .find(query, {
//           projection: {
//             timestamp: 1,
//             Genset_Run_SS: 1,
//             Load_Percent: 1,
//             Total_Fuel_Consumption_calculated: 1,
//             Engine_Running_Time_calculated: 1,
//             Genset_Total_kW: 1,
//             Genset_Application_kW_Rating_PC2X: 1,
//           },
//         })
//         .sort({ timestamp: 1 })
//         .toArray();

//       if (!docs.length) continue;

//       const data = docs.map((d) => ({
//         ...d,
//         timestamp: this.formatTimestamp(d.timestamp),
//       }));

//       const merged = data.map((doc) => ({
//         ...doc,
//         Load_Percent: this.formulasService.calculateLoadPercent(doc),
//         time: doc.timestamp,
//       }));

//       const dailyRows = this.processIntervals(merged, fuelCostPerLitre, day);

//       // Update cumulative production for each interval
//       dailyRows.forEach((row) => {
//         cumulativeProduction += parseFloat(row.Production);
//         row.CumulativeProduction = cumulativeProduction.toFixed(2);
//       });

//       allRows.push(...dailyRows);
//     }

//     return allRows.length
//       ? allRows
//       : [{ message: 'No data found for selected dates' }];
//   }

//   // private processIntervals(
//   //   merged: any[],
//   //   fuelCostPerLitre: number,
//   //   date: string,
//   // ) {
//   //   const intervals: any[] = [];
//   //   let currentInterval: any[] = [];

//   //   // Group intervals based on Genset_Run_SS
//   //   for (const record of merged) {
//   //     if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
//   //       currentInterval.push(record);
//   //     } else if (currentInterval.length > 0) {
//   //       intervals.push(currentInterval);
//   //       currentInterval = [];
//   //     }
//   //   }
//   //   if (currentInterval.length > 0) intervals.push(currentInterval);

//   //   const rows: any[] = [];

//   //   for (const interval of intervals) {
//   //     const first = interval[0];
//   //     const last = interval[interval.length - 1];

//   //     const startDateObj = new Date(first.time);
//   //     const endDateObj = new Date(last.time);

//   //     // Run Hours
//   //     const durationMins =
//   //       (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
//   //     const runHours = +(durationMins / 60).toFixed(2);

//   //     // Fuel consumed in liters
//   //     const fuelConsumedLiters = +(
//   //       ((last.Total_Fuel_Consumption_calculated ?? 0) -
//   //         (first.Total_Fuel_Consumption_calculated ?? 0)) *
//   //       3.7854
//   //     ).toFixed(2);

//   //     // Production using Genset_Total_kW * 0.000833 per record
//   //     const production = interval.reduce((sum, r) => {
//   //       const energyKWH = (r.Genset_Total_kW ?? 0) * 0.000833;
//   //       return sum + energyKWH;
//   //     }, 0);

//   //     // Average Load %
//   //     const avgLoad =
//   //       interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
//   //       (interval.length || 1);

//   //     // Cost
//   //     const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);
//   //     const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//   //     const formatTime = (d: Date) =>
//   //       `${d.getHours().toString().padStart(2, '0')}:${d
//   //         .getMinutes()
//   //         .toString()
//   //         .padStart(2, '0')}`;

//   //     rows.push({
//   //       Date: date,
//   //       Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
//   //       Run_Hours: runHours,
//   //       Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
//   //       Production: `${production.toFixed(2)} kWh`,
//   //       Load_Percent: +avgLoad.toFixed(2),
//   //       Cost: cost,
//   //       CostPerUnit: costPerUnit,
//   //       TotalCost: cost,
//   //     });
//   //   }

//   //   return rows;
//   // }

//   private processIntervals(
//     merged: any[],
//     fuelCostPerLitre: number,
//     date: string,
//   ) {
//     const intervals: any[] = [];
//     let currentInterval: any[] = [];

//     // Group intervals based on Genset_Run_SS
//     for (const record of merged) {
//       if (record.Genset_Run_SS >= 1) {
//         currentInterval.push(record);
//       } else if (currentInterval.length > 0) {
//         intervals.push(currentInterval);
//         currentInterval = [];
//       }
//     }
//     if (currentInterval.length > 0) intervals.push(currentInterval);

//     const rows: any[] = [];

//     for (const interval of intervals) {
//       const first = interval[0];
//       const last = interval[interval.length - 1];

//       const startDateObj = new Date(first.time);
//       const endDateObj = new Date(last.time);

//       // ✅ UPDATED: Dashboard service jaisa running hours calculation
//       const runHours = this.calculateRunningHoursFromEngineTime(interval);

//       // Fuel consumed in liters
//       const fuelConsumedLiters = +(
//         ((last.Total_Fuel_Consumption_calculated ?? 0) -
//           (first.Total_Fuel_Consumption_calculated ?? 0)) *
//         3.7854
//       ).toFixed(2);

//       // Production using Genset_Total_kW * 0.000833 per record
//       const production = interval.reduce((sum, r) => {
//         const energyKWH = (r.Genset_Total_kW ?? 0) * 0.000833;
//         return sum + energyKWH;
//       }, 0);

//       // Average Load %
//       const avgLoad =
//         interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
//         (interval.length || 1);

//       // Cost
//       const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);
//       const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//       const formatTime = (d: Date) =>
//         `${d.getHours().toString().padStart(2, '0')}:${d
//           .getMinutes()
//           .toString()
//           .padStart(2, '0')}`;

//       rows.push({
//         Date: date,
//         Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
//         Run_Hours: runHours,
//         Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
//         Production: `${production.toFixed(2)} kWh`,
//         Load_Percent: +avgLoad.toFixed(2),
//         Cost: cost,
//         CostPerUnit: costPerUnit,
//         TotalCost: cost,
//       });
//     }

//     return rows;
//   }

//   /** -------------------
//    * NEW: Dashboard service jaisa running hours calculation
//    * ------------------- */
//   private calculateRunningHoursFromEngineTime(data: any[]): number {
//     if (data.length === 0) return 0;

//     console.log(
//       '=== DEBUG: Running Hours Calculation (Engine_Running_Time) ===',
//     );

//     const runningHoursField = 'Engine_Running_Time_calculated';

//     // Check if field exists
//     if (!(runningHoursField in data[0])) {
//       console.log(`❌ ${runningHoursField} not found in data`);
//       return 0;
//     }

//     const runningHoursValues = data
//       .map((d) => d[runningHoursField])
//       .filter(
//         (val) => val !== undefined && val !== null && !isNaN(val) && val >= 0,
//       );

//     console.log(`Valid ${runningHoursField} values:`, runningHoursValues);

//     if (runningHoursValues.length >= 2) {
//       const maxRunningHours = Math.max(...runningHoursValues);
//       const minRunningHours = Math.min(...runningHoursValues);
//       const calculatedRunningHours = maxRunningHours - minRunningHours;

//       console.log(
//         `Running hours: MAX=${maxRunningHours}, MIN=${minRunningHours}, DIFF=${calculatedRunningHours}`,
//       );
//       return +calculatedRunningHours.toFixed(2);
//     }

//     if (runningHoursValues.length === 1) {
//       return +runningHoursValues[0].toFixed(2);
//     }

//     return 0;
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from 'src/trends/formulas.service';

@Injectable()
export class ReportsService {
  private collection;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulasService: FormulasService,
  ) {
    this.collection = this.db.collection('navy_gen_on');
    this.collection.createIndex({ timestamp: 1 });
  }

  private formatTimestamp(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  async getFuelReport(payload: {
    startDate: string;
    endDate: string;
    fuelCostPerLitre: number;
  }) {
    const { startDate, endDate, fuelCostPerLitre } = payload;

    if (!startDate || !endDate)
      throw new Error('startDate and endDate are required');

    const sampleDoc = await this.collection.findOne(
      {},
      { projection: { timestamp: 1 } },
    );
    const isTimestampString =
      sampleDoc && typeof sampleDoc.timestamp === 'string';

    const start = new Date(startDate);
    const end = new Date(endDate);

    const query = isTimestampString
      ? {
          timestamp: {
            $gte: start.toISOString(),
            $lte: end.toISOString(),
          },
        }
      : { timestamp: { $gte: start, $lte: end } };

    // ⚡ Fetch all data in one query (optimized)
    const docs = await this.collection
      .find(query, {
        projection: {
          timestamp: 1,
          Genset_Run_SS: 1,
          Load_Percent: 1,
          Total_Fuel_Consumption_calculated: 1,
          Engine_Running_Time_calculated: 1,
          Genset_Total_kW: 1,
          Genset_Application_kW_Rating_PC2X: 1,
        },
      })
      .sort({ timestamp: 1 })
      .toArray();

    if (!docs.length) return [{ message: 'No data found for selected dates' }];

    // Adjust Load_Percent & +5 hours only for calculation
    const merged = docs.map((d) => {
      const ts = new Date(d.timestamp);
      ts.setHours(ts.getHours() + 5); // Only for calculation
      return {
        ...d,
        Load_Percent: this.formulasService.calculateLoadPercent(d),
        time: this.formatTimestamp(ts),
      };
    });

    // Group by day without changing original timestamp
    const allRows: any[] = [];
    let cumulativeProduction = 0;

    // Group by date (original timestamp, no +5 hours)
    const groupedByDay: Record<string, any[]> = {};
    merged.forEach((record) => {
      const day = new Date(record.timestamp).toISOString().split('T')[0];
      if (!groupedByDay[day]) groupedByDay[day] = [];
      groupedByDay[day].push(record);
    });

    for (const day of Object.keys(groupedByDay)) {
      const dailyData = groupedByDay[day];
      const dailyRows = this.processIntervals(dailyData, fuelCostPerLitre, day);

      // Update cumulative production
      dailyRows.forEach((row) => {
        cumulativeProduction += parseFloat(row.Production);
        (row as any).CumulativeProduction = cumulativeProduction.toFixed(2);
      });

      allRows.push(...dailyRows);
    }

    return allRows;
  }

  private processIntervals(
    merged: any[],
    fuelCostPerLitre: number,
    date: string,
  ) {
    const intervals: any[] = [];
    let currentInterval: any[] = [];

    for (const record of merged) {
      if (record.Genset_Run_SS >= 1) {
        currentInterval.push(record);
      } else if (currentInterval.length > 0) {
        intervals.push(currentInterval);
        currentInterval = [];
      }
    }
    if (currentInterval.length > 0) intervals.push(currentInterval);

    const rows: any[] = [];

    for (const interval of intervals) {
      const first = interval[0];
      const last = interval[interval.length - 1];

      const startDateObj = new Date(first.timestamp); // Use original timestamp
      const endDateObj = new Date(last.timestamp); // Use original timestamp

      const runHours = this.calculateRunningHoursFromEngineTime(interval);

      const fuelConsumedLiters = +(
        ((last.Total_Fuel_Consumption_calculated ?? 0) -
          (first.Total_Fuel_Consumption_calculated ?? 0)) *
        3.7854
      ).toFixed(2);

      const production = interval.reduce((sum, r) => {
        const energyKWH = (r.Genset_Total_kW ?? 0) * 0.000833;
        return sum + energyKWH;
      }, 0);

      const avgLoad =
        interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
        (interval.length || 1);

      const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);
      const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

      const formatTime = (d: Date) =>
        `${d.getHours().toString().padStart(2, '0')}:${d
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

      rows.push({
        Date: date,
        Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`, // no +5
        Run_Hours: runHours,
        Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
        Production: `${production.toFixed(2)} kWh`,
        Load_Percent: +avgLoad.toFixed(2),
        Cost: cost,
        CostPerUnit: costPerUnit,
        TotalCost: cost,
      });
    }

    return rows;
  }

  private calculateRunningHoursFromEngineTime(data: any[]): number {
    if (data.length === 0) return 0;

    const runningHoursField = 'Engine_Running_Time_calculated';

    if (!(runningHoursField in data[0])) return 0;

    const runningHoursValues = data
      .map((d) => d[runningHoursField])
      .filter(
        (val) => val !== undefined && val !== null && !isNaN(val) && val >= 0,
      );

    if (runningHoursValues.length >= 2) {
      const maxRunningHours = Math.max(...runningHoursValues);
      const minRunningHours = Math.min(...runningHoursValues);
      return +(maxRunningHours - minRunningHours).toFixed(2);
    }

    if (runningHoursValues.length === 1)
      return +runningHoursValues[0].toFixed(2);

    return 0;
  }
}
