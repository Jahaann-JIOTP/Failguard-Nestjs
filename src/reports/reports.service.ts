// // /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // import { Injectable, Inject } from '@nestjs/common';
// // import { Db } from 'mongodb';
// // import { FormulasService } from 'src/trends/formulas.service';

// // @Injectable()
// // export class ReportsService {
// //   private collection;

// //   constructor(
// //     @Inject('MONGO_CLIENT') private readonly db: Db,
// //     private readonly formulasService: FormulasService,
// //   ) {
// //     this.collection = this.db.collection('navy_gen_on');
// //     this.collection.createIndex({ timestamp: 1 });
// //   }

// //   async getFuelReport(payload: {
// //     startDate: string;
// //     endDate: string;
// //     fuelCostPerLitre: number;
// //   }) {
// //     const { startDate, endDate, fuelCostPerLitre } = payload;

// //     const pipeline = [
// //       {
// //         $match: {
// //           timestamp: { $gte: startDate, $lte: endDate },
// //           Genset_Run_SS: { $gte: 1 },
// //         },
// //       },
// //       {
// //         $addFields: {
// //           date: { $substr: ['$timestamp', 0, 10] },
// //           energyKWH: { $multiply: ['$Genset_Total_kW', 0.000833] },
// //         },
// //       },
// //       {
// //         $group: {
// //           _id: '$date',
// //           startTime: { $min: '$timestamp' },
// //           endTime: { $max: '$timestamp' },

// //           fuelMin: { $min: '$Total_Fuel_Consumption_calculated' },
// //           fuelMax: { $max: '$Total_Fuel_Consumption_calculated' },

// //           engineMin: { $min: '$Engine_Running_Time_calculated' },
// //           engineMax: { $max: '$Engine_Running_Time_calculated' },

// //           totalProduction: { $sum: '$energyKWH' },

// //           // Load % ke liye raw fields push ho rahi hain
// //           ratings: { $push: '$Genset_Application_kW_Rating_PC2X' },
// //           totalKWs: { $push: '$Genset_Total_kW' },
// //           Genset_Total_kW: { $push: '$Genset_Total_kW' },
// //           Fuel_Rate: { $push: '$Fuel_Rate' },
// //         },
// //       },
// //       { $sort: { _id: 1 } },
// //     ];

// //     const aggregated = await this.collection
// //       .aggregate(pipeline, { allowDiskUse: true })
// //       .toArray();

// //     let cumulativeProduction = 0;

// //     const rows = aggregated.map((day) => {
// //       const fuelMin = Number(day.fuelMin) || 0;
// //       const fuelMax = Number(day.fuelMax) || 0;
// //       const engineMin = Number(day.engineMin) || 0;
// //       const engineMax = Number(day.engineMax) || 0;

// //       const totalProduction = Number(day.totalProduction) || 0;

// //       const fuelConsumedLiters = +((fuelMax - fuelMin) * 3.7854).toFixed(2);
// //       const runHours = +(engineMax - engineMin).toFixed(2);
// //       const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);

// //       cumulativeProduction += totalProduction;

// //       // ---------------- Load % Calculation (Correct Version) -----------------

// //       let avgLoadPercent = 0;

// //       if (day.totalKWs?.length) {
// //         const loads = day.totalKWs.map((kW: number, i: number) => {
// //           const rating = day.ratings[i];
// //           return rating ? (kW / rating) * 100 : 0;
// //         });

// //         avgLoadPercent = loads.reduce((a, b) => a + b, 0) / loads.length;
// //       }

// //       // const producedPerLiter =+(day.Genset_Total_kW / (day.Fuel_Rate * 3.7854)).toFixed(2);
// //       let producedPerLiter = 0;

// //       if (day.Genset_Total_kW?.length && day.Fuel_Rate?.length) {
// //         const feiList = day.Genset_Total_kW.map((kW: number, i: number) => {
// //           const fuelRate = day.Fuel_Rate[i] ?? 0; // gallons/hour
// //           if (!fuelRate) return 0;

// //           const fuelRateLiters = fuelRate * 3.7854;
// //           return +(kW / fuelRateLiters).toFixed(2);
// //         });

// //         const sum = feiList.reduce((a, b) => a + b, 0);
// //         producedPerLiter = +(sum / feiList.length).toFixed(2);
// //       }

// //       // -----------------------------------------------------------------------

// //       const formatTime = (ts: string) => ts?.slice(11, 16) ?? '00:00';

// //       return {
// //         Date: day._id,
// //         Duration: `${formatTime(day.startTime)}–${formatTime(day.endTime)}`,
// //         Run_Hours: runHours,
// //         Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
// //         Production: `${totalProduction.toFixed(2)} kWh`,
// //         Load_Percent: +avgLoadPercent.toFixed(2), // ✔ Real Load %
// //         Cost: cost,
// //         CostPerUnit: totalProduction ? +(cost / totalProduction).toFixed(2) : 0,
// //         TotalCost: cost,
// //         CumulativeProduction: cumulativeProduction.toFixed(2),
// //         // Producted Per Liter = Total Production (kWh) / Fuel Consumed (Liters)

