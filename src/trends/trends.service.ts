// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // /* eslint-disable @typescript-eslint/no-unsafe-argument */
// // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // /* eslint-disable @typescript-eslint/require-await */
// // /* eslint-disable prefer-const */
// // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // /* eslint-disable @typescript-eslint/no-unsafe-member-access */

// // import { Injectable, Inject } from '@nestjs/common';
// // import { Db } from 'mongodb';
// // import { FormulasService } from './formulas.service';
// // import { params } from 'utils/param-groups';

// // @Injectable()
// // export class TrendsService {
// //   private collection;

// //   constructor(
// //     @Inject('MONGO_CLIENT') private readonly db: Db,
// //     private readonly formulasService: FormulasService,
// //   ) {
// //     this.collection = this.db.collection('navy_12s');
// //     this.collection.createIndex({ timestamp: 1 });
// //   }

// //   async getList() {
// //     return params;
// //   }

// //   async getTrends(payload: any) {
// //     const {
// //       mode,
// //       startDate,
// //       endDate,
// //       params: selectedParams = [],
// //       sortOrder = 'asc',
// //     } = payload;

// //     if (!mode) throw new Error('Mode is required');

// //     const startISO = new Date(startDate).toISOString();
// //     const endISO = new Date(endDate).toISOString();

// //     // ----------------------
// //     // Dependency map for formulas
// //     // ----------------------
// //     const dependencyMap: Record<string, string[]> = {
// //       Load_Percent: ['Genset_Total_kW', 'Genset_Application_kW_Rating_PC2X'],
// //       Voltage_Imbalance: [
// //         'Genset_L1L2_Voltage',
// //         'Genset_L2L3_Voltage',
// //         'Genset_L3L1_Voltage',
// //       ],
// //       Current_Imbalance: [
// //         'Genset_L1_Current',
// //         'Genset_L2_Current',
// //         'Genset_L3_Current',
// //       ],
// //       Power_Loss_Factor: ['Genset_Total_Power_Factor_calculated'],
// //       Thermal_Stress: [
// //         'Genset_L1_Current',
// //         'Genset_L2_Current',
// //         'Genset_L3_Current',
// //         'Genset_Application_kW_Rating_PC2X',
// //       ],
// //       RPM_Stability_Index: ['Averagr_Engine_Speed'],
// //       Oscillation_Index: ['Genset_Total_kW', 'Genset_Total_kVA'],
// //       Fuel_Consumption: [
// //         'Fuel_Rate',
// //         'Genset_Total_kW',
// //         'Genset_Application_kW_Rating_PC2X',
// //       ],
// //       Lubrication_Risk_Index: ['Oil_Temperature', 'Oil_Pressure'],
// //       Air_Fuel_Effectiveness: ['Air_Flow', 'Fuel_Rate'],
// //       Specific_Fuel_Consumption: ['Genset_Total_kW', 'Fuel_Rate'],
// //       Heat_Rate: ['Fuel_Rate', 'Genset_Total_kW'],
// //       Mechanical_Stress: ['Vibration_Amplitude', 'Genset_Total_kW'],
// //       Cooling_Margin: ['Coolant_Temperature', 'Oil_Temperature'],
// //       OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
// //       Fuel_Flow_Change: ['Fuel_Rate'],
// //       Coolant_TemperatureC: ['Coolant_Temperature'],
// //       Oil_TemperatureC: ['Oil_Temperature'],
// //     };

// //     // ----------------------
// //     // Build projection including dependencies
// //     // ----------------------
// //     const allNeeded = new Set<string>();
// //     selectedParams.forEach((p) => {
// //       allNeeded.add(p);
// //       dependencyMap[p]?.forEach((d) => allNeeded.add(d));
// //     });

// //     const projectStage: any = { timestamp: 1, Genset_Run_SS: 1 };
// //     allNeeded.forEach((f) => (projectStage[f] = 1));

