/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// optimized-dashboard.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from 'src/trends/formulas.service';

interface DashboardConfig {
  projection: Record<string, number>;
  metricsMapper: (doc: any, data?: any[]) => any;
  chartsMapper: (data: any[]) => Record<string, any[]>;
}

@Injectable()
export class DashboardService {
  private collection;
  private cache = new Map();
  private readonly CACHE_TTL = 360000; // 30 min

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulas: FormulasService,
  ) {
    this.collection = this.db.collection('navy');
  }

  /** -------------------
   * Dashboard Configurations - SINGLE SOURCE OF TRUTH
   * ------------------- */
  private dashboardConfigs: Record<string, DashboardConfig> = {
    dashboard1: {
      projection: this.getProjectionFields([
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
        'Averagr_Engine_Speed',
        'Genset_L1L2_Voltage',
        'Genset_L2L3_Voltage',
        'Genset_L3L1_Voltage',
        'Genset_Frequency_OP_calculated',
        'Genset_L1_Current',
        'Genset_L2_Current',
        'Genset_L3_Current',
        'Coolant_Temperature',
        'Oil_Temperature',
        'Oil_Pressure',
        'Fuel_Rate',
        'Total_Fuel_Consumption_calculated',
        'Engine_Running_TIME_calculated',
        'Battery_Voltage_calculated',
        'Genset_Total_Power_Factor_calculated',
      ]),
      metricsMapper: (doc: any) => this.mapMetrics(doc, this.DASH1_METRICS),
      chartsMapper: (data: any[]) => this.mapCharts(data, this.DASH1_CHARTS),
    },
    dashboard2: {
      projection: this.getProjectionFields([
        'Genset_L1_Active_Power',
        'Genset_L2_Active_Power',
        'Genset_L3_Active_Power',
        'I2Rated',
        ...this.getDashboard1Fields(),
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard2(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard2(data),
    },
    dashboard3: {
      projection: this.getProjectionFields([
        'Intake_Manifold3_Temperature',
        'Boost_Pressure',
        'Coolant_Temperature',
        'AfterCooler_Temperature',
        'Genset_LL_Avg_Voltage',
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard3(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard3(data),
    },
    dashboard4: {
      projection: this.getProjectionFields([
        'Oil_Pressure',
        'Oil_Temperature',
        'Averagr_Engine_Speed',
        'Boost_Pressure',
        'Fuel_Outlet_Pressure_calculated',
        'Barometric_Absolute_Pressure',
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
        'Genset_Frequency_OP_calculated',
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard4(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard4(data),
    },
    dashboard5: {
      projection: this.getProjectionFields([
        'Fuel_Rate',
        'Boost_Pressure',
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
        'Fuel_Outlet_Pressure_calculated',
        'Genset_Frequency_OP_calculated',
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard5(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard5(data),
    },
    dashboard6: {
      projection: this.getProjectionFields([
        'Total_Fuel_Consumption_calculated',
        'Energy [kWh]',
        'Fuel_Consumption_Current_Run',
        'Percent_Engine_Torque_or_Duty_Cycle',
        'Engine_Running_Time_calculated',
        'Fuel_Rate',
        'Averagr_Engine_Speed',
        'Genset_Total_Power_Factor_calculated',
        'Genset_Total_kW',
        'Genset_Application_kW_Rating_PC2X',
        'Genset_Frequency_OP_calculated',
      ]),
      metricsMapper: (doc: any) => this.mapMetricsDashboard6(doc),
      chartsMapper: (data: any[]) => this.mapChartsDashboard6(data),
    },
  };

  /** -------------------
   * Unified Data Fetching Method
   * ------------------- */
  async getDashboardData(
    dashboard: string,
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const cacheKey = this.getCacheKey(dashboard, mode, start, end);

    // ⚡ Cache check
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const config = this.dashboardConfigs[dashboard];
    if (!config) {
      throw new Error(`Dashboard ${dashboard} not found`);
    }

    const result = await this.fetchDashboardData(mode, config, start, end);

    // 💾 Cache the result
    this.setCache(cacheKey, result);
    return result;
  }

  /** -------------------
   * Batch Multiple Dashboards
   * ------------------- */
  async getMultipleDashboards(
    dashboards: string[],
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ) {
    const results: Record<string, any> = {};

    await Promise.all(
      dashboards.map(async (dashboard) => {
        try {
          results[dashboard] = await this.getDashboardData(
            dashboard,
            mode,
            start,
            end,
          );
        } catch (error) {
          results[dashboard] = {
            error: error.message,
            metrics: {},
            charts: {},
          };
        }
      }),
    );

    return results;
  }

  /** -------------------
   * FIXED: Core Data Fetching Logic with String Timestamp Support
   * ------------------- */
  private async fetchDashboardData(
    mode: 'live' | 'historic' | 'range',
    config: DashboardConfig,
    start?: string,
    end?: string,
  ) {
    const pipeline = this.buildAggregationPipeline(
      mode,
      config.projection,
      start,
      end,
    );

    console.log('Executing pipeline:', JSON.stringify(pipeline, null, 2));

    const data = await this.collection.aggregate(pipeline).toArray();

    // console.log(`Fetched ${data.length} records from database`);

    if (!data.length) {
      console.log('No data found for query:', { mode, start, end });
      return {
        metrics: mode === 'range' ? { onDurationMinutes: 0 } : {},
        charts: {},
      };
    }

    // ✅ FIX: Use proper timestamp formatting for string timestamps
    const formattedData = data.map((doc) => ({
      ...doc,
      timestamp: this.formatStringTimestamp(doc.timestamp),
    }));

    const latest = formattedData[formattedData.length - 1];
    let metrics = config.metricsMapper(latest, formattedData);

    if (mode === 'range') {
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDurationString(formattedData),
      };
    }

    return {
      metrics,
      charts: config.chartsMapper(formattedData),
    };
  }

  /** -------------------
   * FIXED: Aggregation Pipeline for String Timestamps
   * ------------------- */
  private buildAggregationPipeline(
    mode: string,
    projection: Record<string, number>,
    start?: string,
    end?: string,
  ): any[] {
    const pipeline: any[] = [];
    const matchStage: any = {};

    // ✅ FIX: Handle string timestamps correctly
    if (mode === 'historic' && start && end) {
      // Direct string comparison for string timestamps
      matchStage.timestamp = {
        $gte: start,
        $lte: end,
      };
      console.log('Historic mode query:', matchStage.timestamp);
    } else if (mode === 'range') {
      matchStage.Genset_Run_SS = { $gte: 1, $lte: 6 };
      console.log('Range mode query:', matchStage.Genset_Run_SS);
    } else if (mode === 'live') {
      // For live mode, get data from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startString = yesterday.toISOString().split('T')[0] + ' 00:00:00';
      matchStage.timestamp = { $gte: startString };
      console.log('Live mode query:', matchStage.timestamp);
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Projection stage
    pipeline.push({ $project: projection });

    // Sort stage - string timestamps sort correctly in lexicographical order
    pipeline.push({ $sort: { timestamp: 1 } });

    return pipeline;
  }

  /** -------------------
   * NEW: String Timestamp Formatter
   * ------------------- */
  private formatStringTimestamp(timestamp: any): string {
    if (!timestamp) return '';

    try {
      // If it's already in correct string format, return as is
      if (typeof timestamp === 'string' && timestamp.includes(' ')) {
        return timestamp;
      }

      // If it's a Date object or ISO string, convert to consistent format
      if (
        timestamp instanceof Date ||
        (typeof timestamp === 'string' && timestamp.includes('T'))
      ) {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return String(timestamp);
        }

        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      // Return as string for any other type
      return String(timestamp);
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return String(timestamp);
    }
  }

  /** -------------------
   * NEW: On Duration Calculator for String Timestamps
   * ------------------- */
  private calculateOnDurationString(data: any[]): number {
    if (data.length < 2) return 0;

    let duration = 0;
    for (let i = 1; i < data.length; i++) {
      try {
        const currentTime = new Date(data[i].timestamp).getTime();
        const previousTime = new Date(data[i - 1].timestamp).getTime();

        // Handle invalid dates
        if (isNaN(currentTime) || isNaN(previousTime)) continue;

        duration += (currentTime - previousTime) / 60000; // Convert to minutes
      } catch (error) {
        console.error('Error calculating duration between timestamps:', error);
        continue;
      }
    }
    return +duration.toFixed(2);
  }

  /** -------------------
   * NEW: Debug Method to Check Database Data
   * ------------------- */
  async debugDatabaseData(
    mode: 'live' | 'historic' | 'range' = 'live',
    start?: string,
    end?: string,
    limit: number = 5,
  ) {
    const pipeline = this.buildAggregationPipeline(
      mode,
      { timestamp: 1, Genset_Run_SS: 1 },
      start,
      end,
    );
    pipeline.push({ $limit: limit });

    const sampleData = await this.collection.aggregate(pipeline).toArray();

    return {
      query: pipeline[0]?.$match || {},
      sampleCount: sampleData.length,
      sampleData: sampleData.map((doc) => ({
        timestamp: doc.timestamp,
        timestampType: typeof doc.timestamp,
        Genset_Run_SS: doc.Genset_Run_SS,
        formattedTimestamp: this.formatStringTimestamp(doc.timestamp),
      })),
      allRecordsCount: await this.collection.countDocuments(
        pipeline[0]?.$match || {},
      ),
    };
  }

  /** -------------------
   * Smart Projection Builder
   * ------------------- */
  private getProjectionFields(fields: string[]): Record<string, number> {
    const projection: Record<string, number> = { timestamp: 1 };
    fields.forEach((field) => {
      projection[field] = 1;
    });
    return projection;
  }

  private getDashboard1Fields(): string[] {
    return [
      'Genset_Total_kW',
      'Genset_Application_kW_Rating_PC2X',
      'Averagr_Engine_Speed',
      'Genset_L1L2_Voltage',
      'Genset_L2L3_Voltage',
      'Genset_L3L1_Voltage',
      'Genset_Frequency_OP_calculated',
      'Genset_L1_Current',
      'Genset_L2_Current',
      'Genset_L3_Current',
      'Coolant_Temperature',
      'Oil_Temperature',
      'Oil_Pressure',
      'Fuel_Rate',
      'Total_Fuel_Consumption_calculated',
      'Engine_Running_TIME_calculated',
      'Battery_Voltage_calculated',
      'Genset_Total_Power_Factor_calculated',
    ];
  }

  /** -------------------
   * Cache Management
   * ------------------- */
  private getCacheKey(
    dashboard: string,
    mode: string,
    start?: string,
    end?: string,
  ): string {
    return `dashboard_${dashboard}_${mode}_${start}_${end}`;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      // console.log(`⚡ Cache hit for: ${key}`);
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /** -------------------
   * Individual Dashboard Configurations
   * ------------------- */

  // Dashboard 1 Metrics & Charts
  private DASH1_METRICS = {
    load: (doc: any) => this.formulas.calculateLoad(doc),
    rpm: (doc: any) => doc.Averagr_Engine_Speed || 0,
    runningHours: (doc: any) => this.formulas.calculateRunningHours(doc),
    fuelConsumed: (doc: any) => doc.Total_Fuel_Consumption_calculated || 0,
    batteryVoltage: (doc: any) => doc.Battery_Voltage_calculated || 0,
    powerFactor: (doc: any) => doc.Genset_Total_Power_Factor_calculated || 0,
  };

  private DASH1_CHARTS = {
    electricalStability: [
      'Genset_L1L2_Voltage',
      'Genset_L2L3_Voltage',
      'Genset_L3L1_Voltage',
      'Genset_Frequency_OP_calculated',
    ],
    loadSharing: [
      'Genset_L1_Current',
      'Genset_L2_Current',
      'Genset_L3_Current',
    ],
    engineThermal: ['Coolant_Temperature', 'Oil_Temperature'],
    lubrication: ['Oil_Pressure'],
    fuelDemand: ['Fuel_Rate'],
  };

  // Dashboard 2 Charts
  private DASH2_CHARTS = {
    phaseBalanceEffectiveness: [
      'Genset_L1_Current',
      'Genset_L2_Current',
      'Genset_L3_Current',
    ],
    voltageQualitySymmetry: [
      'Genset_L1L2_Voltage',
      'Genset_L2L3_Voltage',
      'Genset_L3L1_Voltage',
      'Genset_LL_Avg_Voltage',
    ],
    loadVsPowerFactor: [
      'Genset_Total_kW',
      'Genset_Application_kW_Rating_PC2X',
      'Genset_Total_Power_Factor_calculated',
    ],
    electroMechanicalStress: [
      'LoadPercent',
      'Genset_Total_Power_Factor_calculated',
    ],
    lossesThermalStress: ['PowerLossFactor', 'I2'],
    frequencyRegulationEffectiveness: [
      'Genset_Frequency_OP_calculated',
      'Frequency_Deviation_Rad',
    ],
  };

  /** -------------------
   * Metrics Mapping Functions (Optimized)
   * ------------------- */
  private mapMetrics(doc: any, definitions: any) {
    const metrics: Record<string, number> = {};
    for (const key in definitions) {
      const value = definitions[key](doc);
      metrics[key] = typeof value === 'number' ? +value.toFixed(2) : 0;
    }
    return metrics;
  }

  private mapMetricsDashboard2(doc: any): Record<string, number> {
    return {
      voltageL1: doc.Genset_L1L2_Voltage || 0,
      voltageL2: doc.Genset_L2L3_Voltage || 0,
      voltageL3: doc.Genset_L3L1_Voltage || 0,
      activePowerL1: doc.Genset_L1_Active_Power || 0,
      activePowerL2: doc.Genset_L2_Active_Power || 0,
      activePowerL3: doc.Genset_L3_Active_Power || 0,
      CurrentImbalance: this.formulas.calculateCurrentImbalance(doc),
      voltageImbalance: this.formulas.calculateVoltageImbalance(doc),
      powerLossFactor: this.formulas.calculatePowerLossFactor(doc),
      thermalStress: this.formulas.calculateThermalStress(doc),
    };
  }

  private mapMetricsDashboard3(doc: any) {
    return {
      intakeTemperature: doc.Intake_Manifold3_Temperature ?? 0,
      boostPressure: doc.Boost_Pressure ?? 0,
      avg_LL_Voltage: this.formulas.calculateAvgLLVoltage(doc),
      voltageImbalance: this.formulas.calculateVoltageImbalance(doc),
      coolingMarginF: this.formulas.calculateCoolingMarginF(doc),
      coolingMarginC: this.formulas.calculateCoolingMarginC(doc),
    };
  }

  private mapMetricsDashboard4(doc: any) {
    return {
      lubricationRiskIndex: this.formulas.calculateLubricationRiskIndex(doc),
      oilPressure: doc.Oil_Pressure ?? 0,
      engineSpeed: doc.Averagr_Engine_Speed ?? 0,
      boostPressure: doc.Boost_Pressure ?? 0,
      fuelOutletPressure: doc.Fuel_Outlet_Pressure_calculated ?? 0,
      biometricPressure: doc.Barometric_Absolute_Pressure ?? 0,
      loadPercent: this.formulas.calculateLoadPercent(doc),
    };
  }

  private mapMetricsDashboard5(doc: any) {
    return {
      fuelRate: doc.Fuel_Rate ?? 0,
      loadPercent: this.formulas.calculateLoadPercent(doc),
      airFuelEffectiveness: this.formulas.calculateAirFuelEffectiveness(doc),
      specificFuelConsumption:
        this.formulas.calculateSpecificFuelConsumption(doc),
      heatRate: this.formulas.calculateHeatRate(doc),
      fuelOutletPressure: doc.Fuel_Outlet_Pressure_calculated ?? 0,
    };
  }

  private mapMetricsDashboard6(doc: any) {
    return {
      totalFuelConsumption: doc.Total_Fuel_Consumption_calculated ?? 0,
      energyKWh: doc.Engine_Running_Time_calculated ?? 0,
      fuelConsumptionCurrentRun: doc.Total_Fuel_Consumption_calculated ?? 0,
    };
  }

  /** -------------------
   * Charts Mapping Functions (Optimized)
   * ------------------- */
  private mapCharts(data: any[], definitions: any) {
    const charts: Record<string, any[]> = {};

    for (const chartName in definitions) {
      charts[chartName] = data.map((d) => {
        const entry: any = { time: d.timestamp };
        definitions[chartName].forEach((field: string) => {
          entry[field] = d[field] ?? null;
        });
        return entry;
      });
    }

    // Special charts
    charts.CurrentImbalanceNeutral = data.map((d) => ({
      time: d.timestamp,
      CurrentImbalance: this.formulas.calculateCurrentImbalance(d),
      neutralCurrent: this.formulas.calculateNeutralCurrent(d),
    }));

    charts.loadSharing = data.map((d) => {
      const IA = d.Genset_L1_Current || 0;
      const IB = d.Genset_L2_Current || 0;
      const IC = d.Genset_L3_Current || 0;

      const total = IA + IB + IC || 1;
      return {
        time: d.timestamp,
        Genset_L1_Current: (IA / total) * 100,
        Genset_L2_Current: (IB / total) * 100,
        Genset_L3_Current: (IC / total) * 100,
        CurrentImbalance: this.formulas.calculateCurrentImbalance(d),
      };
    });

    return charts;
  }

  private mapChartsDashboard2(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.phaseBalanceEffectiveness = data.map((d) => ({
      time: d.timestamp,
      Genset_L1_Current: d.Genset_L1_Current ?? 0,
      Genset_L2_Current: d.Genset_L2_Current ?? 0,
      Genset_L3_Current: d.Genset_L3_Current ?? 0,
    }));

    charts.voltageQualitySymmetry = data.map((d) => ({
      time: d.timestamp,
      Genset_L1L2_Voltage: d.Genset_L1L2_Voltage ?? 0,
      Genset_L2L3_Voltage: d.Genset_L2L3_Voltage ?? 0,
      Genset_L3L1_Voltage: d.Genset_L3L1_Voltage ?? 0,
      voltageImbalance: this.formulas.calculateVoltageImbalance(d),
      Genset_LL_Avg_Voltage: this.formulas.calculateAvgLLVoltage(d),
    }));

    charts.loadVsPowerFactor = data.map((d) => ({
      time: d.timestamp,
      LoadPercent: this.formulas.calculateLoadPercent?.(d),
      Genset_Total_Power_Factor_calculated:
        d.Genset_Total_Power_Factor_calculated ?? 0,
    }));

    charts.electroMechanicalStress = data.map((d) => ({
      time: d.timestamp,
      LoadStress: this.formulas.calculateLoadStress(d),
      // PowerLossFactor: this.formulas.calculatePowerLossFactor(d),
    }));

    charts.lossesThermalStress = data.map((d) => ({
      time: d.timestamp,
      PowerLossFactor: this.formulas.calculatePowerLossFactor(d),
      I2: this.formulas.calculateThermalStress(d),
    }));

    charts.frequencyRegulationEffectiveness = data.map((d) => ({
      time: d.timestamp,
      Genset_Frequency_OP_calculated: d.Genset_Frequency_OP_calculated ?? 0,
      Frequency_Deviation_Rad: d.Frequency_Deviation_Rad ?? 0,
    }));

    return charts;
  }

  private mapChartsDashboard3(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.intakeBoost = data.map((d) => ({
      time: d.timestamp,
      Intake_Manifold3_Temperature: d.Intake_Manifold3_Temperature ?? 0,
      Boost_Pressure: d.Boost_Pressure ?? 0,
    }));

    charts.thermalStress = data.map((d) => ({
      time: d.timestamp,
      thermalStressF: this.formulas.calculateThermalStressF(d),
      thermalStressC: this.formulas.calculateThermalStressC(d),
      OTSRF: this.formulas.calculateOTSRF(d),
      OTSRC: this.formulas.calculateOTSRC(d),
    }));

    charts.coolingMargin = data.map((d) => ({
      time: d.timestamp,
      Cooling_MarginF: this.formulas.calculateCoolingMarginF(d),
      Cooling_MarginC: this.formulas.calculateCoolingMarginC(d),
    }));

    charts.voltageImbalanceChart = data.map((d) => ({
      time: d.timestamp,
      avg_LL_Voltage: this.formulas.calculateAvgLLVoltage(d),
      voltageImbalance: this.formulas.calculateVoltageImbalance(d),
    }));

    return charts;
  }

  private mapChartsDashboard4(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.lubricationRiskIndex = data.map((d) => ({
      time: d.timestamp,
      Oil_Pressure: d.Oil_Pressure ?? 0,
      Oil_Temperature: d.Oil_Temperature ?? 0,
      Lubrication_Risk_Index: this.formulas.calculateLubricationRiskIndex(d),
    }));

    charts.oilPressureEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Oil_Pressure: d.Oil_Pressure ?? 0,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? 0,
    }));

    charts.boostFuelOutlet = data.map((d) => ({
      time: d.timestamp,
      Boost_Pressure: d.Boost_Pressure ?? 0,
      Fuel_Outlet_Pressure_calculated: d.Fuel_Outlet_Pressure_calculated ?? 0,
    }));

    charts.boostLoad = data.map((d) => ({
      time: d.timestamp,
      Boost_Pressure: d.Boost_Pressure ?? 0,
      LoadPercent: this.formulas.calculateLoadPercent(d),
    }));

    charts.fuelOutletBiometric = data.map((d) => ({
      time: d.timestamp,
      Fuel_Outlet_Pressure_calculated: d.Fuel_Outlet_Pressure_calculated ?? 0,
      Barometric_Absolute_Pressure: d.Barometric_Absolute_Pressure ?? 0,
    }));

    return charts;
  }

  private mapChartsDashboard5(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.fuelRateLoad = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? 0,
      LoadPercent: this.formulas.calculateLoadPercent(d),
    }));

    charts.airFuelEffectiveness = data.map((d) => ({
      time: d.timestamp,
      AirFuelEffectiveness: this.formulas.calculateAirFuelEffectiveness(d),
    }));

    charts.specificFuelConsumption = data.map((d) => ({
      time: d.timestamp,
      SpecificFuelConsumption:
        this.formulas.calculateSpecificFuelConsumption(d),
      Genset_Efficiency: d.Genset_Frequency_OP_calculated ?? 0,
    }));

    charts.heatRate = data.map((d) => ({
      time: d.timestamp,
      HeatRate: this.formulas.calculateHeatRate(d),
      ThermalEfficiency: this.formulas.calculateThermalEfficiency(d),
    }));

    charts.fuelFlowRateChange = data.map((d, i) => ({
      time: d.timestamp,
      FuelFlowRateChange: this.formulas.calculateFuelFlowRateChange(
        d,
        i > 0 ? data[i - 1] : null,
      ),
    }));

    charts.fuelRateOutlet = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? 0,
      Fuel_Outlet_Pressure: d.Fuel_Outlet_Pressure_calculated ?? 0,
    }));

    return charts;
  }

  private mapChartsDashboard6(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.engineTorqueVsRunningTime = data.map((d) => ({
      time: d.timestamp,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? 0,
      Engine_Running_Time_calculated: d.Engine_Running_Time_calculated ?? 0,
    }));

    charts.fuelRateVsTorque = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? 0,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? 0,
    }));

    charts.torqueResponseLoad = data.map((d) => ({
      time: d.timestamp,
      load_Percent: this.formulas.calculateLoadPercent(d),
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? 0,
    }));

    charts.averageEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? 0,
    }));

    charts.loadPercent = data.map((d) => ({
      time: d.timestamp,
      load_Percent: this.formulas.calculateLoadPercent(d),
      Genset_Efficiency: d.Genset_Frequency_OP_calculated,
    }));

    charts.mechanicalStress = data.map((d) => ({
      time: d.timestamp,
      Mechanical_Stress: this.formulas.calculateMechanicalStress(d),
      Electrical_Stress: this.formulas.calculateElectricalStress(d),
    }));

    charts.gensetPowerFactor = data.map((d) => ({
      time: d.timestamp,
      Genset_Total_kW: d.Genset_Total_kW ?? 0,
      Genset_Efficiency: d.Genset_Frequency_OP_calculated,
    }));

    // Use FormulasService for complex calculations
    charts.rpmStabilityIndex =
      this.formulas.calculateRPMStabilityWithLoad(data);
    charts.oscillationIndex = this.formulas.calculateOscillationIndex(data);
    charts.fuelConsumption = this.formulas.calculateFuelConsumption(data);

    return charts;
  }
}