// //         ProducedPerLiter: producedPerLiter,
// //       };
// //     });

// //     return rows;
// //   }
// // }

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

//   async getFuelReport(payload: {
//     startDate: string;
//     endDate: string;
//     fuelCostPerLitre: number;
//   }) {
//     const { startDate, endDate, fuelCostPerLitre } = payload;

//     const pipeline = [
//       {
//         $match: {
//           timestamp: { $gte: startDate, $lte: endDate },
//           Genset_Run_SS: { $gte: 1 }, // only genset ON
//         },
//       },
//       {
//         $addFields: {
//           date: { $substr: ['$timestamp', 0, 10] },
//           energyKWH: { $multiply: ['$Genset_Total_kW', 0.000833] },
//         },
//       },
//       {
//         $group: {
//           _id: '$date',
//           timestamps: { $push: '$timestamp' }, // collect all on timestamps
//           fuelMin: { $min: '$Total_Fuel_Consumption_calculated' },
//           fuelMax: { $max: '$Total_Fuel_Consumption_calculated' },
//           engineMin: { $min: '$Engine_Running_Time_calculated' },
//           engineMax: { $max: '$Engine_Running_Time_calculated' },
//           totalProduction: { $sum: '$energyKWH' },
//           ratings: { $push: '$Genset_Application_kW_Rating_PC2X' },
//           totalKWs: { $push: '$Genset_Total_kW' },
//           Genset_Total_kW: { $push: '$Genset_Total_kW' },
//           Fuel_Rate: { $push: '$Fuel_Rate' },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ];

//     const aggregated = await this.collection
//       .aggregate(pipeline, { allowDiskUse: true })
//       .toArray();

//     let cumulativeProduction = 0;

//     const formatTime = (ts: string) => ts?.slice(11, 16) ?? '00:00';

//     // Helper function to calculate multiple durations, skipping gaps > 15 min
//     const getDurations = (timestamps: string[]) => {
//       if (!timestamps?.length) return '';
//       const sorted = timestamps.sort(); // ascending order
//       const periods: { start: string; end: string }[] = [];
//       let start = sorted[0];
//       let prev = sorted[0];

//       for (let i = 1; i < sorted.length; i++) {
//         const current = sorted[i];
//         const diff =
//           (new Date(current).getTime() - new Date(prev).getTime()) /
//           (1000 * 60); // minutes

//         if (diff > 15) {
//           // gap >15 min, start new period
//           periods.push({ start, end: prev });
//           start = current;
//         }
//         prev = current;
//       }
//       periods.push({ start, end: prev });

//       return periods
//         .map((p) => `${formatTime(p.start)}–${formatTime(p.end)}`)
//         .join(', ');
//     };

//     const rows = aggregated.map((day) => {
//       const fuelMin = Number(day.fuelMin) || 0;
//       const fuelMax = Number(day.fuelMax) || 0;
//       const engineMin = Number(day.engineMin) || 0;
//       const engineMax = Number(day.engineMax) || 0;

//       const totalProduction = Number(day.totalProduction) || 0;
//       const fuelConsumedLiters = +((fuelMax - fuelMin) * 3.7854).toFixed(2);
//       const runHours = +(engineMax - engineMin).toFixed(2);
//       const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);

//       cumulativeProduction += totalProduction;

//       // ---------------- Load % Calculation -----------------
//       let avgLoadPercent = 0;
//       if (day.totalKWs?.length) {
//         const loads = day.totalKWs.map((kW: number, i: number) => {
//           const rating = day.ratings[i];
//           return rating ? (kW / rating) * 100 : 0;
//         });
//         avgLoadPercent = loads.reduce((a, b) => a + b, 0) / loads.length;
//       }

//       let producedPerLiter = 0;
//       if (day.Genset_Total_kW?.length && day.Fuel_Rate?.length) {
//         const feiList = day.Genset_Total_kW.map((kW: number, i: number) => {
//           const fuelRate = day.Fuel_Rate[i] ?? 0; // gallons/hour
//           if (!fuelRate) return 0;
//           const fuelRateLiters = fuelRate * 3.7854;
//           return +(kW / fuelRateLiters).toFixed(2);
//         });
//         const sum = feiList.reduce((a, b) => a + b, 0);
//         producedPerLiter = +(sum / feiList.length).toFixed(2);
//       }

//       return {
//         Date: day._id,
//         Duration: getDurations(day.timestamps),
//         Run_Hours: runHours,
//         Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
//         Production: `${totalProduction.toFixed(2)} kWh`,
//         Load_Percent: +avgLoadPercent.toFixed(2),
//         Cost: cost,
//         CostPerUnit: totalProduction ? +(cost / totalProduction).toFixed(2) : 0,
//         TotalCost: cost,
//         CumulativeProduction: cumulativeProduction.toFixed(2),
//         ProducedPerLiter: producedPerLiter,
//       };
//     });

