/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from './formulas.service';
import { params } from 'utils/param-groups';

@Injectable()
export class TrendsService {
  private collection;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulasService: FormulasService,
  ) {
    this.collection = this.db.collection('navy_12s');
    this.collection.createIndex({ timestamp: 1 });
  }

  async getList() {
    return params;
  }

  // async getTrends(payload: any) {
  //   const {
  //     mode,
  //     startDate,
  //     endDate,
  //     params: selectedParams = [],
  //     sortOrder = 'asc',
  //     intervalMs = 12 * 1000, // default interval for historic mode
  //   } = payload;

  //   if (!mode) throw new Error('Mode is required');

  //   const sampleDoc = await this.collection.findOne(
  //     {},
  //     { projection: { timestamp: 1 } },
  //   );
  //   const timestampType =
  //     sampleDoc && typeof sampleDoc.timestamp === 'string' ? 'string' : 'date';

  //   const makeTimestampQuery = (start: Date, end: Date) =>
  //     timestampType === 'string'
  //       ? { timestamp: { $gte: start.toISOString(), $lte: end.toISOString() } }
  //       : { timestamp: { $gte: start, $lte: end } };

  //   const startISO = new Date(startDate);
  //   const endISO = new Date(endDate);

  //   // ----------------------
  //   // BUILD QUERY
  //   // ----------------------
  //   let query: any;
  //   if (mode === 'range') {
  //     query = {
  //       ...makeTimestampQuery(startISO, endISO),
  //       Genset_Run_SS: { $gte: 1 },
  //     };
  //   } else if (mode === 'historic') {
  //     query = makeTimestampQuery(startISO, endISO);
  //   } else {
  //     throw new Error('Invalid mode');
  //   }

  //   // ----------------------
  //   // DEPENDENCY MAP
  //   // ----------------------
  //   const dependencyMap: Record<string, string[]> = {
  //     Load_Percent: ['Genset_Total_kW', 'Genset_Application_kW_Rating_PC2X'],
  //     Voltage_Imbalance: [
  //       'Genset_L1L2_Voltage',
  //       'Genset_L2L3_Voltage',
  //       'Genset_L3L1_Voltage',
  //     ],
  //     Current_Imbalance: [
  //       'Genset_L1_Current',
  //       'Genset_L2_Current',
  //       'Genset_L3_Current',
  //     ],
  //     Power_Loss_Factor: ['Genset_Total_Power_Factor_calculated'],
  //     Thermal_Stress: [
  //       'Genset_L1_Current',
  //       'Genset_L2_Current',
  //       'Genset_L3_Current',
  //       'Genset_Application_kW_Rating_PC2X',
  //     ],
  //     RPM_Stability_Index: ['Averagr_Engine_Speed'],
  //     Oscillation_Index: ['Genset_Total_kW', 'Genset_Total_kVA'],
  //     Fuel_Consumption: [
  //       'Fuel_Rate',
  //       'Genset_Total_kW',
  //       'Genset_Application_kW_Rating_PC2X',
  //     ],
  //     Lubrication_Risk_Index: ['Oil_Temperature', 'Oil_Pressure'],
  //     Air_Fuel_Effectiveness: ['Air_Flow', 'Fuel_Rate'],
  //     Specific_Fuel_Consumption: ['Genset_Total_kW', 'Fuel_Rate'],
  //     Heat_Rate: ['Fuel_Rate', 'Genset_Total_kW'],
  //     Mechanical_Stress: ['Vibration_Amplitude', 'Genset_Total_kW'],
  //     Cooling_Margin: ['Coolant_Temperature', 'Oil_Temperature'],
  //     OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
  //     Fuel_Flow_Change: ['Fuel_Rate'],
  //     Coolant_TemepratureC: ['Coolant_Temperature'],
  //     Oil_TemepratureC: ['Oil_Temperature'],
  //   };

  //   // ----------------------
  //   // BUILD PROJECTION
  //   // ----------------------
  //   const allNeeded = new Set<string>();
  //   selectedParams.forEach((p) => {
  //     allNeeded.add(p);
  //     dependencyMap[p]?.forEach((d) => allNeeded.add(d));
  //   });

  //   const projection: any = { timestamp: 1, Genset_Run_SS: 1 };
  //   allNeeded.forEach((f) => (projection[f] = 1));

  //   // ----------------------
  //   // FETCH DOCS
  //   // ----------------------
  //   const cursor = this.collection
  //     .find(query)
  //     .project(projection)
  //     .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
  //     .batchSize(5000);

  //   // ----------------------
  //   // APPLY FORMULAS + INTERVAL GROUPING
  //   // ----------------------
  //   const recordMap = new Map<number, any>();
  //   let prevDoc: any = null;

  //   for await (const doc of cursor) {
  //     const ts =
  //       timestampType === 'string'
  //         ? new Date(doc.timestamp).getTime()
  //         : doc.timestamp.getTime();
  //     const bucketKey =
  //       intervalMs > 0 ? Math.floor(ts / intervalMs) * intervalMs : ts;

  //     if (!recordMap.has(bucketKey)) {
  //       recordMap.set(bucketKey, { timestamp: bucketKey, count: 0 });
  //     }

  //     const bucket = recordMap.get(bucketKey);
  //     bucket.count++;

  //     selectedParams.forEach((param) => {
  //       let value: any = null;
  //       switch (param) {
  //         case 'Load_Percent':
  //           value = this.formulasService.calculateLoadPercent(doc);
  //           break;
  //         case 'Current_Imbalance':
  //           value = this.formulasService.calculateCurrentImbalance(doc);
  //           break;
  //         case 'Voltage_Imbalance':
  //           value = this.formulasService.calculateVoltageImbalance(doc);
  //           break;
  //         case 'Power_Loss_Factor':
  //           value = this.formulasService.calculatePowerLossFactor(doc);
  //           break;
  //         case 'Thermal_Stress':
  //           value = this.formulasService.calculateThermalStress(doc);
  //           break;
  //         case 'Lubrication_Risk_Index':
  //           value = this.formulasService.calculateLubricationRiskIndex(doc);
  //           break;
  //         case 'Air_Fuel_Effectiveness':
  //           value = this.formulasService.calculateAirFuelEffectiveness(doc);
  //           break;
  //         case 'Specific_Fuel_Consumption':
  //           value = this.formulasService.calculateSpecificFuelConsumption(doc);
  //           break;
  //         case 'Heat_Rate':
  //           value = this.formulasService.calculateHeatRate(doc);
  //           break;
  //         case 'Coolant_TemperatureC':
  //           value = this.formulasService.convertCoolantToCelsius(doc);
  //           break;
  //         case 'Oil_TemperatureC':
  //           value = this.formulasService.convertOilTempToCelsius(doc);
  //           break;
  //         case 'Mechanical_Stress':
  //           value = this.formulasService.calculateMechanicalStress(doc);
  //           break;
  //         case 'Cooling_Margin':
  //           value = this.formulasService.calculateCoolingMarginF(doc);
  //           break;
  //         case 'OTSR':
  //           value = this.formulasService.calculateOTSRF(doc);
  //           break;
  //         case 'Fuel_Flow_Change':
  //           value = this.formulasService.calculateFuelFlowRateChange(
  //             doc,
  //             prevDoc ?? null,
  //           );
  //           break;
  //         default:
  //           value = doc[param] ?? null;
  //       }

  //       if (!bucket[param]) bucket[param] = 0;
  //       bucket[param] += value || 0;
  //     });

  //     // Last Genset_Run_SS for interval
  //     bucket['Genset_Run_SS'] = doc['Genset_Run_SS'] ?? 0;

  //     prevDoc = doc;
  //   }

  //   // ----------------------
  //   // AVERAGE VALUES PER INTERVAL
  //   // ----------------------
  //   const results: any[] = [];
  //   recordMap.forEach((bucket) => {
  //     const record: any = { timestamp: bucket.timestamp };
  //     selectedParams.forEach((p) => {
  //       record[p] = bucket[p] !== undefined ? bucket[p] / bucket.count : null;
  //     });
  //     record['Genset_Run_SS'] = bucket['Genset_Run_SS'];
  //     results.push(record);
  //   });

  //   // Sort final results
  //   results.sort((a, b) =>
  //     sortOrder === 'asc'
  //       ? a.timestamp - b.timestamp
  //       : b.timestamp - a.timestamp,
  //   );

  //   return results;
  // }

  async getTrends(payload: any) {
    const {
      mode,
      startDate,
      endDate,
      params: selectedParams = [],
      sortOrder = 'asc',
    } = payload;
    if (!mode) throw new Error('Mode is required');

    // Detect timestamp type (string or date)
    const sampleDoc = await this.collection.findOne(
      {},
      { projection: { timestamp: 1 } },
    );
    const timestampType =
      sampleDoc && typeof sampleDoc.timestamp === 'string' ? 'string' : 'date';

    const makeTimestampQuery = (start: Date, end: Date) =>
      timestampType === 'string'
        ? { timestamp: { $gte: start.toISOString(), $lte: end.toISOString() } }
        : { timestamp: { $gte: start, $lte: end } };

    const startISO = new Date(startDate);
    const endISO = new Date(endDate);

    // Build query
    let query: any;
    if (mode === 'range') {
      query = {
        ...makeTimestampQuery(startISO, endISO),
        Genset_Run_SS: { $gte: 1 },
      };
    } else if (mode === 'historic') {
      query = makeTimestampQuery(startISO, endISO);
    } else {
      throw new Error('Invalid mode');
    }

    // Dependency map for formulas
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

    // Build projection
    const allNeeded = new Set<string>();
    selectedParams.forEach((p) => {
      allNeeded.add(p);
      dependencyMap[p]?.forEach((d) => allNeeded.add(d));
    });
    const projection: any = { timestamp: 1, Genset_Run_SS: 1 };
    allNeeded.forEach((f) => (projection[f] = 1));

    // Cursor for streaming
    const cursor = this.collection
      .find(query)
      .project(projection)
      .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
      .batchSize(5000);

    const results: any[] = [];
    let prevDoc: any = null;

    // Interval for grouping (optional)
    const intervalMs = mode === 'historic' ? 12000 : 0; // 12 seconds for historic, 0 = raw

    for await (const doc of cursor) {
      const ts =
        timestampType === 'string'
          ? new Date(doc.timestamp).getTime()
          : doc.timestamp.getTime();
      const bucketKey =
        intervalMs > 0 ? Math.floor(ts / intervalMs) * intervalMs : ts;

      let record: any = { timestamp: bucketKey };

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

      record['Genset_Run_SS'] = doc['Genset_Run_SS'] ?? 0;
      results.push(record);

      prevDoc = doc;
    }

    return results;
  }
}
