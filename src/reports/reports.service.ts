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

//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     const query = isTimestampString
//       ? {
//           timestamp: {
//             $gte: start.toISOString(),
//             $lte: end.toISOString(),
//           },
//         }
//       : { timestamp: { $gte: start, $lte: end } };

//     // ⚡ Fetch all data in one query (optimized)
//     const docs = await this.collection
//       .find(query, {
//         projection: {
//           timestamp: 1,
//           Genset_Run_SS: 1,
//           Load_Percent: 1,
//           Total_Fuel_Consumption_calculated: 1,
//           Engine_Running_Time_calculated: 1,
//           Genset_Total_kW: 1,
//           Genset_Application_kW_Rating_PC2X: 1,
//         },
//       })
//       .sort({ timestamp: 1 })
//       .toArray();

//     if (!docs.length) return [{ message: 'No data found for selected dates' }];

//     // Adjust Load_Percent & +5 hours only for calculation
//     const merged = docs.map((d) => {
//       const ts = new Date(d.timestamp);
//       ts.setHours(ts.getHours() + 5); // Only for calculation
//       return {
//         ...d,
//         Load_Percent: this.formulasService.calculateLoadPercent(d),
//         time: this.formatTimestamp(ts),
//       };
//     });

//     // Group by day without changing original timestamp
//     const allRows: any[] = [];
//     let cumulativeProduction = 0;

//     // Group by date (original timestamp, no +5 hours)
//     const groupedByDay: Record<string, any[]> = {};
//     merged.forEach((record) => {
//       const day = new Date(record.timestamp).toISOString().split('T')[0];
//       if (!groupedByDay[day]) groupedByDay[day] = [];
//       groupedByDay[day].push(record);
//     });

//     for (const day of Object.keys(groupedByDay)) {
//       const dailyData = groupedByDay[day];
//       const dailyRows = this.processIntervals(dailyData, fuelCostPerLitre, day);

//       // Update cumulative production
//       dailyRows.forEach((row) => {
//         cumulativeProduction += parseFloat(row.Production);
//         (row as any).CumulativeProduction = cumulativeProduction.toFixed(2);
//       });

//       allRows.push(...dailyRows);
//     }

//     return allRows;
//   }

//   private processIntervals(
//     merged: any[],
//     fuelCostPerLitre: number,
//     date: string,
//   ) {
//     const intervals: any[] = [];
//     let currentInterval: any[] = [];

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

//       const startDateObj = new Date(first.timestamp); // Use original timestamp
//       const endDateObj = new Date(last.timestamp); // Use original timestamp

//       const runHours = this.calculateRunningHoursFromEngineTime(interval);

//       const fuelConsumedLiters = +(
//         ((last.Total_Fuel_Consumption_calculated ?? 0) -
//           (first.Total_Fuel_Consumption_calculated ?? 0)) *
//         3.7854
//       ).toFixed(2);

//       const production = interval.reduce((sum, r) => {
//         const energyKWH = (r.Genset_Total_kW ?? 0) * 0.000833;
//         return sum + energyKWH;
//       }, 0);

//       const avgLoad =
//         interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
//         (interval.length || 1);

//       const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);
//       const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//       const formatTime = (d: Date) =>
//         `${d.getHours().toString().padStart(2, '0')}:${d
//           .getMinutes()
//           .toString()
//           .padStart(2, '0')}`;

//       rows.push({
//         Date: date,
//         Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`, // no +5
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

//   private calculateRunningHoursFromEngineTime(data: any[]): number {
//     if (data.length === 0) return 0;

//     const runningHoursField = 'Engine_Running_Time_calculated';

//     if (!(runningHoursField in data[0])) return 0;

//     const runningHoursValues = data
//       .map((d) => d[runningHoursField])
//       .filter(
//         (val) => val !== undefined && val !== null && !isNaN(val) && val >= 0,
//       );

//     if (runningHoursValues.length >= 2) {
//       const maxRunningHours = Math.max(...runningHoursValues);
//       const minRunningHours = Math.min(...runningHoursValues);
//       return +(maxRunningHours - minRunningHours).toFixed(2);
//     }