//     return rows;
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
          Genset_Run_SS: { $gte: 1 }, // only genset ON
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
          timestamps: { $push: '$timestamp' }, // collect all on timestamps
          fuelMin: { $min: '$Total_Fuel_Consumption_calculated' },
          fuelMax: { $max: '$Total_Fuel_Consumption_calculated' },
          engineMin: { $min: '$Engine_Running_Time_calculated' },
          engineMax: { $max: '$Engine_Running_Time_calculated' },
          totalProduction: { $sum: '$energyKWH' },
          ratings: { $push: '$Genset_Application_kW_Rating_PC2X' },
          totalKWs: { $push: '$Genset_Total_kW' },
          Genset_Total_kW: { $push: '$Genset_Total_kW' },
          Fuel_Rate: { $push: '$Fuel_Rate' },
          Engine_Running_Time_calculated_array: {
            $push: '$Engine_Running_Time_calculated',
          },
          Total_Fuel_Consumption_calculated_array: {
            $push: '$Total_Fuel_Consumption_calculated',
          },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const aggregated = await this.collection
      .aggregate(pipeline, { allowDiskUse: true })
      .toArray();

    let cumulativeProduction = 0;

    const formatTime = (ts: string) => ts?.slice(11, 16) ?? '00:00';

    // ---------------- Helper: Split timestamps into periods -----------------
    const getPeriods = (timestamps: string[]) => {
      if (!timestamps?.length) return [];

      const sorted = timestamps.sort();
      const periods: { start: string; end: string; timestamps: string[] }[] =
        [];

      let start = sorted[0];
      let prev = sorted[0];
      let bucket = [sorted[0]];

      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const diff =
          (new Date(current).getTime() - new Date(prev).getTime()) /
          (1000 * 60); // minutes

        if (diff > 15) {
          periods.push({ start, end: prev, timestamps: bucket });
          start = current;
          bucket = [current];
        } else {
          bucket.push(current);
        }
        prev = current;
      }

      periods.push({ start, end: prev, timestamps: bucket });
      return periods;
    };

    // ---------------- Build final rows period-wise -----------------
    const rows = aggregated.flatMap((day) => {
      const periods = getPeriods(day.timestamps);

      return periods.map((period) => {
        // Get indexes of period timestamps
        const periodIndexes = period.timestamps.map((ts) =>
          day.timestamps.indexOf(ts),
        );

        // --- Run Hours ---
        const engineTimes = periodIndexes.map((i) =>
          Number(day.Engine_Running_Time_calculated_array[i] ?? 0),
        );
        const runHours =
          engineTimes.length > 1
            ? +(Math.max(...engineTimes) - Math.min(...engineTimes)).toFixed(2)
            : 0;

        // --- Production ---
        const production = periodIndexes.reduce((sum, i) => {
          const kW = Number(day.Genset_Total_kW[i] ?? 0);
          return sum + kW * 0.000833;
        }, 0);

        cumulativeProduction += production;

        // --- Fuel Consumed ---
        const fuelValues = periodIndexes.map((i) =>
          Number(day.Total_Fuel_Consumption_calculated_array[i] ?? 0),
        );
        const fuelConsumedGallons =
          fuelValues.length > 1
            ? Math.max(...fuelValues) - Math.min(...fuelValues)
            : 0;
        const fuelConsumedLiters = +(fuelConsumedGallons * 3.7854).toFixed(2);

        // --- Load Percent ---
        const loadList = periodIndexes.map((i) => {
          const kW = day.Genset_Total_kW[i];
          const rating = day.ratings[i];
          return rating ? (kW / rating) * 100 : 0;
        });
        const avgLoad =
          loadList.length > 0
            ? +(loadList.reduce((a, b) => a + b, 0) / loadList.length).toFixed(
                2,
              )
            : 0;

        // --- Produced per Liter ---
        const feiList = periodIndexes.map((i) => {
          const kW = day.Genset_Total_kW[i];
          const fuelRate = day.Fuel_Rate[i];
          if (!fuelRate) return 0;
          return kW / (fuelRate * 3.7854);
        });
        const producedPerLiter =
          feiList.length > 0
            ? +(feiList.reduce((a, b) => a + b, 0) / feiList.length).toFixed(2)
            : 0;

        // --- Cost ---
        const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);
        const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

        return {
          Date: day._id,
          Duration: `${formatTime(period.start)}–${formatTime(period.end)}`,
          Run_Hours: runHours,
          Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
          Production: `${production.toFixed(2)} kWh`,
          Load_Percent: avgLoad,
          Cost: cost,
          CostPerUnit: costPerUnit,
          TotalCost: cost,
          CumulativeProduction: cumulativeProduction.toFixed(2),
          ProducedPerLiter: producedPerLiter,
        };
      });
    });

    return rows;
  }
}
