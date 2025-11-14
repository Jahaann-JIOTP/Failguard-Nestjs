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
// // import * as moment from 'moment-timezone';
// // import { performance } from 'perf_hooks';
// // import { params as ALL_PARAMS } from '../../utils/param-groups';

// // const cache = new Map();

// // @Injectable()
// // export class TrendsService {
// //   private collection;

// //   constructor(
// //     @Inject('MONGO_CLIENT') private readonly db: Db,
// //     private readonly formulasService: FormulasService,
// //   ) {
// //     this.collection = this.db.collection('navy');
// //     this.collection.createIndex({ timestamp: 1 });
// //   }

// //   // 🔹 return all parameters (for dropdown)
// //   async getList() {
// //     return params;
// //   }

// //   private formatTimestamp(value: any): string {
// //     if (!value) return '';

// //     const date = new Date(value); // use raw Mongo timestamp

// //     const year = date.getFullYear();
// //     const month = (date.getMonth() + 1).toString().padStart(2, '0');
// //     const day = date.getDate().toString().padStart(2, '0');
// //     const hours = date.getHours().toString().padStart(2, '0');
// //     const minutes = date.getMinutes().toString().padStart(2, '0');
// //     const seconds = date.getSeconds().toString().padStart(2, '0');

// //     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
// //   }

// //   // async getTrends(payload: any) {
// //   //   const startPerf = performance.now();

// //   //   const {
// //   //     mode,
// //   //     startDate,
// //   //     endDate,
// //   //     params: selectedParams = [],
// //   //     sortOrder = 'asc',
// //   //   } = payload;

// //   //   if (!mode) throw new Error('Mode is required');

// //   //   // 🔹 Cache keys
// //   //   const baseKey = JSON.stringify({ mode, startDate, endDate });
// //   //   const finalKey = JSON.stringify({
// //   //     mode,
// //   //     startDate,
// //   //     endDate,
// //   //     selectedParams,
// //   //     sortOrder,
// //   //   });

// //   //   // ⚡ Cached fast return
// //   //   if (cache.has(finalKey)) {
// //   //     const data = cache.get(finalKey);
// //   //     console.log(`⚡ Instant from cache: ${performance.now() - startPerf} ms`);
// //   //     return data;
// //   //   }

// //   //   // ✅ Query setup
// //   //   let query: any = {};
// //   //   if (mode === 'historic') {
// //   //     if (!startDate || !endDate)
// //   //       throw new Error('startDate and endDate are required');
// //   //     query.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
// //   //   } else if (mode === 'range') {
// //   //     query.Genset_Run_SS = { $gte: 1, $lte: 6 };
// //   //   } else {
// //   //     throw new Error('Invalid mode');
// //   //   }

// //   //   // ✅ Dependency Map
// //   //   const dependencyMap: Record<string, string[]> = {
// //   //     Load_Percent: ['Genset_Total_kW', 'Genset_Application_kW_Rating_PC2X'],
// //   //     Voltage_Imbalance: [
// //   //       'Genset_L1L2_Voltage',
// //   //       'Genset_L2L3_Voltage',
// //   //       'Genset_L3L1_Voltage',
// //   //     ],
// //   //     Current_Imbalance: [
// //   //       'Genset_L1_Current',
// //   //       'Genset_L2_Current',
// //   //       'Genset_L3_Current',
// //   //     ],
// //   //     Power_Loss_Factor: ['Genset_Total_Power_Factor_calculated'],
// //   //     Thermal_Stress: [
// //   //       'Genset_L1_Current',
// //   //       'Genset_L2_Current',
// //   //       'Genset_L3_Current',
// //   //       'Genset_Application_kW_Rating_PC2X',
// //   //     ],
// //   //     RPM_Stability_Index: ['Averagr_Engine_Speed'],
// //   //     Oscillation_Index: ['Genset_Total_kW', 'Genset_Total_kVA'],
// //   //     Fuel_Consumption: [
// //   //       'Fuel_Rate',
// //   //       'Genset_Total_kW',
// //   //       'Genset_Application_kW_Rating_PC2X',
// //   //     ],
// //   //     Lubrication_Risk_Index: ['Oil_Temperature', 'Oil_Pressure'],
// //   //     Air_Fuel_Effectiveness: ['Air_Flow', 'Fuel_Rate'],
// //   //     Specific_Fuel_Consumption: ['Genset_Total_kW', 'Fuel_Rate'],
// //   //     Heat_Rate: ['Fuel_Rate', 'Genset_Total_kW'],
// //   //     Mechanical_Stress: ['Vibration_Amplitude', 'Genset_Total_kW'],
// //   //     Cooling_Margin: ['Coolant_Temperature', 'Oil_Temperature'],
// //   //     Cooling_Margin_C: ['Coolant_Temperature', 'Oil_Temperature'],
// //   //     OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
// //   //     OTSR_C: ['Oil_Temperature', 'Coolant_Temperature'],
// //   //     Fuel_Flow_Change: ['Fuel_Rate'],
// //   //   };

// //   //   // ✅ Step 1: Check or build base cache (with batching)
// //   //   let baseData: any[] = (cache.get(baseKey) as any[]) || [];
// //   //   if (baseData.length === 0) {
// //   //     const projectionBase: Record<string, number> = { timestamp: 1 };

// //   //     const allNeeded = new Set<string>();
// //   //     for (const param of selectedParams) {
// //   //       allNeeded.add(param);
// //   //       const deps = dependencyMap[param];
// //   //       if (deps) deps.forEach((d) => allNeeded.add(d));
// //   //     }

// //   //     // Include ALL_PARAMS to make sure all raw tags exist
// //   //     ALL_PARAMS.forEach((p) => allNeeded.add(p));

// //   //     const allFields = Array.from(allNeeded);

// //   //     // 🧩 Batch in 12-field chunks
// //   //     const batches: string[][] = [];
// //   //     const batchSize = 12;
// //   //     for (let i = 0; i < allFields.length; i += batchSize) {
// //   //       batches.push(allFields.slice(i, i + batchSize));
// //   //     }

// //   //     console.time('⏳ Mongo parallel fetch');

// //   //     const results = await Promise.all(
// //   //       batches.map(async (fields) => {
// //   //         const projection: Record<string, number> = { ...projectionBase };
// //   //         for (const f of fields) projection[f] = 1;

// //   //         const pipeline = [
// //   //           { $match: query },
// //   //           { $project: projection },
// //   //           { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
// //   //         ];

// //   //         return await this.collection.aggregate(pipeline).toArray();
// //   //       }),
// //   //     );

// //   //     console.timeEnd('⏳ Mongo parallel fetch');

// //   //     // 🧩 Merge all batch results by timestamp
// //   //     const map = new Map<string, any>();
// //   //     for (const batch of results) {
// //   //       for (const doc of batch) {
// //   //         const key = doc.timestamp?.toISOString?.() ?? doc.timestamp;
// //   //         if (!map.has(key)) map.set(key, { timestamp: doc.timestamp });
// //   //         Object.assign(map.get(key), doc);
// //   //       }
// //   //     }

// //   //     baseData = Array.from(map.values()).map((doc) => ({
// //   //       ...doc,
// //   //       timestamp: moment(doc.timestamp)
// //   //         .tz('Asia/Karachi')
// //   //         .format('YYYY-MM-DD HH:mm:ss.SSS'),
// //   //     }));

// //   //     cache.set(baseKey, baseData);
// //   //     console.log(`🧠 Base data cached: ${baseData.length} records`);
// //   //   }

// //   //   // ✅ Step 2: Multi-point formulas (parallel)
// //   //   const calcPromises: Promise<{ key: string; val: any }>[] = [];

// //   //   const addCachedFormula = (param: string, fn: () => any) => {
// //   //     const key = `${param}_${baseKey}`;
// //   //     if (cache.has(key)) {
// //   //       return Promise.resolve({ key: param, val: cache.get(key) });
// //   //     } else {
// //   //       const result = fn();
// //   //       cache.set(key, result);
// //   //       return Promise.resolve({ key: param, val: result });
// //   //     }
// //   //   };

// //   //   if (selectedParams.includes('RPM_Stability_Index'))
// //   //     calcPromises.push(
// //   //       addCachedFormula('RPM_Stability_Index', () =>
// //   //         this.formulasService.calculateRPMStabilityWithLoad(baseData),
// //   //       ),
// //   //     );

// //   //   if (selectedParams.includes('Oscillation_Index'))
// //   //     calcPromises.push(
// //   //       addCachedFormula('Oscillation_Index', () =>
// //   //         this.formulasService.calculateOscillationIndex(baseData),
// //   //       ),
// //   //     );

// //   //   if (selectedParams.includes('Fuel_Consumption'))
// //   //     calcPromises.push(
// //   //       addCachedFormula('Fuel_Consumption', () =>
// //   //         this.formulasService.calculateFuelConsumption(baseData),
// //   //       ),
// //   //     );

// //   //   const resultsArray = await Promise.all(calcPromises);
// //   //   const results = Object.fromEntries(resultsArray.map((r) => [r.key, r.val]));