//     if (runningHoursValues.length === 1)
//       return +runningHoursValues[0].toFixed(2);

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

  // async getFuelReport(payload: {
  //   startDate: string;
  //   endDate: string;
  //   fuelCostPerLitre: number;
  // }) {
  //   const { startDate, endDate, fuelCostPerLitre } = payload;

  //   if (!startDate || !endDate)
  //     throw new Error('startDate and endDate are required');

  //   const start = new Date(startDate);
  //   const end = new Date(endDate);

  //   const pipeline = [
  //     {
  //       $match: {
  //         timestamp: { $gte: start, $lte: end },
  //         Genset_Run_SS: { $gte: 1 },
  //       },
  //     },
  //     {
  //       $addFields: {
  //         date: {
  //           $dateToString: {
  //             format: '%Y-%m-%d',
  //             date: '$timestamp',
  //             timezone: '+05:00',
  //           },
  //         },
  //         energyKWH: { $multiply: ['$Genset_Total_kW', 0.000833] },
  //         Load_Percent_Calc: '$Load_Percent',
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: '$date',
  //         startTime: { $min: '$timestamp' },
  //         endTime: { $max: '$timestamp' },
  //         fuelMin: { $min: '$Total_Fuel_Consumption_calculated' },
  //         fuelMax: { $max: '$Total_Fuel_Consumption_calculated' },
  //         engineMin: { $min: '$Engine_Running_Time_calculated' },
  //         engineMax: { $max: '$Engine_Running_Time_calculated' },
  //         totalProduction: { $sum: '$energyKWH' },
  //         avgLoad: { $avg: '$Load_Percent_Calc' },
  //       },
  //     },
  //     { $sort: { _id: 1 } },
  //   ];

  //   const aggregated = await this.collection.aggregate(pipeline).toArray();

  //   if (!aggregated.length)
  //     return [{ message: 'No data found for selected dates' }];

  //   let cumulativeProduction = 0;

  //   const rows = aggregated.map((day) => {
  //     const fuelConsumedLiters = +(
  //       (day.fuelMax - day.fuelMin) *
  //       3.7854
  //     ).toFixed(2);

  //     const runHours = +(day.engineMax - day.engineMin).toFixed(2);

  //     const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);

  //     const costPerUnit = day.totalProduction
  //       ? +(cost / day.totalProduction).toFixed(2)
  //       : 0;

  //     const formatTime = (d: Date) =>
  //       `${new Date(d).getHours().toString().padStart(2, '0')}:${new Date(d)
  //         .getMinutes()
  //         .toString()
  //         .padStart(2, '0')}`;

  //     cumulativeProduction += day.totalProduction;

  //     return {
  //       Date: day._id,
  //       Duration: `${formatTime(day.startTime)}–${formatTime(day.endTime)}`,
  //       Run_Hours: runHours,
  //       Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
  //       Production: `${day.totalProduction.toFixed(2)} kWh`,
  //       Load_Percent: +day.avgLoad.toFixed(2),
  //       Cost: cost,
  //       CostPerUnit: costPerUnit,
  //       TotalCost: cost,
  //       CumulativeProduction: cumulativeProduction.toFixed(2),
  //     };
  //   });

  //   return rows;
  // }

  async getFuelReport(payload: {
    startDate: string;
    endDate: string;
    fuelCostPerLitre: number;
  }) {
    const { startDate, endDate, fuelCostPerLitre } = payload;

    if (!startDate || !endDate)
      throw new Error('startDate and endDate are required');

    // Aggregation pipeline
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          Genset_Run_SS: { $gte: 1 }, // Only genset ON
        },
      },
      {
        $addFields: {
          date: { $substr: ['$timestamp', 0, 10] }, // "YYYY-MM-DD" for grouping
          energyKWH: { $multiply: ['$Genset_Total_kW', 0.000833] },
          Load_Percent_Calc: '$Load_Percent',
        },
      },
      {
        $group: {
          _id: '$date',
          startTime: { $min: '$timestamp' },
          endTime: { $max: '$timestamp' },
          fuelMin: { $min: '$Total_Fuel_Consumption_calculated' },
          fuelMax: { $max: '$Total_Fuel_Consumption_calculated' },
          engineMin: { $min: '$Engine_Running_Time_calculated' },
          engineMax: { $max: '$Engine_Running_Time_calculated' },
          totalProduction: { $sum: '$energyKWH' },
          avgLoad: { $avg: '$Load_Percent_Calc' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const aggregated = await this.collection.aggregate(pipeline).toArray();

    if (!aggregated.length)
      return [{ message: 'No data found for selected dates' }];

    let cumulativeProduction = 0;

    const rows = aggregated.map((day) => {
      const fuelMin = day.fuelMin ?? 0;
      const fuelMax = day.fuelMax ?? 0;
      const engineMin = day.engineMin ?? 0;
      const engineMax = day.engineMax ?? 0;
      const totalProduction = day.totalProduction ?? 0;
      const avgLoad = day.avgLoad ?? 0;

      const fuelConsumedLiters = +((fuelMax - fuelMin) * 3.7854).toFixed(2);
      const runHours = +(engineMax - engineMin).toFixed(2);
      const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);
      const costPerUnit = totalProduction
        ? +(cost / totalProduction).toFixed(2)
        : 0;

      const formatTime = (ts: string) => ts?.slice(11, 16) ?? '00:00';

      cumulativeProduction += totalProduction;

      return {
        Date: day._id,
        Duration: `${formatTime(day.startTime)}–${formatTime(day.endTime)}`,
        Run_Hours: runHours,
        Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
        Production: `${totalProduction.toFixed(2)} kWh`,
        Load_Percent: +avgLoad.toFixed(2),
        Cost: cost,
        CostPerUnit: costPerUnit,
        TotalCost: cost,
        CumulativeProduction: cumulativeProduction.toFixed(2),
      };
    });

    return rows;
  }
}
