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

  async getFuelReport(payload: {
    startDate: string;
    endDate: string;
    fuelCostPerLitre: number;
  }) {
    const { startDate, endDate, fuelCostPerLitre } = payload;

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          Genset_Run_SS: { $gte: 1 },
        },
      },
      {
        $addFields: {
          date: { $substr: ['$timestamp', 0, 10] },
          energyKWH: { $multiply: ['$Genset_Total_kW', 0.000833] },
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

          // Load % ke liye raw fields push ho rahi hain
          ratings: { $push: '$Genset_Application_kW_Rating_PC2X' },
          totalKWs: { $push: '$Genset_Total_kW' },
          Genset_Total_kW: { $push: '$Genset_Total_kW' },
         Fuel_Rate: { $push: '$Fuel_Rate' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const aggregated = await this.collection
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray();

    let cumulativeProduction = 0;

    const rows = aggregated.map((day) => {
      const fuelMin = Number(day.fuelMin) || 0;
      const fuelMax = Number(day.fuelMax) || 0;
      const engineMin = Number(day.engineMin) || 0;
      const engineMax = Number(day.engineMax) || 0;

      const totalProduction = Number(day.totalProduction) || 0;

      const fuelConsumedLiters = +((fuelMax - fuelMin) * 3.7854).toFixed(2);
      const runHours = +(engineMax - engineMin).toFixed(2);
      const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);

      cumulativeProduction += totalProduction;

      // ---------------- Load % Calculation (Correct Version) -----------------

      let avgLoadPercent = 0;

      if (day.totalKWs?.length) {
        const loads = day.totalKWs.map((kW: number, i: number) => {
          const rating = day.ratings[i];
          return rating ? (kW / rating) * 100 : 0;
        });

        avgLoadPercent = loads.reduce((a, b) => a + b, 0) / loads.length;
      }

      // const producedPerLiter =+(day.Genset_Total_kW / (day.Fuel_Rate * 3.7854)).toFixed(2);
      let producedPerLiter = 0;

if (day.Genset_Total_kW?.length && day.Fuel_Rate?.length) {
  const feiList = day.Genset_Total_kW.map((kW: number, i: number) => {
    const fuelRate = day.Fuel_Rate[i] ?? 0; // gallons/hour
    if (!fuelRate) return 0;

    const fuelRateLiters = fuelRate * 3.7854;
    return +(kW / fuelRateLiters).toFixed(2);
  });

  const sum = feiList.reduce((a, b) => a + b, 0);
  producedPerLiter = +(sum / feiList.length).toFixed(2);
}


      // -----------------------------------------------------------------------

      const formatTime = (ts: string) => ts?.slice(11, 16) ?? '00:00';

      return {
        Date: day._id,
        Duration: `${formatTime(day.startTime)}–${formatTime(day.endTime)}`,
        Run_Hours: runHours,
        Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
        Production: `${totalProduction.toFixed(2)} kWh`,
        Load_Percent: +avgLoadPercent.toFixed(2), // ✔ Real Load %
        Cost: cost,
        CostPerUnit: totalProduction ? +(cost / totalProduction).toFixed(2) : 0,
        TotalCost: cost,
        CumulativeProduction: cumulativeProduction.toFixed(2),
        // Producted Per Liter = Total Production (kWh) / Fuel Consumed (Liters)

        ProducedPerLiter: producedPerLiter,
      };
    });

    return rows;
  }
}