// //   //   // ✅ Step 3: Single-point formulas
// //   //   const singlePointData = baseData.map((doc) => {
// //   //     const record: any = { timestamp: doc.timestamp };

// //   //     for (const param of selectedParams) {
// //   //       if (
// //   //         [
// //   //           'RPM_Stability_Index',
// //   //           'Oscillation_Index',
// //   //           'Fuel_Consumption',
// //   //         ].includes(param)
// //   //       )
// //   //         continue;

// //   //       let value: any;
// //   //       switch (param) {
// //   //         case 'Load_Percent':
// //   //           value = this.formulasService.calculateLoadPercent(doc);
// //   //           break;
// //   //         case 'Current_Imbalance':
// //   //           value = this.formulasService.calculateCurrentImbalance(doc);
// //   //           break;
// //   //         case 'Voltage_Imbalance':
// //   //           value = this.formulasService.calculateVoltageImbalance(doc);
// //   //           break;
// //   //         case 'Power_Loss_Factor':
// //   //           value = this.formulasService.calculatePowerLossFactor(doc);
// //   //           break;
// //   //         case 'Thermal_Stress':
// //   //           value = this.formulasService.calculateThermalStress(doc);
// //   //           break;
// //   //         case 'Neutral_Current':
// //   //           value = this.formulasService.calculateNeutralCurrent(doc);
// //   //           break;
// //   //         case 'Load_Stress':
// //   //           value = this.formulasService.calculateLoadStress(doc);
// //   //           break;
// //   //         case 'Lubrication_Risk_Index':
// //   //           value = this.formulasService.calculateLubricationRiskIndex(doc);
// //   //           break;
// //   //         case 'Air_Fuel_Effectiveness':
// //   //           value = this.formulasService.calculateAirFuelEffectiveness(doc);
// //   //           break;
// //   //         case 'Specific_Fuel_Consumption':
// //   //           value = this.formulasService.calculateSpecificFuelConsumption(doc);
// //   //           break;
// //   //         case 'Heat_Rate':
// //   //           value = this.formulasService.calculateHeatRate(doc);
// //   //           break;
// //   //         case 'Mechanical_Stress':
// //   //           value = this.formulasService.calculateMechanicalStress(doc);
// //   //           break;
// //   //         case 'Cooling_Margin':
// //   //           value = this.formulasService.calculateCoolingMarginF(doc);
// //   //           break;
// //   //         case 'OTSR':
// //   //           value = this.formulasService.calculateOTSRF(doc);
// //   //           break;
// //   //         case 'Fuel_Flow_Change':
// //   //           // value = this.formulasService.calculateFuelFlowChange(doc);
// //   //           break;
// //   //         default:
// //   //           value = doc[param] ?? null;
// //   //       }

// //   //       record[param] = value;
// //   //     }

// //   //     return record;
// //   //   });

// //   //   // ✅ Step 4: Merge multi-point results
// //   //   const merged = singlePointData.map((record) => {
// //   //     const timestamp = record.timestamp;
// //   //     for (const [param, arr] of Object.entries(results)) {
// //   //       const match = arr.find((x: any) => x.time === timestamp);
// //   //       if (match) Object.assign(record, match);
// //   //     }
// //   //     return record;
// //   //   });

// //   //   cache.set(finalKey, merged);
// //   //   const elapsed = performance.now() - startPerf;
// //   //   console.log(`✅ Response ready in ${elapsed.toFixed(2)} ms`);

// //   //   return merged;
// //   // }

// //   async getTrends(payload: any) {
// //     const startPerf = performance.now();

// //     const {
// //       mode,
// //       startDate,
// //       endDate,
// //       params: selectedParams = [],
// //       sortOrder = 'asc',
// //     } = payload;

// //     if (!mode) throw new Error('Mode is required');

// //     // 🔹 Cache keys
// //     const baseKey = JSON.stringify({ mode, startDate, endDate });
// //     const finalKey = JSON.stringify({
// //       mode,
// //       startDate,
// //       endDate,
// //       selectedParams,
// //       sortOrder,
// //     });

// //     // ⚡ Cached fast return
// //     if (cache.has(finalKey)) {
// //       const data = cache.get(finalKey);
// //       console.log(`⚡ Instant from cache: ${performance.now() - startPerf} ms`);
// //       return data;
// //     }

// //     // ✅ Query setup
// //     let query: any = {};

// //     if (mode === 'historic') {
// //       if (!startDate || !endDate)
// //         throw new Error('startDate and endDate are required');

// //       const startISO = moment.utc(startDate).toISOString();
// //       const endISO = moment.utc(endDate).toISOString();

// //       // ✅ Only filter by time range
// //       query = { timestamp: { $gte: startISO, $lte: endISO } };
// //     } else if (mode === 'range') {
// //       if (!startDate || !endDate)
// //         throw new Error('startDate and endDate are required');

// //       const startISO = moment.utc(startDate).toISOString();
// //       const endISO = moment.utc(endDate).toISOString();

// //       // ✅ Filter by both genset run state and time range
// //       query = {
// //         $and: [
// //           { Genset_Run_SS: { $gte: 1, $lte: 6 } },
// //           { timestamp: { $gte: startISO, $lte: endISO } },
// //         ],
// //       };
// //     } else if (mode === 'live') {
// //       const now = moment().tz('Asia/Karachi');
// //       const sixHoursAgo = now.clone().subtract(6, 'hours').toISOString();
// //       query = { timestamp: { $gte: sixHoursAgo } };
// //     } else {
// //       throw new Error('Invalid mode');
// //     }

// //     // ✅ Dependency Map
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
// //       Cooling_Margin_C: ['Coolant_Temperature', 'Oil_Temperature'],
// //       OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
// //       OTSR_C: ['Oil_Temperature', 'Coolant_Temperature'],
// //       Fuel_Flow_Change: ['Fuel_Rate'],
// //     };

// //     // ✅ Step 1: Load or build base data
// //     let baseData: any[] = (cache.get(baseKey) as any[]) || [];

// //     if (baseData.length === 0) {
// //       const projectionBase: Record<string, number> = { timestamp: 1 };

// //       const allNeeded = new Set<string>();
// //       for (const param of selectedParams) {
// //         allNeeded.add(param);
// //         const deps = dependencyMap[param];
// //         if (deps) deps.forEach((d) => allNeeded.add(d));
// //       }

// //       ALL_PARAMS.forEach((p) => allNeeded.add(p));

// //       const allFields = Array.from(allNeeded);

// //       // 🧩 Batch in 12-field chunks
// //       const batches: string[][] = [];
// //       const batchSize = 12;
// //       for (let i = 0; i < allFields.length; i += batchSize) {
// //         batches.push(allFields.slice(i, i + batchSize));
// //       }

// //       console.time('⏳ Mongo parallel fetch');

// //       const results = await Promise.all(
// //         batches.map(async (fields) => {
// //           const projection: Record<string, number> = { ...projectionBase };
// //           for (const f of fields) projection[f] = 1;

// //           const pipeline = [
// //             { $match: query },
// //             { $project: projection },
// //             { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
// //           ];

// //           return await this.collection.aggregate(pipeline).toArray();
// //         }),
// //       );

// //       console.timeEnd('⏳ Mongo parallel fetch');

// //       // 🧩 Merge all batch results by timestamp
// //       const map = new Map<string, any>();
// //       for (const batch of results) {
// //         for (const doc of batch) {
// //           const key = doc.timestamp;
// //           if (!map.has(key)) map.set(key, { timestamp: doc.timestamp });
// //           Object.assign(map.get(key), doc);
// //         }
// //       }

// //       baseData = Array.from(map.values()).map((doc) => ({
// //         ...doc,
// //         timestamp: moment(doc.timestamp)
// //           .tz('Asia/Karachi')
// //           .format('YYYY-MM-DD HH:mm:ss.SSS'),
// //       }));

// //       cache.set(baseKey, baseData);
// //       console.log(`🧠 Base data cached: ${baseData.length} records`);
// //     }

// //     // ✅ Step 2: Multi-point formulas
// //     const calcPromises: Promise<{ key: string; val: any }>[] = [];

// //     const addCachedFormula = (param: string, fn: () => any) => {
// //       const key = `${param}_${baseKey}`;
// //       if (cache.has(key)) {
// //         return Promise.resolve({ key: param, val: cache.get(key) });
// //       } else {
// //         const result = fn();
// //         cache.set(key, result);
// //         return Promise.resolve({ key: param, val: result });
// //       }
// //     };

// //     if (selectedParams.includes('RPM_Stability_Index'))
// //       calcPromises.push(
// //         addCachedFormula('RPM_Stability_Index', () =>
// //           this.formulasService.calculateRPMStabilityWithLoad(baseData),
// //         ),
// //       );

// //     if (selectedParams.includes('Oscillation_Index'))
// //       calcPromises.push(
// //         addCachedFormula('Oscillation_Index', () =>
// //           this.formulasService.calculateOscillationIndex(baseData),
// //         ),
// //       );

// //     if (selectedParams.includes('Fuel_Consumption'))
// //       calcPromises.push(
// //         addCachedFormula('Fuel_Consumption', () =>
// //           this.formulasService.calculateFuelConsumption(baseData),
// //         ),
// //       );

