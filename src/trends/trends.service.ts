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

    let startISO: Date | null = null;
    let endISO: Date | null = null;

    if (mode === 'range' || mode === 'historic') {
      if (!startDate || !endDate)
        throw new Error('startDate and endDate are required');

      startISO = new Date(startDate);
      endISO = new Date(endDate);

      if (isNaN(startISO.getTime()) || isNaN(endISO.getTime()))
        throw new Error('Invalid date format');
      if (startISO.getTime() === endISO.getTime()) {
        endISO = new Date(startISO.getTime() + 24 * 60 * 60 * 1000 - 1);
      }
    }

    let query: any = {};
    let intervalMs = 0;

    if (mode === 'range') {
      query = makeTimestampQuery(startISO!, endISO!);
    } else if (mode === 'historic') {
      query = makeTimestampQuery(startISO!, endISO!);
      intervalMs = 12 * 1000;
    } else if (mode === 'live') {
      const now = moment().tz('Asia/Karachi');
      const qStart = now.clone().subtract(6, 'hours').toDate();
      const qEnd = now.toDate();
      query = makeTimestampQuery(qStart, qEnd);
      intervalMs = 3 * 1000;
    } else {
      throw new Error('Invalid mode');
    }

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

    const allNeeded = new Set<string>();
    for (const p of selectedParams) {
      allNeeded.add(p);
      dependencyMap[p]?.forEach((d) => allNeeded.add(d));
    }
    ALL_PARAMS.forEach((p) => allNeeded.add(p));

    const projection: any = { timestamp: 1 };
    Array.from(allNeeded).forEach((f) => (projection[f] = 1));

    const cursor = this.collection
      .find(query, { projection })
      .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
      .batchSize(5000);

    const recordMap = new Map<number, any>();
    let prevRawDoc: any = null;

    for await (const doc of cursor) {
      const ts =
        timestampType === 'string'
          ? new Date(doc.timestamp).getTime()
          : doc.timestamp.getTime();
      const bucketKey =
        intervalMs > 0 ? Math.floor(ts / intervalMs) * intervalMs : ts;

      if (!recordMap.has(bucketKey)) {
        const record: any = { timestamp: bucketKey };

        for (const param of selectedParams) {
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
              value =
                this.formulasService.calculateSpecificFuelConsumption(doc);
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
              value = this.formulasService.calculateFuelFlowRateChange(
                doc,
                prevRawDoc,
              );
              break;
            default:
              value = doc[param] ?? null;
          }

          record[param] =
            value === undefined || Number.isNaN(value) ? null : value;
        }

        recordMap.set(bucketKey, record);
      }

      prevRawDoc = doc;
    }

    // -----------------------
    // Merge & Fill Missing Timestamps per mode
    // -----------------------
    const merged: any[] = [];
    const startTs = new Date(startDate).getTime();
    const endTs = new Date(endDate).getTime();
    if (intervalMs <= 0) intervalMs = 12 * 1000;

    if (mode === 'range') {
      // Only actual data, no nulls
      const rows = Array.from(recordMap.values());
      rows.sort((a, b) => a.timestamp - b.timestamp);
      merged.push(
        ...rows.filter((r) => r.timestamp >= startTs && r.timestamp <= endTs),
      );
    } else if (mode === 'historic') {
      // Fill missing intervals with 0 (no forward-fill)
      for (let ts = startTs; ts <= endTs; ts += intervalMs) {
        const bk = Math.floor(ts / intervalMs) * intervalMs;
        if (recordMap.has(bk)) {
          merged.push(recordMap.get(bk));
        } else {
          const filledRow: any = { timestamp: bk };
          selectedParams.forEach((p) => (filledRow[p] = 0)); // Always zero for missing historic points
          merged.push(filledRow);
        }
      }
    } else {
      // Live mode, fill missing points with null
      for (let ts = startTs; ts <= endTs; ts += intervalMs) {
        const bk = Math.floor(ts / intervalMs) * intervalMs;
        if (recordMap.has(bk)) {
          merged.push(recordMap.get(bk));
        } else {
          const nullRow: any = { timestamp: bk };
          selectedParams.forEach((p) => (nullRow[p] = null));
          merged.push(nullRow);
        }
      }
    }

    console.log(
      `✅ Response ready in ${(performance.now() - startPerf).toFixed(2)} ms`,
    );
    return merged;
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

  //   let startISO: Date | null = null;
  //   let endISO: Date | null = null;

  //   if (mode === 'range' || mode === 'historic') {
  //     if (!startDate || !endDate)
  //       throw new Error('startDate and endDate are required');

  //     startISO = new Date(startDate);
  //     endISO = new Date(endDate);

  //     if (isNaN(startISO.getTime()) || isNaN(endISO.getTime()))
  //       throw new Error('Invalid date format');

  //     if (startISO.getTime() === endISO.getTime()) {
  //       endISO = new Date(startISO.getTime() + 24 * 60 * 60 * 1000 - 1);
  //     }
  //   }

  //   let query: any = {};
  //   let intervalMs = 0;

  //   if (mode === 'range') {
  //     query = makeTimestampQuery(startISO!, endISO!);
  //   } else if (mode === 'historic') {
  //     query = makeTimestampQuery(startISO!, endISO!);
  //     intervalMs = 12 * 1000;
  //   } else if (mode === 'live') {
  //     const now = moment().tz('Asia/Karachi');
  //     const qStart = now.clone().subtract(6, 'hours').toDate();
  //     const qEnd = now.toDate();
  //     query = makeTimestampQuery(qStart, qEnd);
  //     intervalMs = 3 * 1000;
  //   } else {
  //     throw new Error('Invalid mode');
  //   }

  //   const dependencyMap: Record<string, string[]> = {
  //     /* same as before */
  //   };

  //   const allNeeded = new Set<string>();
  //   for (const p of selectedParams) {
  //     allNeeded.add(p);
  //     dependencyMap[p]?.forEach((d) => allNeeded.add(d));
  //   }
  //   ALL_PARAMS.forEach((p) => allNeeded.add(p));

  //   const projection: any = { timestamp: 1 };
  //   Array.from(allNeeded).forEach((f) => (projection[f] = 1));

  //   const cursor = this.collection
  //     .find(query, { projection })
  //     .sort({ timestamp: sortOrder === 'asc' ? 1 : -1 })
  //     .batchSize(5000);

  //   const recordMap = new Map<number, any>();
  //   let prevRawDoc: any = null;

  //   for await (const doc of cursor) {
  //     const ts =
  //       timestampType === 'string'
  //         ? new Date(doc.timestamp).getTime()
  //         : doc.timestamp.getTime();
  //     const bucketKey =
  //       intervalMs > 0 ? Math.floor(ts / intervalMs) * intervalMs : ts;

  //     if (!recordMap.has(bucketKey)) {
  //       const record: any = { timestamp: bucketKey };
  //       for (const param of selectedParams) {
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
  //             value =
  //               this.formulasService.calculateSpecificFuelConsumption(doc);
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
  //           case 'Fuel_Flow_Change':
  //             value = this.formulasService.calculateFuelFlowRateChange(
  //               doc,
  //               prevRawDoc,
  //             );
  //             break;
  //           default:
  //             value = doc[param] ?? null;
  //         }
  //         record[param] =
  //           value === undefined || Number.isNaN(value) ? null : value;
  //       }
  //       recordMap.set(bucketKey, record);
  //     }
  //     prevRawDoc = doc;
  //   }

  //   // -----------------------
  //   // Merge & Fill Missing Timestamps per mode
  //   // -----------------------
  //   const merged: any[] = [];
  //   const startTs = new Date(startDate).getTime();
  //   const endTs = new Date(endDate).getTime();
  //   if (intervalMs <= 0) intervalMs = 12 * 1000;

  //   if (mode === 'range') {
  //     // Only actual genset data (>0)
  //     const rows = Array.from(recordMap.values());
  //     rows.sort((a, b) => a.timestamp - b.timestamp);
  //     merged.push(
  //       ...rows.filter(
  //         (r) =>
  //           r.timestamp >= startTs && r.timestamp <= endTs && r.gensetrunss > 0,
  //       ),
  //     );
  //   } else if (mode === 'historic') {
  //     // Include actual + fill missing with zeros
  //     for (let ts = startTs; ts <= endTs; ts += intervalMs) {
  //       const bk = Math.floor(ts / intervalMs) * intervalMs;
  //       if (recordMap.has(bk)) {
  //         merged.push(recordMap.get(bk));
  //       } else {
  //         const filledRow: any = { timestamp: bk };
  //         selectedParams.forEach((p) => (filledRow[p] = 0));
  //         merged.push(filledRow);
  //       }
  //     }
  //   } else {
  //     // Live mode, fill missing points with null
  //     for (let ts = startTs; ts <= endTs; ts += intervalMs) {
  //       const bk = Math.floor(ts / intervalMs) * intervalMs;
  //       if (recordMap.has(bk)) {
  //         merged.push(recordMap.get(bk));
  //       } else {
  //         const nullRow: any = { timestamp: bk };
  //         selectedParams.forEach((p) => (nullRow[p] = null));
  //         merged.push(nullRow);
  //       }
  //     }
  //   }

  //   console.log(
  //     `✅ Response ready in ${(performance.now() - startPerf).toFixed(2)} ms`,
  //   );
  //   return merged;
  // }
}
