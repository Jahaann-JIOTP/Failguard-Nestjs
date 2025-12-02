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
//       useCache = true,
//     } = payload;

//     if (!mode) throw new Error('Mode is required');

//     const key = this.getCacheKey(payload);
//     if (useCache && this.cache[key]) return this.cache[key];

//     const startISO = new Date(startDate).toISOString();
//     const endISO = new Date(endDate).toISOString();

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

//     const allNeeded = new Set<string>();
//     selectedParams.forEach((p) => {
//       allNeeded.add(p);
//       dependencyMap[p]?.forEach((d) => allNeeded.add(d));
//     });

//     const projectStage: any = { timestamp: 1, Genset_Run_SS: 1 };
//     allNeeded.forEach((f) => (projectStage[f] = 1));

//     const matchStage: any = { timestamp: { $gte: startISO, $lte: endISO } };
//     if (mode === 'range') matchStage.Genset_Run_SS = { $gte: 1 };

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

//     for await (const doc of aggCursor) {
//       // ----------------------
//       // Convert timestamp to human-readable format
//       // ----------------------
//       const date = new Date(doc.timestamp);
//       const formattedTimestamp = `${date.toLocaleString('en-US', {
//         month: 'short',
//         day: '2-digit',
//       })}, ${date.toLocaleTimeString('en-US', { hour12: false })}`;

//       const record: any = { timestamp: formattedTimestamp };

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

//     this.cache[key] = results;

//     return results;
//   }

//   /** Utility to generate cache key */
//   private getCacheKey(cfg: any) {
//     return `${cfg.mode}_${cfg.startDate ?? ''}_${cfg.endDate ?? ''}_${
//       cfg.params?.join(',') ?? ''
//     }`;
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
      // Convert timestamp to human-readable UTC format
      // ----------------------
      const date = new Date(doc.timestamp);
      const month = date.toUTCString().slice(8, 11); // "Nov"
      const day = ('0' + date.getUTCDate()).slice(-2); // "10"
      const hours = ('0' + date.getUTCHours()).slice(-2); // "04"
      const minutes = ('0' + date.getUTCMinutes()).slice(-2); // "42"
      const seconds = ('0' + date.getUTCSeconds()).slice(-2); // "52"
      const formattedTimestamp = `${month} ${day}, ${hours}:${minutes}:${seconds}`;

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