// //     const resultsArray = await Promise.all(calcPromises);
// //     const results = Object.fromEntries(resultsArray.map((r) => [r.key, r.val]));

// //     // ✅ Step 3: Single-point formulas
// //     const singlePointData = baseData.map((doc) => {
// //       const record: any = { timestamp: doc.timestamp };

// //       for (const param of selectedParams) {
// //         if (
// //           [
// //             'RPM_Stability_Index',
// //             'Oscillation_Index',
// //             'Fuel_Consumption',
// //           ].includes(param)
// //         )
// //           continue;

// //         let value: any;
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
// //           case 'Neutral_Current':
// //             value = this.formulasService.calculateNeutralCurrent(doc);
// //             break;
// //           case 'Load_Stress':
// //             value = this.formulasService.calculateLoadStress(doc);
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
// //           case 'Mechanical_Stress':
// //             value = this.formulasService.calculateMechanicalStress(doc);
// //             break;
// //           case 'Cooling_Margin':
// //             value = this.formulasService.calculateCoolingMarginF(doc);
// //             break;
// //           case 'OTSR':
// //             value = this.formulasService.calculateOTSRF(doc);
// //             break;
// //           default:
// //             value = doc[param] ?? null;
// //         }

// //         record[param] = value;
// //       }

// //       return record;
// //     });

// //     // ✅ Step 4: Merge multi-point results
// //     let merged = singlePointData.map((record) => {
// //       const timestamp = record.timestamp;
// //       for (const [param, arr] of Object.entries(results)) {
// //         const match = arr.find((x: any) => x.time === timestamp);
// //         if (match) Object.assign(record, match);
// //       }
// //       return record;
// //     });

// //     // ✅ Step 5: Live mode — reduce to 5-min intervals
// //     if (mode === 'live') {
// //       const fiveMinData: any[] = [];
// //       const seen: Record<string, boolean> = {};

// //       for (const doc of merged) {
// //         const rounded = moment(doc.timestamp)
// //           .startOf('minute')
// //           .minute(Math.floor(moment(doc.timestamp).minute() / 5) * 5)
// //           .format('YYYY-MM-DD HH:mm');

// //         if (!seen[rounded]) {
// //           seen[rounded] = true;
// //           fiveMinData.push(doc);
// //         }
// //       }

// //       merged = fiveMinData;
// //     }

// //     cache.set(finalKey, merged);
// //     const elapsed = performance.now() - startPerf;
// //     console.log(`✅ Response ready in ${elapsed.toFixed(2)} ms`);

// //     return merged;
// //   }
// // }

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
// // import * as moment from 'moment-timezone';
// // import { performance } from 'perf_hooks';
// // import { params as ALL_PARAMS } from '../../utils/param-groups';

// // const cache = new Map();

// // @Injectable()
// // export class TrendsService {
// //   private collection;

// //   constructor(
// //     @Inject('MONGO_CLIENT') private readonly db: Db,
// //     private readonly formulasService: FormulasService,
// //   ) {
// //     this.collection = this.db.collection('navy');
// //     this.collection.createIndex({ timestamp: 1 });
// //   }

// //   async getList() {
// //     return params;
// //   }

// //   async getTrends(payload: any) {
// //     const startPerf = performance.now();

// //     const {
// //       mode,
// //       startDate,
// //       endDate,
// //       params: selectedParams = [],
// //       sortOrder = 'asc',
// //     } = payload;

// //     if (!mode) throw new Error('Mode is required');

// //     const baseKey = JSON.stringify({ mode, startDate, endDate });
// //     const finalKey = JSON.stringify({
// //       mode,
// //       startDate,
// //       endDate,
// //       selectedParams,
// //       sortOrder,
// //     });

// //     // ⚡ Cached fast return
// //     if (cache.has(finalKey)) {
// //       const data = cache.get(finalKey);
// //       console.log(`⚡ Instant from cache: ${performance.now() - startPerf} ms`);
// //       return data;
// //     }

// //     // ✅ Build query
// //     let query: any = {};

// //     if (mode === 'historic') {
// //       // Fetch all records between dates
// //       if (!startDate || !endDate)
// //         throw new Error('startDate and endDate are required');

// //       const startISO = new Date(startDate);
// //       const endISO = new Date(endDate);

// //       query = { timestamp: { $gte: startISO, $lte: endISO } };
// //     } else if (mode === 'range') {
// //       if (!startDate || !endDate)
// //         throw new Error('startDate and endDate are required');

// //       const startISO = new Date(startDate);
// //       const endISO = new Date(endDate);

// //       // ⚡ Get first and last timestamp where genset was running (1–6)
// //       const [runRange] = await this.collection
// //         .aggregate([
// //           {
// //             $match: {
// //               timestamp: { $gte: startISO, $lte: endISO },
// //               Genset_Run_SS: { $gte: 1, $lte: 6 },
// //             },
// //           },
// //           {
// //             $group: {
// //               _id: null,
// //               minTime: { $min: '$timestamp' },
// //               maxTime: { $max: '$timestamp' },
// //             },
// //           },
// //         ])
// //         .toArray();

// //       if (runRange?.minTime && runRange?.maxTime) {
// //         query = {
// //           timestamp: {
// //             $gte: runRange.minTime,
// //             $lte: runRange.maxTime,
// //           },
// //         };
// //       } else {
// //         console.log('⚠️ No genset running data found in the given range');
// //         return [];
// //       }
// //     } else if (mode === 'live') {
// //       const now = moment().tz('Asia/Karachi');
// //       const sixHoursAgo = now.clone().subtract(6, 'hours').toDate();

// //       query = { timestamp: { $gte: sixHoursAgo } };
// //     } else {
// //       throw new Error('Invalid mode');
// //     }

// //     // ✅ Dependency Map
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
// //       Cooling_Margin_C: ['Coolant_Temperature', 'Oil_Temperature'],
// //       OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
// //       OTSR_C: ['Oil_Temperature', 'Coolant_Temperature'],
// //       Fuel_Flow_Change: ['Fuel_Rate'],
// //     };

// //     // ✅ Step 1: Load or build base data
// //     let baseData: any[] = (cache.get(baseKey) as any[]) || [];

// //     if (baseData.length === 0) {
// //       const projectionBase: Record<string, number> = { timestamp: 1 };

// //       const allNeeded = new Set<string>();
// //       for (const param of selectedParams) {
// //         allNeeded.add(param);
// //         const deps = dependencyMap[param];
// //         if (deps) deps.forEach((d) => allNeeded.add(d));
// //       }

// //       ALL_PARAMS.forEach((p) => allNeeded.add(p));

// //       const allFields = Array.from(allNeeded);

// //       const batches: string[][] = [];
// //       const batchSize = 12;
// //       for (let i = 0; i < allFields.length; i += batchSize) {
// //         batches.push(allFields.slice(i, i + batchSize));
// //       }

// //       console.time('⏳ Mongo parallel fetch');

// //       const results = await Promise.all(
// //         batches.map(async (fields) => {
// //           const projection: Record<string, number> = { ...projectionBase };
// //           for (const f of fields) projection[f] = 1;

// //           const pipeline = [
// //             { $match: query },
// //             { $project: projection },
// //             { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
// //           ];

// //           return await this.collection.aggregate(pipeline).toArray();
// //         }),
// //       );

// //       console.timeEnd('⏳ Mongo parallel fetch');

// //       const map = new Map<string, any>();
// //       for (const batch of results) {
// //         for (const doc of batch) {
// //           const key = doc.timestamp.toISOString();
// //           if (!map.has(key)) map.set(key, { timestamp: doc.timestamp });
// //           Object.assign(map.get(key), doc);
// //         }
// //       }

// //       baseData = Array.from(map.values()).map((doc) => ({
// //         ...doc,
// //         timestamp: moment(doc.timestamp)
// //           .tz('Asia/Karachi')
// //           .format('YYYY-MM-DD HH:mm:ss.SSS'),
// //       }));

// //       cache.set(baseKey, baseData);
// //       console.log(`🧠 Base data cached: ${baseData.length} records`);
// //     }

// //     // ✅ Step 2: Multi-point formulas
// //     const calcPromises: Promise<{ key: string; val: any }>[] = [];
// //     const addCachedFormula = (param: string, fn: () => any) => {
// //       const key = `${param}_${baseKey}`;
// //       if (cache.has(key)) {
// //         return Promise.resolve({ key: param, val: cache.get(key) });
// //       } else {
// //         const result = fn();
// //         cache.set(key, result);
// //         return Promise.resolve({ key: param, val: result });
// //       }
// //     };

// //     if (selectedParams.includes('RPM_Stability_Index'))
// //       calcPromises.push(
// //         addCachedFormula('RPM_Stability_Index', () =>
// //           this.formulasService.calculateRPMStabilityWithLoad(baseData),
// //         ),
// //       );

// //     if (selectedParams.includes('Oscillation_Index'))
// //       calcPromises.push(
// //         addCachedFormula('Oscillation_Index', () =>
// //           this.formulasService.calculateOscillationIndex(baseData),
// //         ),
// //       );

