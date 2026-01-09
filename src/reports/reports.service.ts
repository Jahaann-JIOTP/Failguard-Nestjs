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

  // fuel report

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
          // Genset_Run_SS: { $gte: 1 }, // only genset ON
          Genset_Run_SS: { $gte: 1, $lte: 6 },
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
          timestamps: { $push: '$timestamp' },
          Genset_Run_SS_array: { $push: '$Genset_Run_SS' },
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
      // Only consider timestamps where genset is ON
      // const runTimestamps = day.timestamps.filter(
      //   (_, i) => day.Genset_Run_SS_array[i] >= 1,
      // );

      const runTimestamps = day.timestamps.filter(
        (_, i) =>
          day.Genset_Run_SS_array[i] >= 1 && day.Genset_Run_SS_array[i] <= 6,
      );

      const periods = getPeriods(runTimestamps);

      return periods.map((period) => {
        const periodIndexes = period.timestamps.map((ts) =>
          day.timestamps.indexOf(ts),
        );

        // --- Run Hours: use actual timestamps difference ---
        let runHours =
          period.timestamps.length > 1
            ? (new Date(period.end).getTime() -
                new Date(period.start).getTime()) /
              (1000 * 60 * 60)
            : 0.25; // assume 15 min if only 1 reading
        runHours = +runHours.toFixed(2);

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

        const producedPerLiter =
          fuelConsumedLiters > 0
            ? +(production / fuelConsumedLiters).toFixed(2)
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