// //     // ----------------------
// //     // MATCH STAGE
// //     // ----------------------
// //     const matchStage: any = { timestamp: { $gte: startISO, $lte: endISO } };
// //     if (mode === 'range') matchStage.Genset_Run_SS = { $gte: 1 };

// //     // ----------------------
// //     // AGGREGATION PIPELINE
// //     // ----------------------
// //     const pipeline: any[] = [
// //       { $match: matchStage },
// //       { $project: projectStage },
// //       { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
// //     ];

// //     const aggCursor = this.collection.aggregate(pipeline, {
// //       allowDiskUse: true,
// //     });
// //     const results: any[] = [];
// //     let prevDoc: any = null;

// //     // ----------------------
// //     // APPLY FORMULAS
// //     // ----------------------
// //     for await (const doc of aggCursor) {
// //       const record: any = { timestamp: doc.timestamp };

// //       selectedParams.forEach((param) => {
// //         let value: any = null;

// //         switch (param) {
// //           case 'Load_Percent':
// //             value = this.formulasService.calculateLoadPercent(doc);
// //             break;
// //           case 'Current_Imbalance':
// //             value = this.formulasService.calculateCurrentImbalance(doc);
// //             break;
// //           case 'Voltage_Imbalance':
// //             value = this.formulasService.calculateVoltageImbalance(doc);
// //             break;
// //           case 'Power_Loss_Factor':
// //             value = this.formulasService.calculatePowerLossFactor(doc);
// //             break;
// //           case 'Thermal_Stress':
// //             value = this.formulasService.calculateThermalStress(doc);
// //             break;
// //           case 'Lubrication_Risk_Index':
// //             value = this.formulasService.calculateLubricationRiskIndex(doc);
// //             break;
// //           case 'Air_Fuel_Effectiveness':
// //             value = this.formulasService.calculateAirFuelEffectiveness(doc);
// //             break;
// //           case 'Specific_Fuel_Consumption':
// //             value = this.formulasService.calculateSpecificFuelConsumption(doc);
// //             break;
// //           case 'Heat_Rate':
// //             value = this.formulasService.calculateHeatRate(doc);
// //             break;
// //           case 'Coolant_TemperatureC':
// //             value = this.formulasService.convertCoolantToCelsius(doc);
// //             break;
// //           case 'Oil_TemperatureC':
// //             value = this.formulasService.convertOilTempToCelsius(doc);
// //             break;
// //           case 'Mechanical_Stress':
// //             value = this.formulasService.calculateMechanicalStress(doc);
// //             break;
// //           case 'Cooling_Margin':
// //             value = this.formulasService.calculateCoolingMarginF(doc);
// //             break;
// //           case 'OTSR':
// //             value = this.formulasService.calculateOTSRF(doc);
// //             break;
// //           case 'Fuel_Flow_Change':
// //             value = this.formulasService.calculateFuelFlowRateChange(
// //               doc,
// //               prevDoc,
// //             );
// //             break;
// //           default:
// //             value = doc[param] ?? null;
// //         }

// //         record[param] =
// //           value === undefined || Number.isNaN(value) ? null : value;
// //       });

// //       record.Genset_Run_SS = doc.Genset_Run_SS ?? null;
// //       results.push(record);
// //       prevDoc = doc;
// //     }

// //     return results;
// //   }
// // }

// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from './formulas.service';
// import { params } from 'utils/param-groups';