// //     if (selectedParams.includes('Fuel_Consumption'))
// //       calcPromises.push(
// //         addCachedFormula('Fuel_Consumption', () =>
// //           this.formulasService.calculateFuelConsumption(baseData),
// //         ),
// //       );

// //     const resultsArray = await Promise.all(calcPromises);
// //     const results = Object.fromEntries(resultsArray.map((r) => [r.key, r.val]));

// //     // ✅ Step 3: Single-point formulas
// //     const singlePointData = baseData.map((doc) => {
// //       const record: any = { timestamp: doc.timestamp };

// //       for (const param of selectedParams) {
// //         if (
// //           [
// //             'RPM_Stability_Index',
// //             'Oscillation_Index',
// //             'Fuel_Consumption',
// //           ].includes(param)
// //         )
// //           continue;

// //         let value: any;
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
// //           case 'Neutral_Current':
// //             value = this.formulasService.calculateNeutralCurrent(doc);
// //             break;
// //           case 'Load_Stress':
// //             value = this.formulasService.calculateLoadStress(doc);
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
// //           case 'Mechanical_Stress':
// //             value = this.formulasService.calculateMechanicalStress(doc);
// //             break;
// //           case 'Cooling_Margin':
// //             value = this.formulasService.calculateCoolingMarginF(doc);
// //             break;
// //           case 'OTSR':
// //             value = this.formulasService.calculateOTSRF(doc);
// //             break;
// //           default:
// //             value = doc[param] ?? null;
// //         }

// //         record[param] = value;
// //       }

// //       return record;
// //     });

// //     // ✅ Step 4: Merge multi-point results
// //     let merged = singlePointData.map((record) => {
// //       const timestamp = record.timestamp;
// //       for (const [param, arr] of Object.entries(results)) {
// //         const match = arr.find((x: any) => x.time === timestamp);
// //         if (match) Object.assign(record, match);
// //       }
// //       return record;
// //     });

// //     // ✅ Step 5: Live mode – reduce to 5-minute intervals
// //     if (mode === 'live') {
// //       const fiveMinData: any[] = [];
// //       const seen: Record<string, boolean> = {};

// //       for (const doc of merged) {
// //         const rounded = moment(doc.timestamp)
// //           .startOf('minute')
// //           .minute(Math.floor(moment(doc.timestamp).minute() / 5) * 5)
// //           .format('YYYY-MM-DD HH:mm');

// //         if (!seen[rounded]) {
// //           seen[rounded] = true;
// //           fiveMinData.push(doc);
// //         }
// //       }

// //       merged = fiveMinData;
// //     }

// //     cache.set(finalKey, merged);
// //     const elapsed = performance.now() - startPerf;
// //     console.log(`✅ Response ready in ${elapsed.toFixed(2)} ms`);

// //     return merged;
// //   }
// // }

// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/require-await */
// /* eslint-disable prefer-const */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */

// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from './formulas.service';
// import { params } from 'utils/param-groups';
// import * as moment from 'moment-timezone';
// import { performance } from 'perf_hooks';
// import { params as ALL_PARAMS } from '../../utils/param-groups';

// const cache = new Map();

// @Injectable()
// export class TrendsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('navy');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   async getList() {
//     return params;
//   }

//   // ✅ Check if a given payload is already cached
//   isCached(payload: any): boolean {
//     const {
//       mode,
//       startDate,
//       endDate,
//       params: selectedParams = [],
//       sortOrder = 'asc',
//     } = payload;
//     const finalKey = JSON.stringify({
//       mode,
//       startDate,
//       endDate,
//       selectedParams,
//       sortOrder,
//     });
//     return cache.has(finalKey);
//   }

//   // ✅ Optional cache cleaner (can be triggered manually)
//   clearCache(): void {
//     cache.clear();
//     console.log('🧹 TrendsService cache cleared');
//   }

//   // ✅ Unified caching key generator
//   private buildCacheKey(payload: any): string {
//     const {
//       mode,
//       startDate,
//       endDate,
//       params: selectedParams = [],
//       sortOrder = 'asc',
//     } = payload;
//     return JSON.stringify({
//       mode,
//       startDate,
//       endDate,
//       selectedParams,
//       sortOrder,
//     });
//   }

//   async getTrends(payload: any) {
//     const startPerf = performance.now();

//     const {
//       mode,
//       startDate,
//       endDate,
//       params: selectedParams = [],
//       sortOrder = 'asc',
//       force = false, // ✅ optional bypass flag
//     } = payload;

//     if (!mode) throw new Error('Mode is required');

//     const baseKey = JSON.stringify({ mode, startDate, endDate });
//     const finalKey = this.buildCacheKey(payload);

//     // ⚡ Fast return if cached (unless forced)
//     if (!force && cache.has(finalKey)) {
//       const data = cache.get(finalKey);
//       console.log(`⚡ Instant from cache: ${performance.now() - startPerf} ms`);
//       return data;
//     }

//     // ✅ Build query
//     let query: any = {};

//     if (mode === 'historic') {
//       if (!startDate || !endDate)
//         throw new Error('startDate and endDate are required');
//       query = {
//         timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
//       };
//     } else if (mode === 'range') {
//       if (!startDate || !endDate)
//         throw new Error('startDate and endDate are required');

//       const startISO = new Date(startDate);
//       const endISO = new Date(endDate);

//       const [runRange] = await this.collection
//         .aggregate([
//           {
//             $match: {
//               timestamp: { $gte: startISO, $lte: endISO },
//               Genset_Run_SS: { $gte: 1, $lte: 6 },
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               minTime: { $min: '$timestamp' },
//               maxTime: { $max: '$timestamp' },
//             },
//           },
//         ])
//         .toArray();

//       if (runRange?.minTime && runRange?.maxTime) {
//         query = {
//           timestamp: { $gte: runRange.minTime, $lte: runRange.maxTime },
//         };
//       } else {
//         console.log('⚠️ No genset running data found in the given range');
//         return [];
//       }
//     } else if (mode === 'live') {
//       const now = moment().tz('Asia/Karachi');
//       const sixHoursAgo = now.clone().subtract(6, 'hours').toDate();
//       query = { timestamp: { $gte: sixHoursAgo } };
//     } else {
//       throw new Error('Invalid mode');
//     }

//     // ✅ Dependency Map
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
//     };

//     // ✅ Step 1: Load or build base data
//     let baseData: any[] = (cache.get(baseKey) as any[]) || [];

//     if (force || baseData.length === 0) {
//       const projectionBase: Record<string, number> = { timestamp: 1 };
//       const allNeeded = new Set<string>();

//       for (const param of selectedParams) {
//         allNeeded.add(param);
//         const deps = dependencyMap[param];
//         if (deps) deps.forEach((d) => allNeeded.add(d));
//       }

//       ALL_PARAMS.forEach((p) => allNeeded.add(p));

//       const allFields = Array.from(allNeeded);
//       const batches: string[][] = [];
//       const batchSize = 12;

//       for (let i = 0; i < allFields.length; i += batchSize) {
//         batches.push(allFields.slice(i, i + batchSize));
//       }

//       console.time('⏳ Mongo parallel fetch');
//       const results = await Promise.all(
//         batches.map(async (fields) => {
//           const projection: Record<string, number> = { ...projectionBase };
//           for (const f of fields) projection[f] = 1;

//           const pipeline = [
//             { $match: query },
//             { $project: projection },
//             { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
//           ];
//           return await this.collection.aggregate(pipeline).toArray();
//         }),
//       );
//       console.timeEnd('⏳ Mongo parallel fetch');

//       const map = new Map<string, any>();
//       for (const batch of results) {
//         for (const doc of batch) {
//           const key = doc.timestamp.toISOString();
//           if (!map.has(key)) map.set(key, { timestamp: doc.timestamp });
//           Object.assign(map.get(key), doc);
//         }
//       }

//       baseData = Array.from(map.values()).map((doc) => ({
//         ...doc,
//         timestamp: moment(doc.timestamp)
//           .tz('Asia/Karachi')
//           .format('YYYY-MM-DD HH:mm:ss.SSS'),
//       }));

//       cache.set(baseKey, baseData);
//       console.log(`🧠 Base data cached: ${baseData.length} records`);
//     }

//     // ✅ Step 2: Multi-point formulas
//     const calcPromises: Promise<{ key: string; val: any }>[] = [];
//     const addCachedFormula = (param: string, fn: () => any) => {
//       const key = `${param}_${baseKey}`;
//       if (!force && cache.has(key)) {
//         return Promise.resolve({ key: param, val: cache.get(key) });
//       } else {
//         const result = fn();
//         cache.set(key, result);
//         return Promise.resolve({ key: param, val: result });
//       }
//     };

//     if (selectedParams.includes('RPM_Stability_Index'))
//       calcPromises.push(
//         addCachedFormula('RPM_Stability_Index', () =>
//           this.formulasService.calculateRPMStabilityWithLoad(baseData),
//         ),
//       );

//     if (selectedParams.includes('Oscillation_Index'))
//       calcPromises.push(
//         addCachedFormula('Oscillation_Index', () =>
//           this.formulasService.calculateOscillationIndex(baseData),
//         ),
//       );

