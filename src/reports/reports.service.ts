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

  // async getFuelReport(payload: {
  //   startDate: string;
  //   endDate: string;
  //   fuelCostPerLitre: number;
  // }) {
  //   const { startDate, endDate, fuelCostPerLitre } = payload;

  //   const pipeline = [
  //     {
  //       $match: {
  //         timestamp: { $gte: startDate, $lte: endDate },
  //         Genset_Run_SS: { $gte: 1 },
  //       },
  //     },
  //     {
  //       $addFields: {
  //         date: { $substr: ['$timestamp', 0, 10] },
  //         energyKWH: { $multiply: ['$Genset_Total_kW', 0.000833] },
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

  //         // Load % ke liye raw fields push ho rahi hain
  //         ratings: { $push: '$Genset_Application_kW_Rating_PC2X' },
  //         totalKWs: { $push: '$Genset_Total_kW' },
  //         Genset_Total_kW: { $push: '$Genset_Total_kW' },
  //         Fuel_Rate: { $push: '$Fuel_Rate' },
  //       },
  //     },
  //     { $sort: { _id: 1 } },
  //   ];

  //   const aggregated = await this.collection
  //     .aggregate(pipeline, { allowDiskUse: true })
  //     .toArray();

  //   let cumulativeProduction = 0;

  //   const rows = aggregated.map((day) => {
  //     const fuelMin = Number(day.fuelMin) || 0;
  //     const fuelMax = Number(day.fuelMax) || 0;
  //     const engineMin = Number(day.engineMin) || 0;
  //     const engineMax = Number(day.engineMax) || 0;

  //     const totalProduction = Number(day.totalProduction) || 0;

  //     const fuelConsumedLiters = +((fuelMax - fuelMin) * 3.7854).toFixed(2);
  //     const runHours = +(engineMax - engineMin).toFixed(2);
  //     const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);

  //     cumulativeProduction += totalProduction;

  //     // ---------------- Load % Calculation (Correct Version) -----------------

  //     let avgLoadPercent = 0;

  //     if (day.totalKWs?.length) {
  //       const loads = day.totalKWs.map((kW: number, i: number) => {
  //         const rating = day.ratings[i];
  //         return rating ? (kW / rating) * 100 : 0;
  //       });

  //       avgLoadPercent = loads.reduce((a, b) => a + b, 0) / loads.length;
  //     }

  //     // const producedPerLiter =+(day.Genset_Total_kW / (day.Fuel_Rate * 3.7854)).toFixed(2);
  //     let producedPerLiter = 0;

  //     if (day.Genset_Total_kW?.length && day.Fuel_Rate?.length) {
  //       const feiList = day.Genset_Total_kW.map((kW: number, i: number) => {
  //         const fuelRate = day.Fuel_Rate[i] ?? 0; // gallons/hour
  //         if (!fuelRate) return 0;

  //         const fuelRateLiters = fuelRate * 3.7854;
  //         return +(kW / fuelRateLiters).toFixed(2);
  //       });

  //       const sum = feiList.reduce((a, b) => a + b, 0);
  //       producedPerLiter = +(sum / feiList.length).toFixed(2);
  //     }

  //     // -----------------------------------------------------------------------

  //     const formatTime = (ts: string) => ts?.slice(11, 16) ?? '00:00';

  //     return {
  //       Date: day._id,
  //       Duration: `${formatTime(day.startTime)}–${formatTime(day.endTime)}`,
  //       Run_Hours: runHours,
  //       Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
  //       Production: `${totalProduction.toFixed(2)} kWh`,
  //       Load_Percent: +avgLoadPercent.toFixed(2), // ✔ Real Load %
  //       Cost: cost,
  //       CostPerUnit: totalProduction ? +(cost / totalProduction).toFixed(2) : 0,
  //       TotalCost: cost,
  //       CumulativeProduction: cumulativeProduction.toFixed(2),
  //       // Producted Per Liter = Total Production (kWh) / Fuel Consumed (Liters)

  //       ProducedPerLiter: producedPerLiter,
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

      // Fuel consumed calculation
      const fuelConsumedLiters = +((fuelMax - fuelMin) * 3.7854).toFixed(2);

      // Run Hours (engine running hours difference)
      const runHours = +(engineMax - engineMin).toFixed(1);

      // Duration calculation (startTime to endTime difference)
      const start = new Date(day.startTime);
      const end = new Date(day.endTime);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      const durationHours = +(durationMinutes / 60).toFixed(1);

      const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);

      cumulativeProduction += totalProduction;

      // Load % calculation
      let avgLoadPercent = 0;
      if (day.totalKWs?.length) {
        const loads = day.totalKWs.map((kW: number, i: number) => {
          const rating = day.ratings[i];
          return rating ? (kW / rating) * 100 : 0;
        });
        avgLoadPercent = loads.reduce((a, b) => a + b, 0) / loads.length;
      }

      // Produced Per Liter calculation
      let producedPerLiter = 0;
      if (day.Genset_Total_kW?.length && day.Fuel_Rate?.length) {
        const feiList = day.Genset_Total_kW.map((kW: number, i: number) => {
          const fuelRate = day.Fuel_Rate[i] ?? 0;
          if (!fuelRate) return 0;
          const fuelRateLiters = fuelRate * 3.7854;
          return +(kW / fuelRateLiters).toFixed(2);
        });
        const sum = feiList.reduce((a, b) => a + b, 0);
        producedPerLiter = +(sum / feiList.length).toFixed(2);
      }

      // Time formatting function
      const formatTime = (ts: string) => ts?.slice(11, 16) ?? '00:00';

      return {
        Date: day._id,
        // Duration: `${formatTime(day.startTime)}–${formatTime(day.endTime)} (${durationHours} hr)`,
        Duration: `${formatTime(day.startTime)}–${formatTime(day.endTime)} (${durationHours.toFixed(2)} hr)`,

        Run_Hours: runHours,
        Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
        Production: `${totalProduction.toFixed(2)} kWh`,
        Load_Percent: +avgLoadPercent.toFixed(2),
        Cost: cost,
        CostPerUnit: totalProduction ? +(cost / totalProduction).toFixed(2) : 0,
        TotalCost: cost,
        CumulativeProduction: cumulativeProduction.toFixed(2),
        ProducedPerLiter: producedPerLiter,
      };
    });

    return rows;
  }
}