// @Injectable()
// export class TrendsService {
//   private collection;
//   private cache: Record<string, any[]> = {}; // Cache for prewarmed data

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('navy_12s');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   getList() {
//     return params;
//   }
//   /**
//    * Main trends function with dependency-aware projection and caching
//    */
//   async getTrends(payload: any) {
//     const {
//       mode,
//       startDate,
//       endDate,
//       params: selectedParams = [],
//       sortOrder = 'asc',
//       useCache = true, // flag to check cache
//     } = payload;

//     if (!mode) throw new Error('Mode is required');

//     const key = this.getCacheKey(payload);
//     if (useCache && this.cache[key]) return this.cache[key];

//     const startISO = new Date(startDate).toISOString();
//     const endISO = new Date(endDate).toISOString();

//     // ----------------------
//     // Dependency map for formulas
//     // ----------------------
//     const dependencyMap: Record<string, string[]> = {
//       Load_Percent: ['Genset_Total_kW', 'Genset_Application_kW_Rating_PC2X'],
//       Voltage_Imbalance: [
//         'Genset_L1L2_Voltage',
//         'Genset_L2L3_Voltage',
//         'Genset_L3L1_Voltage',
//       ],
//       Current_Imbalance: [
//         'Genset_L1_Current',
//         'Genset_L2_Current',
//         'Genset_L3_Current',
//       ],
//       Power_Loss_Factor: ['Genset_Total_Power_Factor_calculated'],
//       Thermal_Stress: [
//         'Genset_L1_Current',
//         'Genset_L2_Current',
//         'Genset_L3_Current',
//         'Genset_Application_kW_Rating_PC2X',
//       ],
//       RPM_Stability_Index: ['Averagr_Engine_Speed'],
//       Oscillation_Index: ['Genset_Total_kW', 'Genset_Total_kVA'],
//       Fuel_Consumption: [
//         'Fuel_Rate',
//         'Genset_Total_kW',
//         'Genset_Application_kW_Rating_PC2X',
//       ],
//       Lubrication_Risk_Index: ['Oil_Temperature', 'Oil_Pressure'],
//       Air_Fuel_Effectiveness: ['Air_Flow', 'Fuel_Rate'],
//       Specific_Fuel_Consumption: ['Genset_Total_kW', 'Fuel_Rate'],
//       Heat_Rate: ['Fuel_Rate', 'Genset_Total_kW'],
//       Mechanical_Stress: ['Vibration_Amplitude', 'Genset_Total_kW'],
//       Cooling_Margin: ['Coolant_Temperature', 'Oil_Temperature'],
//       OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
//       Fuel_Flow_Change: ['Fuel_Rate'],
//       Coolant_TemperatureC: ['Coolant_Temperature'],
//       Oil_TemperatureC: ['Oil_Temperature'],
//     };

//     // ----------------------
//     // Build projection including dependencies
//     // ----------------------
//     const allNeeded = new Set<string>();
//     selectedParams.forEach((p) => {
//       allNeeded.add(p);
//       dependencyMap[p]?.forEach((d) => allNeeded.add(d));
//     });

//     const projectStage: any = { timestamp: 1, Genset_Run_SS: 1 };
//     allNeeded.forEach((f) => (projectStage[f] = 1));

//     // ----------------------
//     // MATCH STAGE
//     // ----------------------
//     const matchStage: any = { timestamp: { $gte: startISO, $lte: endISO } };
//     if (mode === 'range') matchStage.Genset_Run_SS = { $gte: 1 };

//     // ----------------------
//     // AGGREGATION PIPELINE
//     // ----------------------
//     const pipeline: any[] = [
//       { $match: matchStage },
//       { $project: projectStage },
//       { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
//     ];

//     const aggCursor = this.collection.aggregate(pipeline, {
//       allowDiskUse: true,
//     });
//     const results: any[] = [];
//     let prevDoc: any = null;

//     // ----------------------
//     // APPLY FORMULAS
//     // ----------------------
//     for await (const doc of aggCursor) {
//       const record: any = { timestamp: doc.timestamp };

//       selectedParams.forEach((param) => {
//         let value: any = null;

//         switch (param) {
//           case 'Load_Percent':
//             value = this.formulasService.calculateLoadPercent(doc);
//             break;
//           case 'Current_Imbalance':
//             value = this.formulasService.calculateCurrentImbalance(doc);
//             break;
//           case 'Voltage_Imbalance':
//             value = this.formulasService.calculateVoltageImbalance(doc);
//             break;
//           case 'Power_Loss_Factor':
//             value = this.formulasService.calculatePowerLossFactor(doc);
//             break;
//           case 'Thermal_Stress':
//             value = this.formulasService.calculateThermalStress(doc);
//             break;
//           case 'Lubrication_Risk_Index':
//             value = this.formulasService.calculateLubricationRiskIndex(doc);
//             break;
//           case 'Air_Fuel_Effectiveness':
//             value = this.formulasService.calculateAirFuelEffectiveness(doc);
//             break;
//           case 'Specific_Fuel_Consumption':
//             value = this.formulasService.calculateSpecificFuelConsumption(doc);
//             break;
//           case 'Heat_Rate':
//             value = this.formulasService.calculateHeatRate(doc);
//             break;
//           case 'Coolant_TemperatureC':
//             value = this.formulasService.convertCoolantToCelsius(doc);
//             break;
//           case 'Oil_TemperatureC':
//             value = this.formulasService.convertOilTempToCelsius(doc);
//             break;
//           case 'Mechanical_Stress':
//             value = this.formulasService.calculateMechanicalStress(doc);
//             break;
//           case 'Cooling_Margin':
//             value = this.formulasService.calculateCoolingMarginF(doc);
//             break;
//           case 'OTSR':
//             value = this.formulasService.calculateOTSRF(doc);
//             break;
//           case 'Fuel_Flow_Change':
//             value = this.formulasService.calculateFuelFlowRateChange(
//               doc,
//               prevDoc,
//             );
//             break;
//           default:
//             value = doc[param] ?? null;
//         }

//         record[param] =
//           value === undefined || Number.isNaN(value) ? null : value;
//       });

//       record.Genset_Run_SS = doc.Genset_Run_SS ?? null;
//       results.push(record);
//       prevDoc = doc;
//     }

//     // Cache results
//     this.cache[key] = results;

//     return results;
//   }

//   /** Utility to generate cache key */
//   private getCacheKey(cfg: any) {
//     return `${cfg.mode}_${cfg.startDate ?? ''}_${cfg.endDate ?? ''}_${cfg.params?.join(',')}`;
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from './formulas.service';
import { params } from 'utils/param-groups';

@Injectable()
export class TrendsService {
  private collection;
  private cache: Record<string, any[]> = {}; // Cache for prewarmed data

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulasService: FormulasService,
  ) {
    this.collection = this.db.collection('navy_12s');
    this.collection.createIndex({ timestamp: 1 });
  }

  getList() {
    return params;
  }

  /**
   * Main trends function with dependency-aware projection and caching
   */
  async getTrends(payload: any) {
    const {
      mode,
      startDate,
      endDate,
      params: selectedParams = [],
      sortOrder = 'asc',
      useCache = true,
    } = payload;

    if (!mode) throw new Error('Mode is required');

    const key = this.getCacheKey(payload);
    if (useCache && this.cache[key]) return this.cache[key];

    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate).toISOString();

    const dependencyMap: Record<string, string[]> = {
      Load_Percent: ['Genset_Total_kW', 'Genset_Application_kW_Rating_PC2X'],
      Voltage_Imbalance: [
        'Genset_L1L2_Voltage',
        'Genset_L2L3_Voltage',
        'Genset_L3L1_Voltage',
      ],
      Current_Imbalance: [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
      ],
      Power_Loss_Factor: ['Genset_Total_Power_Factor_calculated'],
      Thermal_Stress: [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
        'Genset_Application_kW_Rating_PC2X',
      ],
      RPM_Stability_Index: ['Averagr_Engine_Speed'],
      Oscillation_Index: ['Genset_Total_kW', 'Genset_Total_kVA'],
      Fuel_Consumption: [
        'Fuel_Rate',
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
      ],
      Lubrication_Risk_Index: ['Oil_Temperature', 'Oil_Pressure'],
      Air_Fuel_Effectiveness: ['Air_Flow', 'Fuel_Rate'],
      Specific_Fuel_Consumption: ['Genset_Total_kW', 'Fuel_Rate'],
      Heat_Rate: ['Fuel_Rate', 'Genset_Total_kW'],
      Mechanical_Stress: ['Vibration_Amplitude', 'Genset_Total_kW'],
      Cooling_Margin: ['Coolant_Temperature', 'Oil_Temperature'],
      OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
      Fuel_Flow_Change: ['Fuel_Rate'],
      Coolant_TemperatureC: ['Coolant_Temperature'],
      Oil_TemperatureC: ['Oil_Temperature'],
    };

    const allNeeded = new Set<string>();
    selectedParams.forEach((p) => {
      allNeeded.add(p);
      dependencyMap[p]?.forEach((d) => allNeeded.add(d));
    });

    const projectStage: any = { timestamp: 1, Genset_Run_SS: 1 };
    allNeeded.forEach((f) => (projectStage[f] = 1));

    const matchStage: any = { timestamp: { $gte: startISO, $lte: endISO } };
    if (mode === 'range') matchStage.Genset_Run_SS = { $gte: 1 };

    const pipeline: any[] = [
      { $match: matchStage },
      { $project: projectStage },
      { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
    ];

    const aggCursor = this.collection.aggregate(pipeline, {
      allowDiskUse: true,
    });
    const results: any[] = [];
    let prevDoc: any = null;

    for await (const doc of aggCursor) {
      // ----------------------
      // Convert timestamp to human-readable format
      // ----------------------
      const date = new Date(doc.timestamp);
      const formattedTimestamp = `${date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
      })}, ${date.toLocaleTimeString('en-US', { hour12: false })}`;

      const record: any = { timestamp: formattedTimestamp };

      selectedParams.forEach((param) => {
        let value: any = null;

        switch (param) {
          case 'Load_Percent':
            value = this.formulasService.calculateLoadPercent(doc);
            break;
          case 'Current_Imbalance':
            value = this.formulasService.calculateCurrentImbalance(doc);
            break;
          case 'Voltage_Imbalance':
            value = this.formulasService.calculateVoltageImbalance(doc);
            break;
          case 'Power_Loss_Factor':
            value = this.formulasService.calculatePowerLossFactor(doc);
            break;
          case 'Thermal_Stress':
            value = this.formulasService.calculateThermalStress(doc);
            break;
          case 'Lubrication_Risk_Index':
            value = this.formulasService.calculateLubricationRiskIndex(doc);
            break;
          case 'Air_Fuel_Effectiveness':
            value = this.formulasService.calculateAirFuelEffectiveness(doc);
            break;
          case 'Specific_Fuel_Consumption':
            value = this.formulasService.calculateSpecificFuelConsumption(doc);
            break;
          case 'Heat_Rate':
            value = this.formulasService.calculateHeatRate(doc);
            break;
          case 'Coolant_TemperatureC':
            value = this.formulasService.convertCoolantToCelsius(doc);
            break;
          case 'Oil_TemperatureC':
            value = this.formulasService.convertOilTempToCelsius(doc);
            break;
          case 'Mechanical_Stress':
            value = this.formulasService.calculateMechanicalStress(doc);
            break;
          case 'Cooling_Margin':
            value = this.formulasService.calculateCoolingMarginF(doc);
            break;
          case 'OTSR':
            value = this.formulasService.calculateOTSRF(doc);
            break;
          case 'Fuel_Flow_Change':
            value = this.formulasService.calculateFuelFlowRateChange(
              doc,
              prevDoc,
            );
            break;
          default:
            value = doc[param] ?? null;
        }

        record[param] =
          value === undefined || Number.isNaN(value) ? null : value;
      });

      record.Genset_Run_SS = doc.Genset_Run_SS ?? null;
      results.push(record);
      prevDoc = doc;
    }

    this.cache[key] = results;

    return results;
  }

  /** Utility to generate cache key */
  private getCacheKey(cfg: any) {
    return `${cfg.mode}_${cfg.startDate ?? ''}_${cfg.endDate ?? ''}_${
      cfg.params?.join(',') ?? ''
    }`;
  }
}