//     if (selectedParams.includes('Fuel_Consumption'))
//       calcPromises.push(
//         addCachedFormula('Fuel_Consumption', () =>
//           this.formulasService.calculateFuelConsumption(baseData),
//         ),
//       );

//     const resultsArray = await Promise.all(calcPromises);
//     const results = Object.fromEntries(resultsArray.map((r) => [r.key, r.val]));

//     // ✅ Step 3: Single-point formulas
//     const singlePointData = baseData.map((doc) => {
//       const record: any = { timestamp: doc.timestamp };

//       for (const param of selectedParams) {
//         if (
//           [
//             'RPM_Stability_Index',
//             'Oscillation_Index',
//             'Fuel_Consumption',
//           ].includes(param)
//         )
//           continue;

//         let value: any;
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
//           case 'Neutral_Current':
//             value = this.formulasService.calculateNeutralCurrent(doc);
//             break;
//           case 'Load_Stress':
//             value = this.formulasService.calculateLoadStress(doc);
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
//           case 'Mechanical_Stress':
//             value = this.formulasService.calculateMechanicalStress(doc);
//             break;
//           case 'Cooling_Margin':
//             value = this.formulasService.calculateCoolingMarginF(doc);
//             break;
//           case 'OTSR':
//             value = this.formulasService.calculateOTSRF(doc);
//             break;
//           default:
//             value = doc[param] ?? null;
//         }

//         record[param] = value;
//       }

//       return record;
//     });

//     // ✅ Step 4: Merge multi-point results
//     let merged = singlePointData.map((record) => {
//       const timestamp = record.timestamp;
//       for (const [param, arr] of Object.entries(results)) {
//         const match = arr.find((x: any) => x.time === timestamp);
//         if (match) Object.assign(record, match);
//       }
//       return record;
//     });

//     // ✅ Step 5: Live mode – reduce to 5-minute intervals
//     if (mode === 'live') {
//       const fiveMinData: any[] = [];
//       const seen: Record<string, boolean> = {};

//       for (const doc of merged) {
//         const rounded = moment(doc.timestamp)
//           .startOf('minute')
//           .minute(Math.floor(moment(doc.timestamp).minute() / 5) * 5)
//           .format('YYYY-MM-DD HH:mm');

//         if (!seen[rounded]) {
//           seen[rounded] = true;
//           fiveMinData.push(doc);
//         }
//       }

//       merged = fiveMinData;
//     }

//     cache.set(finalKey, merged);
//     const elapsed = performance.now() - startPerf;
//     console.log(`✅ Response ready in ${elapsed.toFixed(2)} ms`);

//     return merged;
//   }
// }

// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/require-await */
// /* eslint-disable prefer-const */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */

// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from './formulas.service';
// import { params } from 'utils/param-groups';
// import * as moment from 'moment-timezone';
// import { performance } from 'perf_hooks';
// import { params as ALL_PARAMS } from '../../utils/param-groups';

// const cache = new Map();

// @Injectable()
// export class TrendsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('navy');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   async getList() {
//     return params;
//   }

//   // ✅ Check if cached
//   isCached(payload: any): boolean {
//     const key = this.buildCacheKey(payload);
//     return cache.has(key);
//   }

//   // ✅ Clear all cache
//   clearCache(): void {
//     cache.clear();
//     console.log('🧹 TrendsService cache cleared');
//   }

//   // ✅ Mode-independent cache key generator
//   private buildCacheKey(payload: any): string {
//     const {
//       mode,
//       startDate,
//       endDate,
//       params: selectedParams = [],
//       sortOrder = 'asc',
//     } = payload;

//     const isRangeMode = ['range', 'historic'].includes(mode);
//     return isRangeMode
//       ? JSON.stringify({ startDate, endDate, selectedParams, sortOrder })
//       : JSON.stringify({ mode, selectedParams, sortOrder });
//   }

// async getTrends(payload: any) {
//   const startPerf = performance.now();

//   const {
//     mode,
//     startDate,
//     endDate,
//     params: selectedParams = [],
//     sortOrder = 'asc',
//     force = false,
//   } = payload;

//   if (!mode) throw new Error('Mode is required');

//   // ✅ Shared cache for range & historic
//   const isRangeMode = ['range', 'historic'].includes(mode);
//   const baseKey = isRangeMode
//     ? JSON.stringify({ startDate, endDate })
//     : JSON.stringify({ mode });

//   const finalKey = this.buildCacheKey(payload);

//   // ⚡ Instant return from cache
//   if (!force && cache.has(finalKey)) {
//     console.log(`⚡ Cache hit for ${mode} (${startDate} → ${endDate})`);
//     const data = cache.get(finalKey);
//     console.log(
//       `⚡ Returned from cache in ${performance.now() - startPerf} ms`,
//     );
//     return data;
//   }

//   // ✅ Build Mongo query
//   let query: any = {};

//   if (mode === 'historic' || mode === 'range') {
//     if (!startDate || !endDate)
//       throw new Error('startDate and endDate are required');

//     const startISO = new Date(startDate);
//     const endISO = new Date(endDate);

//     if (mode === 'range') {
//       const [runRange] = await this.collection
//         .aggregate([
//           {
//             $match: {
//               timestamp: { $gte: startISO, $lte: endISO },
//               Genset_Run_SS: { $gte: 1, $lte: 6 },
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               minTime: { $min: '$timestamp' },
//               maxTime: { $max: '$timestamp' },
//             },
//           },
//         ])
//         .toArray();

//       if (runRange?.minTime && runRange?.maxTime) {
//         query = {
//           timestamp: {
//             $gte: runRange.minTime,
//             $lte: runRange.maxTime,
//           },
//         };
//       } else {
//         console.log('⚠️ No genset running data found in range');
//         return [];
//       }
//     } else {
//       query = { timestamp: { $gte: startISO, $lte: endISO } };
//     }
//   } else if (mode === 'live') {
//     const now = moment().tz('Asia/Karachi');
//     const sixHoursAgo = now.clone().subtract(6, 'hours').toDate();
//     query = { timestamp: { $gte: sixHoursAgo } };
//   } else {
//     throw new Error('Invalid mode');
//   }

//   // ✅ Dependency Map
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
//   };

//   // ✅ Step 1: Base data
//   let baseData: any[] = (cache.get(baseKey) as any[]) || [];

//   if (force || baseData.length === 0) {
//     const projectionBase: Record<string, number> = { timestamp: 1 };
//     const allNeeded = new Set<string>();

//     for (const param of selectedParams) {
//       allNeeded.add(param);
//       const deps = dependencyMap[param];
//       if (deps) deps.forEach((d) => allNeeded.add(d));
//     }

//     ALL_PARAMS.forEach((p) => allNeeded.add(p));

//     const allFields = Array.from(allNeeded);
//     const batchSize = 12;
//     const batches: string[][] = [];

//     for (let i = 0; i < allFields.length; i += batchSize) {
//       batches.push(allFields.slice(i, i + batchSize));
//     }

//     console.time('⏳ Mongo parallel fetch');
//     const results = await Promise.all(
//       batches.map(async (fields) => {
//         const projection: Record<string, number> = { ...projectionBase };
//         for (const f of fields) projection[f] = 1;
//         const pipeline = [
//           { $match: query },
//           { $project: projection },
//           { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
//         ];
//         return await this.collection.aggregate(pipeline).toArray();
//       }),
//     );
//     console.timeEnd('⏳ Mongo parallel fetch');

//     const map = new Map<string, any>();
//     for (const batch of results) {
//       for (const doc of batch) {
//         const key = doc.timestamp.toISOString();
//         if (!map.has(key)) map.set(key, { timestamp: doc.timestamp });
//         Object.assign(map.get(key), doc);
//       }
//     }

//     baseData = Array.from(map.values()).map((doc) => ({
//       ...doc,
//       timestamp: moment(doc.timestamp)
//         .tz('Asia/Karachi')
//         .format('YYYY-MM-DD HH:mm:ss.SSS'),
//     }));

//     cache.set(baseKey, baseData);
//     console.log(
//       `🧠 Base data cached (${baseData.length} records) for ${startDate} → ${endDate}`,
//     );
//   }

//   // ✅ Step 2: Multi-point formulas
//   const calcPromises: Promise<{ key: string; val: any }>[] = [];
//   const addCachedFormula = (param: string, fn: () => any) => {
//     const key = `${param}_${baseKey}`;
//     if (!force && cache.has(key)) {
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
//         case 'OTSR':
//           value = this.formulasService.calculateOTSRF(doc);
//           break;
//         default:
//           value = doc[param] ?? null;
//       }
//       record[param] = value;
//     }

//     return record;
//   });

//   // ✅ Step 4: Merge multi-point results
//   let merged = singlePointData.map((record) => {
//     const timestamp = record.timestamp;
//     for (const [param, arr] of Object.entries(results)) {
//       const match = arr.find((x: any) => x.time === timestamp);
//       if (match) Object.assign(record, match);
//     }
//     return record;
//   });

//   // ✅ Step 5: Live mode reduce
//   if (mode === 'live') {
//     const fiveMinData: any[] = [];
//     const seen: Record<string, boolean> = {};

