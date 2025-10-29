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
import * as moment from 'moment-timezone';
import { performance } from 'perf_hooks';
import { params as ALL_PARAMS } from '../../utils/param-groups';

const cache = new Map();

@Injectable()
export class TrendsService {
  private collection;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulasService: FormulasService,
  ) {
    this.collection = this.db.collection('navy_historical');
    this.collection.createIndex({ timestamp: 1 });
  }

  // 🔹 return all parameters (for dropdown)
  async getList() {
    return params;
  }

  private formatTimestamp(value: any): string {
    if (!value) return '';

    const date = new Date(value); // use raw Mongo timestamp

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // async getTrends(payload: any) {
  //   const startPerf = performance.now();

  //   const {
  //     mode,
  //     startDate,
  //     endDate,
  //     params: selectedParams = [],
  //     sortOrder = 'asc',
  //   } = payload;

  //   if (!mode) throw new Error('Mode is required');

  //   // 🔹 Cache keys
  //   const baseKey = JSON.stringify({ mode, startDate, endDate });
  //   const finalKey = JSON.stringify({
  //     mode,
  //     startDate,
  //     endDate,
  //     selectedParams,
  //     sortOrder,
  //   });

  //   // ⚡ Cached instant return
  //   if (cache.has(finalKey)) {
  //     const data = cache.get(finalKey);
  //     console.log(`⚡ Instant from cache: ${performance.now() - startPerf} ms`);
  //     return data;
  //   }

  //   // ✅ Build query
  //   let query: any = {};
  //   if (mode === 'historic') {
  //     if (!startDate || !endDate)
  //       throw new Error('startDate and endDate are required');
  //     query.timestamp = {
  //       $gte: new Date(startDate),
  //       $lte: new Date(endDate),
  //     };
  //   } else if (mode === 'range') {
  //     query.Genset_Run_SS = { $gte: 1, $lte: 6 };
  //   } else {
  //     throw new Error('Invalid mode');
  //   }

  //   // ✅ Dependency map (for derived/calculated ones)
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
  //     Fuel_Flow_Change: ['Fuel_Rate'],
  //     Cooling_Margin: ['Coolant_Temperature'],
  //     OTSR: ['Oil_Temperature'],
  //   };

  //   // ✅ Step 1: Load or query base data
  //   let baseData: any[] = (cache.get(baseKey) as any[]) || [];

  //   if (baseData.length === 0) {
  //     // 🧩 Always include timestamp
  //     const projection: Record<string, number> = { timestamp: 1 };

  //     // 🧩 Include all direct params (from utils/params.ts)
  //     for (const tag of ALL_PARAMS) projection[tag] = 1;

  //     // 🧩 Include any dependencies for selected params
  //     for (const param of selectedParams) {
  //       const deps = dependencyMap[param];
  //       if (deps) deps.forEach((d) => (projection[d] = 1));
  //     }

  //     const pipeline = [
  //       { $match: query },
  //       { $project: projection },
  //       { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
  //     ];

  //     const docs = await this.collection.aggregate(pipeline).toArray();

  //     baseData = docs.map((doc) => ({
  //       ...doc,
  //       timestamp: moment(doc.timestamp)
  //         .tz('Asia/Karachi')
  //         .format('YYYY-MM-DD HH:mm:ss.SSS'),
  //     }));

  //     cache.set(baseKey, baseData);
  //     console.log(`🧠 Base data cached: ${baseData.length} records`);
  //   }

  //   // ✅ Step 2: Multi-point calculations
  //   const calcPromises: Promise<{ key: string; val: any }>[] = [];

  //   const addCachedFormula = (param: string, fn: () => any) => {
  //     const key = `${param}_${baseKey}`;
  //     if (cache.has(key)) {
  //       return Promise.resolve({ key: param, val: cache.get(key) });
  //     } else {
  //       const result = fn();
  //       cache.set(key, result);
  //       return Promise.resolve({ key: param, val: result });
  //     }
  //   };

  //   if (selectedParams.includes('RPM_Stability_Index'))
  //     calcPromises.push(
  //       addCachedFormula('RPM_Stability_Index', () =>
  //         this.formulasService.calculateRPMStabilityWithLoad(baseData),
  //       ),
  //     );

  //   if (selectedParams.includes('Oscillation_Index'))
  //     calcPromises.push(
  //       addCachedFormula('Oscillation_Index', () =>
  //         this.formulasService.calculateOscillationIndex(baseData),
  //       ),
  //     );

  //   if (selectedParams.includes('Fuel_Consumption'))
  //     calcPromises.push(
  //       addCachedFormula('Fuel_Consumption', () =>
  //         this.formulasService.calculateFuelConsumption(baseData),
  //       ),
  //     );

  //   const resultsArray = await Promise.all(calcPromises);
  //   const results = Object.fromEntries(resultsArray.map((r) => [r.key, r.val]));

  //   // ✅ Step 3: Single-point formulas
  //   const singlePointData = baseData.map((doc) => {
  //     const record: any = { timestamp: doc.timestamp };

  //     for (const param of selectedParams) {
  //       if (
  //         [
  //           'RPM_Stability_Index',
  //           'Oscillation_Index',
  //           'Fuel_Consumption',
  //         ].includes(param)
  //       )
  //         continue;

  //       let value: any;
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
  //         case 'Neutral_Current':
  //           value = this.formulasService.calculateNeutralCurrent(doc);
  //           break;
  //         case 'Load_Stress':
  //           value = this.formulasService.calculateLoadStress(doc);
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
  //         case 'Mechanical_Stress':
  //           value = this.formulasService.calculateMechanicalStress(doc);
  //           break;
  //         case 'Cooling_Margin':
  //           value = this.formulasService.calculateCoolingMarginF(doc);
  //           break;
  //         case 'Fuel_Flow_Change':
  //           // value = this.formulasService.calculateFuelFlowChange(doc);
  //           break;
  //         case 'OTSR':
  //           value = this.formulasService.calculateOTSRF(doc);
  //           break;
  //         default:
  //           value = doc[param] ?? null; // direct DB field fallback
  //       }

  //       record[param] = value;
  //     }

  //     return record;
  //   });

  //   // ✅ Step 4: Merge multi-point results
  //   const merged = singlePointData.map((record) => {
  //     const timestamp = record.timestamp;
  //     for (const [param, arr] of Object.entries(results)) {
  //       const match = arr.find((x: any) => x.time === timestamp);
  //       if (match) Object.assign(record, match);
  //     }
  //     return record;
  //   });

  //   cache.set(finalKey, merged);
  //   const elapsed = performance.now() - startPerf;
  //   console.log(`✅ Response ready in ${elapsed.toFixed(2)} ms`);
  //   return merged;
  // }

  async getTrends(payload: any) {
    const startPerf = performance.now();

    const {
      mode,
      startDate,
      endDate,
      params: selectedParams = [],
      sortOrder = 'asc',
    } = payload;

    if (!mode) throw new Error('Mode is required');

    // 🔹 Cache keys
    const baseKey = JSON.stringify({ mode, startDate, endDate });
    const finalKey = JSON.stringify({
      mode,
      startDate,
      endDate,
      selectedParams,
      sortOrder,
    });

    // ⚡ Cached fast return
    if (cache.has(finalKey)) {
      const data = cache.get(finalKey);
      console.log(`⚡ Instant from cache: ${performance.now() - startPerf} ms`);
      return data;
    }

    // ✅ Query setup
    let query: any = {};
    if (mode === 'historic') {
      if (!startDate || !endDate)
        throw new Error('startDate and endDate are required');
      query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (mode === 'range') {
      query.Genset_Run_SS = { $gte: 1, $lte: 6 };
    } else {
      throw new Error('Invalid mode');
    }

    // ✅ Dependency Map
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
      Cooling_Margin_C: ['Coolant_Temperature', 'Oil_Temperature'],
      OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
      OTSR_C: ['Oil_Temperature', 'Coolant_Temperature'],
      Fuel_Flow_Change: ['Fuel_Rate'],
    };

    // ✅ Step 1: Check or build base cache (with batching)
    let baseData: any[] = (cache.get(baseKey) as any[]) || [];
    if (baseData.length === 0) {
      const projectionBase: Record<string, number> = { timestamp: 1 };

      const allNeeded = new Set<string>();
      for (const param of selectedParams) {
        allNeeded.add(param);
        const deps = dependencyMap[param];
        if (deps) deps.forEach((d) => allNeeded.add(d));
      }

      // Include ALL_PARAMS to make sure all raw tags exist
      ALL_PARAMS.forEach((p) => allNeeded.add(p));

      const allFields = Array.from(allNeeded);

      // 🧩 Batch in 12-field chunks
      const batches: string[][] = [];
      const batchSize = 12;
      for (let i = 0; i < allFields.length; i += batchSize) {
        batches.push(allFields.slice(i, i + batchSize));
      }

      console.time('⏳ Mongo parallel fetch');

      const results = await Promise.all(
        batches.map(async (fields) => {
          const projection: Record<string, number> = { ...projectionBase };
          for (const f of fields) projection[f] = 1;

          const pipeline = [
            { $match: query },
            { $project: projection },
            { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
          ];

          return await this.collection.aggregate(pipeline).toArray();
        }),
      );

      console.timeEnd('⏳ Mongo parallel fetch');

      // 🧩 Merge all batch results by timestamp
      const map = new Map<string, any>();
      for (const batch of results) {
        for (const doc of batch) {
          const key = doc.timestamp?.toISOString?.() ?? doc.timestamp;
          if (!map.has(key)) map.set(key, { timestamp: doc.timestamp });
          Object.assign(map.get(key), doc);
        }
      }

      baseData = Array.from(map.values()).map((doc) => ({
        ...doc,
        timestamp: moment(doc.timestamp)
          .tz('Asia/Karachi')
          .format('YYYY-MM-DD HH:mm:ss.SSS'),
      }));

      cache.set(baseKey, baseData);
      // console.log(`🧠 Base data cached: ${baseData.length} records`);
    }

    // ✅ Step 2: Multi-point formulas (parallel)
    const calcPromises: Promise<{ key: string; val: any }>[] = [];

    const addCachedFormula = (param: string, fn: () => any) => {
      const key = `${param}_${baseKey}`;
      if (cache.has(key)) {
        return Promise.resolve({ key: param, val: cache.get(key) });
      } else {
        const result = fn();
        cache.set(key, result);
        return Promise.resolve({ key: param, val: result });
      }
    };

    if (selectedParams.includes('RPM_Stability_Index'))
      calcPromises.push(
        addCachedFormula('RPM_Stability_Index', () =>
          this.formulasService.calculateRPMStabilityWithLoad(baseData),
        ),
      );

    if (selectedParams.includes('Oscillation_Index'))
      calcPromises.push(
        addCachedFormula('Oscillation_Index', () =>
          this.formulasService.calculateOscillationIndex(baseData),
        ),
      );

    if (selectedParams.includes('Fuel_Consumption'))
      calcPromises.push(
        addCachedFormula('Fuel_Consumption', () =>
          this.formulasService.calculateFuelConsumption(baseData),
        ),
      );

    const resultsArray = await Promise.all(calcPromises);
    const results = Object.fromEntries(resultsArray.map((r) => [r.key, r.val]));

    // ✅ Step 3: Single-point formulas
    const singlePointData = baseData.map((doc) => {
      const record: any = { timestamp: doc.timestamp };

      for (const param of selectedParams) {
        if (
          [
            'RPM_Stability_Index',
            'Oscillation_Index',
            'Fuel_Consumption',
          ].includes(param)
        )
          continue;

        let value: any;
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
          case 'Neutral_Current':
            value = this.formulasService.calculateNeutralCurrent(doc);
            break;
          case 'Load_Stress':
            value = this.formulasService.calculateLoadStress(doc);
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
            // value = this.formulasService.calculateFuelFlowChange(doc);
            break;
          default:
            value = doc[param] ?? null;
        }

        record[param] = value;
      }

      return record;
    });

    // ✅ Step 4: Merge multi-point results
    const merged = singlePointData.map((record) => {
      const timestamp = record.timestamp;
      for (const [param, arr] of Object.entries(results)) {
        const match = arr.find((x: any) => x.time === timestamp);
        if (match) Object.assign(record, match);
      }
      return record;
    });

    cache.set(finalKey, merged);
    const elapsed = performance.now() - startPerf;
    console.log(`✅ Response ready in ${elapsed.toFixed(2)} ms`);

    return merged;
  }
}
