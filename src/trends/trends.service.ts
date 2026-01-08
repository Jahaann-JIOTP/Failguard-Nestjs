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

    // ——————— FINAL FIX: Pakistan Time (+05:00) Handle ———————
    let startISO = startDate as string;
    let endISO = endDate as string;

    // Agar sirf date hai (2025-11-18) to +05:00 automatically add kar do
    if (startDate && !startDate.includes('T')) {
      startISO = `${startDate}T00:00:00+05:00`;
      endISO = `${endDate}T23:59:59.999+05:00`;
    }
    // Agar full string hai lekin end time 00:00:00 hai to 23:59:59 bana do
    else if (
      endDate.endsWith('T00:00:00') ||
      endDate.endsWith('T00:00:00.000')
    ) {
      const baseDate = endDate.split('T')[0];
      endISO = `${baseDate}T23:59:59.999+05:00`;
    }
    // ————————————————————————————————————————————————

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
      'I2 Heating': [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
        'Genset_Application_kW_Rating_PC2X',
      ],
      Thermal_Stress_Index: [
        'Coolant_Temperature',
        // 'Genset_L2_Current',
        // 'Genset_L3_Current',
        // 'Genset_Application_kW_Rating_PC2X',
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
      Mechanical_Stress_Index: ['Averagr_Engine_Speed'],
      Cooling_Margin: ['Coolant_Temperature', 'Oil_Temperature'],
      OTSR: ['Oil_Temperature', 'Coolant_Temperature'],
      Fuel_Flow_Change: ['Fuel_Rate'],
      Coolant_TemperatureC: ['Coolant_Temperature'],
      Oil_TemperatureC: ['Oil_Temperature'],
      Thermal_Efficiency: ['Genset_Total_kW', 'Fuel_Rate'],
      'Phase-A Share': [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
      ],
      'Phase-B Share': [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
      ],
      'Phase-C Share': [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
      ],
      Load_Stress_Index: [
        'Genset_Total_KVA',
        'Genset_Application_kVA_Rating_PC2X',
        'Genset_Total_Power_Factor_calculated',
      ],
      Fuel_Efficiency_Index: ['Genset_Total_kW', 'Fuel_Rate'],
      Neutral_Current: [
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
      ],
      Intake_Manifold_Temperature_calculated: [
        'Intake_Manifold_Temperature_calculated',
      ],
      Electrical_Stress_Index: [
        'Genset_L1_kW',
        'Genset_L2_kW',
        'Genset_L3_kW',
        'Genset_L1N_Voltage',
        'Genset_L2N_Voltage',
        'Genset_L3N_Voltage',
        'Genset_L1L2_Voltage',
        'Genset_L2L3_Voltage',
        'Genset_L3L1_Voltage',
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
        'Genset_Rated_KW',
        'Percent_Engine_Torque ',
      ],
    };

    const allNeeded = new Set<string>();
    selectedParams.forEach((p: string) => {
      allNeeded.add(p);
      dependencyMap[p]?.forEach((d) => allNeeded.add(d));
    });

    const projectStage: any = { timestamp: 1, Genset_Run_SS: 1 };
    allNeeded.forEach((f) => (projectStage[f] = 1));

    const matchStage: any = {
      timestamp: { $gte: startISO, $lte: endISO },
    };
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
    const rawDocs: any[] = [];
    // eslint-disable-next-line prefer-const
    let previousRawDoc: any = null;

    for await (const doc of aggCursor) {
      rawDocs.push(doc);

      // Timestamp Pakistan local time mein dikhao (Nov 18, 00:00)
      const date = new Date(doc.timestamp);
      const month = date.toLocaleString('en-US', {
        month: 'short',
        timeZone: 'Asia/Karachi',
      });
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      const formattedTimestamp = `${month} ${day}, ${hours}:${minutes}:${seconds}`;

      const record: any = { timestamp: formattedTimestamp };

      selectedParams.forEach((param: string) => {
        let value: any = null;

        switch (param) {
          case 'Oscillation_Index': {
            const startIdx = Math.max(0, rawDocs.length - 10);
            const windowData = rawDocs.slice(startIdx);
            value =
              this.formulasService
                .calculateOscillationIndex(windowData)
                .slice(-1)[0]?.Oscillation_Index ?? null;
            break;
          }
          case 'RPM_Stability_Index': {
            const startIdx = Math.max(0, rawDocs.length - 10);
            const windowData = rawDocs.slice(startIdx);
            value =
              this.formulasService
                .calculateRPMStabilityWithLoad(windowData)
                .slice(-1)[0]?.RPM_Stability_Index ?? null;
            break;
          }
          case 'Load_Percent':
            value = this.formulasService.calculateLoadPercent(doc);
            break;
          case 'Fuel_Efficiency_Index':
            value = this.formulasService.calculateSpecificFuelConsumption(doc);
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
          case 'I2 Heating':
            value = this.formulasService.calculateThermalStress(doc);
            break;
          case 'Thermal_Stress_Index':
            value = this.formulasService.calculateThermalStressC(doc);
            break;
          case 'Thermal_Efficiency':
            value = this.formulasService.calculateThermalEfficiency(doc);
            break;
          case 'Phase-A Share':
            value = this.formulasService.calculateL1LoadSharing(doc);
            break;
          case 'Phase-B Share':
            value = this.formulasService.calculateL2LoadSharing(doc);
            break;
          case 'Phase-C Share':
            value = this.formulasService.calculateL3LoadSharing(doc);
            break;

          case 'Load_Stress_Index':
            value = this.formulasService.calculateLoadStress(doc);
            break;
          case 'Intake_Manifold_Temperature_calculated':
            value = this.formulasService.convertIntakeToCelsius(doc);
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
          case 'Fuel_Consumption':
            const fuelData = this.formulasService.calculateFuelConsumption([
              doc,
            ]); // wrap in array
            // Ab sirf Fuel_Used lena hai
            value = fuelData?.[0]?.Fuel_Used ?? null;
            break;

          case 'Heat_Rate':
            value = this.formulasService.calculateHeatRate(doc);
            break;
          case 'Neutral_Current':
            value = this.formulasService.calculateNeutralCurrent(doc);
            break;
          case 'Coolant_TemperatureC':
            value = this.formulasService.convertCoolantToCelsius(doc);
            break;
          case 'Oil_TemperatureC':
            value = this.formulasService.convertOilTempToCelsius(doc);
            break;
          case 'Mechanical_Stress_Index':
            value = this.formulasService.calculateMechanicalStress(doc);
            break;
          case 'Electrical_Stress_Index':
            value = this.formulasService.calculateElectricalStress(doc);
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
              previousRawDoc,
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
      previousRawDoc = doc;
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