//     for (const doc of merged) {
//       const rounded = moment(doc.timestamp)
//         .startOf('minute')
//         .minute(Math.floor(moment(doc.timestamp).minute() / 5) * 5)
//         .format('YYYY-MM-DD HH:mm');

//       if (!seen[rounded]) {
//         seen[rounded] = true;
//         fiveMinData.push(doc);
//       }
//     }

//     merged = fiveMinData;
//   }

//   cache.set(finalKey, merged);
//   const elapsed = performance.now() - startPerf;
//   console.log(`✅ Response ready in ${elapsed.toFixed(2)} ms`);

//   return merged;
// }
// }

// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/require-await */
// /* eslint-disable prefer-const */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */

// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from './formulas.service';
// import { params } from 'utils/param-groups';
// import * as moment from 'moment-timezone';
// import { performance } from 'perf_hooks';
// import { params as ALL_PARAMS } from '../../utils/param-groups';

// const cache = new Map();

// @Injectable()
// export class TrendsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('historical_navy');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   async getList() {
//     return params;
//   }

//   // ✅ Check if cached
//   isCached(payload: any): boolean {
//     const key = this.buildCacheKey(payload);
//     return cache.has(key);
//   }

//   // ✅ Clear all cache
//   clearCache(): void {
//     cache.clear();
//     console.log('🧹 TrendsService cache cleared');
//   }

//   // ✅ Mode-independent cache key generator
//   private buildCacheKey(payload: any): string {
//     const {
//       mode,
//       startDate,
//       endDate,
//       params: selectedParams = [],
//       sortOrder = 'asc',
//     } = payload;

//     const isRangeMode = ['range', 'historic'].includes(mode);
//     return isRangeMode
//       ? JSON.stringify({ startDate, endDate, selectedParams, sortOrder })
//       : JSON.stringify({ mode, selectedParams, sortOrder });
//   }

//   async getTrends(payload: any) {
//     const startPerf = performance.now();

//     const {
//       mode,
//       startDate,
//       endDate,
//       params: selectedParams = [],
//       sortOrder = 'asc',
//       force = false,
//     } = payload;

//     if (!mode) throw new Error('Mode is required');

//     const isRangeOrHistoric = ['range', 'historic'].includes(mode);
//     const baseKey = isRangeOrHistoric
//       ? JSON.stringify({ startDate, endDate })
//       : JSON.stringify({ mode });

//     const finalKey = this.buildCacheKey(payload);

//     // ⚡ Return from cache if available
//     if (!force && cache.has(finalKey)) {
//       console.log(`⚡ Cache hit for ${mode} (${startDate} → ${endDate})`);
//       return cache.get(finalKey);
//     }

//     let query: any = {};

//     // 🔍 Detect timestamp field type
//     const sampleDoc = await this.collection.findOne(
//       {},
//       { projection: { timestamp: 1 } },
//     );
//     const timestampType =
//       sampleDoc && typeof sampleDoc.timestamp === 'string' ? 'string' : 'date';

//     const makeTimestampQuery = (start: Date, end: Date) => {
//       if (timestampType === 'string') {
//         return {
//           timestamp: { $gte: start.toISOString(), $lte: end.toISOString() },
//         };
//       } else {
//         return { timestamp: { $gte: start, $lte: end } };
//       }
//     };

//     if (mode === 'historic' || mode === 'range') {
//       if (!startDate || !endDate)
//         throw new Error('startDate and endDate are required');

//       let startISO = new Date(startDate);
//       let endISO = new Date(endDate);

//       if (isNaN(startISO.getTime()) || isNaN(endISO.getTime()))
//         throw new Error('Invalid date format — must be ISO string or Date');

//       // Auto-expand single-day range
//       if (startISO.getTime() === endISO.getTime()) {
//         endISO = new Date(startISO.getTime() + 24 * 60 * 60 * 1000 - 1);
//         console.log(
//           `🕓 Expanded single-day: ${startISO.toISOString()} → ${endISO.toISOString()}`,
//         );
//       }

//       if (mode === 'range') {
//         const [runRange] = await this.collection
//           .aggregate([
//             { $match: makeTimestampQuery(startISO, endISO) },
//             { $match: { Genset_Run_SS: { $gte: 1, $lte: 6 } } },
//             {
//               $group: {
//                 _id: null,
//                 minTime: { $min: '$timestamp' },
//                 maxTime: { $max: '$timestamp' },
//               },
//             },
//           ])
//           .toArray();

//         if (runRange?.minTime && runRange?.maxTime) {
//           query = makeTimestampQuery(
//             new Date(runRange.minTime),
//             new Date(runRange.maxTime),
//           );
//         } else {
//           // console.log('⚠️ No genset running data found in range');
//           return [];
//         }
//       } else {
//         query = makeTimestampQuery(startISO, endISO);
//       }
//     } else if (mode === 'live') {
//       const now = moment().tz('Asia/Karachi');
//       const sixHoursAgo = now.clone().subtract(6, 'hours').toDate();
//       const liveEnd = now.toDate();
//       query = makeTimestampQuery(sixHoursAgo, liveEnd);
//     } else {
//       throw new Error('Invalid mode');
//     }

//     // ⚡ Dependency map
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
//     };

//     // ⚡ Fetch base data
//     let baseData: any[] = (cache.get(baseKey) as any[]) || [];
//     if (force || baseData.length === 0) {
//       const projectionBase: Record<string, number> = { timestamp: 1 };
//       const allNeeded = new Set<string>();
//       for (const param of selectedParams) {
//         allNeeded.add(param);
//         const deps = dependencyMap[param];
//         if (deps) deps.forEach((d) => allNeeded.add(d));
//       }
//       ALL_PARAMS.forEach((p) => allNeeded.add(p));

//       const allFields = Array.from(allNeeded);
//       const batchSize = 12;
//       const batches: string[][] = [];
//       for (let i = 0; i < allFields.length; i += batchSize)
//         batches.push(allFields.slice(i, i + batchSize));

//       console.time('⏳ Mongo parallel fetch');
//       const results = await Promise.all(
//         batches.map(async (fields) => {
//           const projection: Record<string, number> = { ...projectionBase };
//           for (const f of fields) projection[f] = 1;
//           const pipeline = [
//             { $match: query },
//             { $project: projection },
//             { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
//           ];
//           return await this.collection.aggregate(pipeline).toArray();
//         }),
//       );
//       console.timeEnd('⏳ Mongo parallel fetch');

//       const map = new Map<string, any>();
//       for (const batch of results) {
//         for (const doc of batch) {
//           const key =
//             timestampType === 'string'
//               ? doc.timestamp
//               : doc.timestamp.toISOString();
//           if (!map.has(key)) map.set(key, { timestamp: doc.timestamp });
//           Object.assign(map.get(key), doc);
//         }
//       }

//       baseData = Array.from(map.values()).map((doc) => ({
//         ...doc,
//         timestamp: moment(doc.timestamp)
//           .tz('Asia/Karachi')
//           .format('YYYY-MM-DD HH:mm:ss.SSS'),
//       }));

//       cache.set(baseKey, baseData);
//       console.log(
//         `🧠 Cached ${baseData.length} records (${timestampType}-timestamp mode)`,
//       );
//     }

//     // ⚡ Formula calculations (multi-point & single-point)
//     const calcPromises: Promise<{ key: string; val: any }>[] = [];
//     const addCachedFormula = (param: string, fn: () => any) => {
//       const key = `${param}_${baseKey}`;
//       if (!force && cache.has(key))
//         return Promise.resolve({ key: param, val: cache.get(key) });
//       const result = fn();
//       cache.set(key, result);
//       return Promise.resolve({ key: param, val: result });
//     };

//     if (selectedParams.includes('RPM_Stability_Index'))
//       calcPromises.push(
//         addCachedFormula('RPM_Stability_Index', () =>
//           this.formulasService.calculateRPMStabilityWithLoad(baseData),
//         ),
//       );
//     if (selectedParams.includes('Oscillation_Index'))
//       calcPromises.push(
//         addCachedFormula('Oscillation_Index', () =>
//           this.formulasService.calculateOscillationIndex(baseData),
//         ),
//       );
//     if (selectedParams.includes('Fuel_Consumption'))
//       calcPromises.push(
//         addCachedFormula('Fuel_Consumption', () =>
//           this.formulasService.calculateFuelConsumption(baseData),
//         ),
//       );

//     const resultsArray = await Promise.all(calcPromises);
//     const results = Object.fromEntries(resultsArray.map((r) => [r.key, r.val]));

//     // Single-point formulas
//     const singlePointData = baseData.map((doc) => {
//       const record: any = { timestamp: doc.timestamp };
//       for (const param of selectedParams) {
//         if (
//           [
//             'RPM_Stability_Index',
//             'Oscillation_Index',
//             'Fuel_Consumption',
//           ].includes(param)
//         )
//           continue;
//         let value: any;
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
//           case 'Mechanical_Stress':
//             value = this.formulasService.calculateMechanicalStress(doc);
//             break;
//           case 'Cooling_Margin':
//             value = this.formulasService.calculateCoolingMarginF(doc);
//             break;
//           case 'OTSR':
//             value = this.formulasService.calculateOTSRF(doc);
//             break;
//           default:
//             value = doc[param] ?? null;
//         }
//         record[param] = value;
//       }
//       return record;
//     });

//     // Merge multi-point results
//     let merged = singlePointData.map((record) => {
//       const timestamp = record.timestamp;
//       for (const [param, arr] of Object.entries(results)) {
//         const match = arr.find((x: any) => x.time === timestamp);
//         if (match) Object.assign(record, match);
//       }
//       return record;
//     });

//     // Live mode 5-min reduction
//     if (mode === 'live') {
//       const seen: Record<string, boolean> = {};
//       const reduced: any[] = [];
//       for (const doc of merged) {
//         const rounded = moment(doc.timestamp)
//           .startOf('minute')
//           .minute(Math.floor(moment(doc.timestamp).minute() / 5) * 5)
//           .format('YYYY-MM-DD HH:mm');
//         if (!seen[rounded]) {
//           seen[rounded] = true;
//           reduced.push(doc);
//         }
//       }
//       merged = reduced;
//     }

//     // Range mode: remove zero/null fields
//     if (mode === 'range') {
//       merged = merged
//         .map((r) => {
//           const cleaned: any = { timestamp: r.timestamp };
//           for (const [k, v] of Object.entries(r)) {
//             if (k === 'timestamp') continue;
//             if (v !== 0 && v !== null && v !== undefined) cleaned[k] = v;
//           }
//           return cleaned;
//         })
//         .filter((r) => Object.keys(r).length > 1);
//     }

//     cache.set(finalKey, merged);
//     console.log(
//       `✅ Response ready in ${(performance.now() - startPerf).toFixed(2)} ms (timestamp type: ${timestampType})`,
//     );
//     return merged;
//   }
// }

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
    this.collection = this.db.collection('Navy_Gen_On');
    this.collection.createIndex({ timestamp: 1 });
  }

  async getList() {
    return params;
  }

  isCached(payload: any): boolean {
    const key = this.buildCacheKey(payload);
    return cache.has(key);
  }

  clearCache(): void {
    cache.clear();
    console.log('🧹 TrendsService cache cleared');
  }

  private buildCacheKey(payload: any): string {
    const {
      mode,
      startDate,
      endDate,
      params: selectedParams = [],
      sortOrder = 'asc',
    } = payload;

    const isRangeMode = ['range', 'historic'].includes(mode);
    return isRangeMode
      ? JSON.stringify({ startDate, endDate, selectedParams, sortOrder })
      : JSON.stringify({ mode, selectedParams, sortOrder });
  }

  // async getTrends(payload: any) {
  //   const startPerf = performance.now();

  //   const {
  //     mode,
  //     startDate,
  //     endDate,
  //     params: selectedParams = [],
  //     sortOrder = 'asc',
  //     force = false,
  //   } = payload;

  //   if (!mode) throw new Error('Mode is required');

  //   const isRangeOrHistoric = ['range', 'historic'].includes(mode);
  //   const baseKey = isRangeOrHistoric
  //     ? JSON.stringify({ startDate, endDate })
  //     : JSON.stringify({ mode });

  //   const finalKey = this.buildCacheKey(payload);

  //   if (!force && cache.has(finalKey)) {
  //     console.log(`⚡ Cache hit for ${mode} (${startDate} → ${endDate})`);
  //     return cache.get(finalKey);
  //   }

  //   let query: any = {};

  //   const sampleDoc = await this.collection.findOne(
  //     {},
  //     { projection: { timestamp: 1 } },
  //   );
  //   const timestampType =
  //     sampleDoc && typeof sampleDoc.timestamp === 'string' ? 'string' : 'date';

  //   const makeTimestampQuery = (start: Date, end: Date) => {
  //     if (timestampType === 'string') {
  //       return {
  //         timestamp: { $gte: start.toISOString(), $lte: end.toISOString() },
  //       };
  //     } else {
  //       return { timestamp: { $gte: start, $lte: end } };
  //     }
  //   };

  //   if (mode === 'historic' || mode === 'range') {
  //     if (!startDate || !endDate)
  //       throw new Error('startDate and endDate are required');

  //     let startISO = new Date(startDate);
  //     let endISO = new Date(endDate);

  //     if (isNaN(startISO.getTime()) || isNaN(endISO.getTime()))
  //       throw new Error('Invalid date format — must be ISO string or Date');

  //     if (startISO.getTime() === endISO.getTime()) {
  //       endISO = new Date(startISO.getTime() + 24 * 60 * 60 * 1000 - 1);
  //       console.log(
  //         `🕓 Expanded single-day: ${startISO.toISOString()} → ${endISO.toISOString()}`,
  //       );
  //     }

  //     if (mode === 'range') {
  //       const [runRange] = await this.collection
  //         .aggregate([
  //           { $match: makeTimestampQuery(startISO, endISO) },
  //           { $match: { Genset_Run_SS: { $gte: 1, $lte: 6 } } },
  //           {
  //             $group: {
  //               _id: null,
  //               minTime: { $min: '$timestamp' },
  //               maxTime: { $max: '$timestamp' },
  //             },
  //           },
  //         ])
  //         .toArray();

  //       if (runRange?.minTime && runRange?.maxTime) {
  //         query = makeTimestampQuery(
  //           new Date(runRange.minTime),
  //           new Date(runRange.maxTime),
  //         );
  //       } else {
  //         return [];
  //       }
  //     } else {
  //       query = makeTimestampQuery(startISO, endISO);
  //     }
  //   } else if (mode === 'live') {
  //     const now = moment().tz('Asia/Karachi');
  //     const sixHoursAgo = now.clone().subtract(6, 'hours').toDate();
  //     const liveEnd = now.toDate();
  //     query = makeTimestampQuery(sixHoursAgo, liveEnd);
  //   } else {
  //     throw new Error('Invalid mode');
  //   }

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
  //   };

  //   let baseData: any[] = (cache.get(baseKey) as any[]) || [];
  //   if (force || baseData.length === 0) {
  //     const projectionBase: Record<string, number> = { timestamp: 1 };
  //     const allNeeded = new Set<string>();
  //     for (const param of selectedParams) {
  //       allNeeded.add(param);
  //       const deps = dependencyMap[param];
  //       if (deps) deps.forEach((d) => allNeeded.add(d));
  //     }
  //     ALL_PARAMS.forEach((p) => allNeeded.add(p));

  //     const allFields = Array.from(allNeeded);
  //     const batchSize = 12;
  //     const batches: string[][] = [];
  //     for (let i = 0; i < allFields.length; i += batchSize)
  //       batches.push(allFields.slice(i, i + batchSize));

  //     console.time('⏳ Mongo parallel fetch');
  //     const results = await Promise.all(
  //       batches.map(async (fields) => {
  //         const projection: Record<string, number> = { ...projectionBase };
  //         for (const f of fields) projection[f] = 1;
  //         const pipeline = [
  //           { $match: query },
  //           { $project: projection },
  //           { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
  //         ];
  //         return await this.collection.aggregate(pipeline).toArray();
  //       }),
  //     );
  //     console.timeEnd('⏳ Mongo parallel fetch');

  //     const map = new Map<string, any>();
  //     for (const batch of results) {
  //       for (const doc of batch) {
  //         const key =
  //           timestampType === 'string'
  //             ? doc.timestamp
  //             : doc.timestamp.toISOString();
  //         if (!map.has(key)) map.set(key, { timestamp: doc.timestamp });
  //         Object.assign(map.get(key), doc);
  //       }
  //     }

  //     baseData = Array.from(map.values()).map((doc) => ({
  //       ...doc,
  //       timestamp: moment
  //         .parseZone(doc.timestamp)
  //         .tz('Asia/Karachi')
  //         .format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
  //     }));

  //     cache.set(baseKey, baseData);
  //     console.log(
  //       `🧠 Cached ${baseData.length} records (${timestampType}-timestamp mode)`,
  //     );
  //   }

  //   const calcPromises: Promise<{ key: string; val: any }>[] = [];
  //   const addCachedFormula = (param: string, fn: () => any) => {
  //     const key = `${param}_${baseKey}`;
  //     if (!force && cache.has(key))
  //       return Promise.resolve({ key: param, val: cache.get(key) });
  //     const result = fn();
  //     cache.set(key, result);
  //     return Promise.resolve({ key: param, val: result });
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
  //         case 'OTSR':
  //           value = this.formulasService.calculateOTSRF(doc);
  //           break;
  //         default:
  //           value = doc[param] ?? null;
  //       }
  //       record[param] = value;
  //     }
  //     return record;
  //   });

  //   let merged = singlePointData.map((record) => {
  //     const timestamp = record.timestamp;
  //     for (const [param, arr] of Object.entries(results)) {
  //       const match = arr.find((x: any) => x.time === timestamp);
  //       if (match) Object.assign(record, match);
  //     }
  //     return record;
  //   });

  //   if (mode === 'live') {
  //     const seen: Record<string, boolean> = {};
  //     const reduced: any[] = [];
  //     for (const doc of merged) {
  //       const rounded = moment(doc.timestamp)
  //         .startOf('minute')
  //         .minute(Math.floor(moment(doc.timestamp).minute() / 5) * 5)
  //         .format('YYYY-MM-DD HH:mm');
  //       if (!seen[rounded]) {
  //         seen[rounded] = true;
  //         reduced.push(doc);
  //       }
  //     }
  //     merged = reduced;
  //   }

  //   if (mode === 'range') {
  //     merged = merged
  //       .map((r) => {
  //         const cleaned: any = { timestamp: r.timestamp };
  //         for (const [k, v] of Object.entries(r)) {
  //           if (k === 'timestamp') continue;
  //           if (v !== 0 && v !== null && v !== undefined) cleaned[k] = v;
  //         }
  //         return cleaned;
  //       })
  //       .filter((r) => Object.keys(r).length > 1);
  //   }

  //   // 🧩 Fill missing timestamps (Historic → 0, Range → null) for 3-sec interval
  //   if (mode === 'historic' || mode === 'range') {
  //     if (merged.length > 0) {
  //       const normalize = (ts: string) =>
  //         moment
  //           .parseZone(ts)
  //           .seconds(Math.floor(moment.parseZone(ts).seconds() / 3) * 3)
  //           .milliseconds(0)
  //           .format('YYYY-MM-DDTHH:mm:ss');

  //       merged.sort(
  //         (a, b) =>
  //           moment.parseZone(a.timestamp).valueOf() -
  //           moment.parseZone(b.timestamp).valueOf(),
  //       );

  //       const start = moment.parseZone(merged[0].timestamp);
  //       const end = moment.parseZone(merged[merged.length - 1].timestamp);

  //       const allTimestamps: string[] = [];
  //       let cursor = start.clone();

  //       while (cursor.isSameOrBefore(end)) {
  //         allTimestamps.push(cursor.format('YYYY-MM-DDTHH:mm:ss'));
  //         cursor.add(3, 'seconds');
  //       }

  //       const mergedMap = new Map(
  //         merged.map((r) => [normalize(r.timestamp), r]),
  //       );

  //       const filled: any[] = [];

  //       for (const t of allTimestamps) {
  //         const existing = mergedMap.get(t);
  //         if (existing) {
  //           filled.push(existing);
  //         } else {
  //           const fillValue = mode === 'historic' ? 0 : null;
  //           const base: any = {
  //             timestamp: moment.parseZone(t).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
  //           };
  //           for (const param of selectedParams) {
  //             base[param] = fillValue;
  //           }
  //           filled.push(base);
  //         }
  //       }

  //       merged = filled;
  //     }
  //   }

  //   cache.set(finalKey, merged);
  //   console.log(
  //     `✅ Response ready in ${(performance.now() - startPerf).toFixed(2)} ms (timestamp type: ${timestampType})`,
  //   );
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
      force = false,
    } = payload;

    if (!mode) throw new Error('Mode is required');

    const isRangeOrHistoric = ['range', 'historic'].includes(mode);
    const baseKey = isRangeOrHistoric
      ? JSON.stringify({ startDate, endDate })
      : JSON.stringify({ mode });

    const finalKey = this.buildCacheKey(payload);

    // Return from cache
    if (!force && cache.has(finalKey)) {
      console.log(`⚡ Cache hit for ${mode} (${startDate} → ${endDate})`);
      return cache.get(finalKey);
    }

    let query: any = {};

    // Detect timestamp type
    const sampleDoc = await this.collection.findOne(
      {},
      { projection: { timestamp: 1 } },
    );
    const timestampType =
      sampleDoc && typeof sampleDoc.timestamp === 'string' ? 'string' : 'date';

    const makeTimestampQuery = (start: Date, end: Date) => {
      if (timestampType === 'string') {
        return {
          timestamp: { $gte: start.toISOString(), $lte: end.toISOString() },
        };
      } else {
        return { timestamp: { $gte: start, $lte: end } };
      }
    };

    // Mode handling
    if (mode === 'historic' || mode === 'range') {
      if (!startDate || !endDate)
        throw new Error('startDate and endDate are required');

      let startISO = new Date(startDate);
      let endISO = new Date(endDate);

      if (isNaN(startISO.getTime()) || isNaN(endISO.getTime()))
        throw new Error('Invalid date format — must be ISO string or Date');

      // Auto-expand single day
      if (startISO.getTime() === endISO.getTime()) {
        endISO = new Date(startISO.getTime() + 24 * 60 * 60 * 1000 - 1);
        console.log(
          `🕓 Expanded single-day: ${startISO.toISOString()} → ${endISO.toISOString()}`,
        );
      }

      if (mode === 'range') {
        const [runRange] = await this.collection
          .aggregate([
            { $match: makeTimestampQuery(startISO, endISO) },
            { $match: { Genset_Run_SS: { $gte: 1, $lte: 6 } } },
            {
              $group: {
                _id: null,
                minTime: { $min: '$timestamp' },
                maxTime: { $max: '$timestamp' },
              },
            },
          ])
          .toArray();

        if (runRange?.minTime && runRange?.maxTime) {
          query = makeTimestampQuery(
            new Date(runRange.minTime),
            new Date(runRange.maxTime),
          );
        } else {
          return [];
        }
      } else {
        query = makeTimestampQuery(startISO, endISO);
      }
    } else if (mode === 'live') {
      const now = moment().tz('Asia/Karachi');
      query = makeTimestampQuery(
        now.clone().subtract(6, 'hours').toDate(),
        now.toDate(),
      );
    } else {
      throw new Error('Invalid mode');
    }

    // Dependencies map
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
    };

    // Fetch base data
    let baseData: any[] = (cache.get(baseKey) as any[]) || [];
    if (force || baseData.length === 0) {
      const projectionBase: Record<string, number> = { timestamp: 1 };
      const allNeeded = new Set<string>();

      for (const param of selectedParams) {
        allNeeded.add(param);
        const deps = dependencyMap[param];
        if (deps) deps.forEach((d) => allNeeded.add(d));
      }

      ALL_PARAMS.forEach((p) => allNeeded.add(p));

      const allFields = Array.from(allNeeded);
      const batchSize = 12;
      const batches: string[][] = [];

      for (let i = 0; i < allFields.length; i += batchSize)
        batches.push(allFields.slice(i, i + batchSize));

      console.time('⏳ Mongo parallel fetch');
      const results = await Promise.all(
        batches.map(async (fields) => {
          const projection: Record<string, number> = { ...projectionBase };
          for (const f of fields) projection[f] = 1;

          return await this.collection
            .aggregate([
              { $match: query },
              { $project: projection },
              { $sort: { timestamp: sortOrder === 'asc' ? 1 : -1 } },
            ])
            .toArray();
        }),
      );
      console.timeEnd('⏳ Mongo parallel fetch');

      const map = new Map<string, any>();
      for (const batch of results) {
        for (const doc of batch) {
          const key =
            timestampType === 'string'
              ? doc.timestamp
              : doc.timestamp.toISOString();

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
    }

    // Multi-point formulas
    const calcPromises: Promise<{ key: string; val: any }>[] = [];
    const addCachedFormula = (param: string, fn: () => any) => {
      const key = `${param}_${baseKey}`;
      if (!force && cache.has(key))
        return Promise.resolve({ key: param, val: cache.get(key) });

      const result = fn();
      cache.set(key, result);
      return Promise.resolve({ key: param, val: result });
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

    // Single-point formulas
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
          case 'Mechanical_Stress':
            value = this.formulasService.calculateMechanicalStress(doc);
            break;
          case 'Cooling_Margin':
            value = this.formulasService.calculateCoolingMarginF(doc);
            break;
          case 'OTSR':
            value = this.formulasService.calculateOTSRF(doc);
            break;
          default:
            value = doc[param] ?? null;
        }

        record[param] = value;
      }

      return record;
    });

    // Merge multi-point results
    let merged = singlePointData.map((record) => {
      const timestamp = record.timestamp;

      for (const [param, arr] of Object.entries(results)) {
        const match = arr.find((x: any) => x.time === timestamp);
        if (match) Object.assign(record, match);
      }

      return record;
    });

    // Live mode reduction
    if (mode === 'live') {
      const seen: Record<string, boolean> = {};
      const reduced: any[] = [];

      for (const doc of merged) {
        const rounded = moment(doc.timestamp)
          .startOf('minute')
          .minute(Math.floor(moment(doc.timestamp).minute() / 5) * 5)
          .format('YYYY-MM-DD HH:mm');

        if (!seen[rounded]) {
          seen[rounded] = true;
          reduced.push(doc);
        }
      }

      merged = reduced;
    }

    // ✅ Range mode fix: keep ZERO, remove only null/undefined
    if (mode === 'range') {
      merged = merged
        .map((r) => {
          const cleaned: any = { timestamp: r.timestamp };

          for (const [key, value] of Object.entries(r)) {
            if (key === 'timestamp') continue;
            if (value !== null && value !== undefined) {
              cleaned[key] = value; // zero allowed
            }
          }

          return cleaned;
        })
        .filter((r) => Object.keys(r).length > 1);
    }

    cache.set(finalKey, merged);
    console.log(
      `✅ Response ready in ${(performance.now() - startPerf).toFixed(
        2,
      )} ms (timestamp type: ${timestampType})`,
    );

    return merged;
  }
}
