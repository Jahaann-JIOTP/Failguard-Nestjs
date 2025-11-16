/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// optimized-dashboard.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from 'src/trends/formulas.service';

interface DashboardConfig {
  projection: Record<string, number>;
  metricsMapper: (doc: any, data?: any[], mode?: string) => any;
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
    this.collection = this.db.collection('Navy_Gen_On');
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
        'Genset_Run_SS', // Added for running hours calculation
      ]),
      metricsMapper: (doc: any, data?: any[], mode?: string) =>
        this.mapMetricsWithMode(
          doc,
          data || [],
          mode || 'live',
          this.DASH1_METRICS,
        ),
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
      metricsMapper: (doc: any, data?: any[], mode?: string) =>
        this.mapMetricsDashboard2WithMode(doc, data || [], mode || 'live'),
      chartsMapper: (data: any[]) => this.mapChartsDashboard2(data),
    },
    dashboard3: {
      projection: this.getProjectionFields([
        'Intake_Manifold_Temperature_calculated',
        'Boost_Pressure',
        'Coolant_Temperature',
        'AfterCooler_Temperature',
        'Genset_LL_Avg_Voltage',
        'Oil_Temperature',
      ]),
      metricsMapper: (doc: any, data?: any[], mode?: string) =>
        this.mapMetricsDashboard3WithMode(doc, data || [], mode || 'live'),
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
      metricsMapper: (doc: any, data?: any[], mode?: string) =>
        this.mapMetricsDashboard4WithMode(doc, data || [], mode || 'live'),
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
      metricsMapper: (doc: any, data?: any[], mode?: string) =>
        this.mapMetricsDashboard5WithMode(doc, data || [], mode || 'live'),
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
      metricsMapper: (doc: any, data?: any[], mode?: string) =>
        this.mapMetricsDashboard6WithMode(doc, data || [], mode || 'live'),
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
   * UPDATED: Core Data Fetching Logic with Mode-specific Zero-fill
   * ------------------- */
  // private async fetchDashboardData(
  //   mode: 'live' | 'historic' | 'range',
  //   config: DashboardConfig,
  //   start?: string,
  //   end?: string,
  // ) {
  //   const pipeline = this.buildAggregationPipeline(
  //     mode,
  //     config.projection,
  //     start,
  //     end,
  //   );

  //   console.log('Executing pipeline for mode:', mode);
  //   console.log('Date range:', { start, end });

  //   const data = await this.collection.aggregate(pipeline).toArray();

  //   console.log(
  //     `Fetched ${data.length} records from database for mode: ${mode}`,
  //   );

  //   // 🔥 NEW: Enhanced data validation logging
  //   this.logDataValidation(data, mode, config.projection);

  //   if (!data.length) {
  //     console.log('No data found for query:', { mode, start, end });
  //     return {
  //       metrics: mode === 'range' ? { onDurationMinutes: 0 } : {},
  //       charts: {},
  //     };
  //   }

  //   // ✅ UPDATED: Conditional zero-fill based on mode
  //   let formattedData;
  //   if (mode === 'historic') {
  //     // 🔥 HISTORIC MODE: Fill all missing fields with zero
  //     formattedData = data.map((doc) => ({
  //       ...this.fillMissingFieldsWithZero(doc, config.projection),
  //       timestamp: this.formatDateTimestamp(doc.timestamp),
  //     }));
  //   } else {
  //     // 🔥 RANGE & LIVE MODE: Keep original data (no zero-fill)
  //     formattedData = data.map((doc) => ({
  //       ...doc,
  //       timestamp: this.formatDateTimestamp(doc.timestamp),
  //     }));
  //   }

  //   const latest = formattedData[formattedData.length - 1];

  //   // ✅ FIX: Ensure data is always defined
  //   const safeData = formattedData || [];

  //   // ✅ UPDATED: Pass safeData to metrics mapper
  //   let metrics = config.metricsMapper(latest, safeData, mode);

  //   // ✅ ADDED: Calculate running hours for all modes
  //   if (mode === 'live') {
  //     // For live mode, use the latest running time value
  //     metrics.runningHours = latest.Engine_Running_TIME_calculated || 0;
  //   } else {
  //     // For historic/range mode, calculate running hours from data
  //     metrics.runningHours = this.calculateRunningHours(safeData);
  //   }

  //   if (mode === 'range') {
  //     metrics = {
  //       ...metrics,
  //       onDurationMinutes: this.calculateOnDurationDate(safeData),
  //     };
  //   }

  //   // ✅ UPDATED: Remove zero values but keep important metrics
  //   metrics = this.removeZeroValuesButKeepImportant(metrics);

  //   return {
  //     metrics,
  //     charts: config.chartsMapper(safeData),
  //   };
  // }

  // ✅ UPDATE in fetchDashboardData method - Line ~150 ke aas paas
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

    console.log('Executing pipeline for mode:', mode);
    console.log('Date range:', { start, end });

    const data = await this.collection.aggregate(pipeline).toArray();

    console.log(
      `Fetched ${data.length} records from database for mode: ${mode}`,
    );

    // 🔥 NEW: Enhanced data validation logging
    this.logDataValidation(data, mode, config.projection);

    if (!data.length) {
      console.log('No data found for query:', { mode, start, end });
      return {
        metrics: mode === 'range' ? { onDurationMinutes: 0 } : {},
        charts: {},
      };
    }

    // ✅ UPDATED: Conditional zero-fill based on mode
    let formattedData;
    if (mode === 'historic') {
      // 🔥 HISTORIC MODE: Fill all missing fields with zero
      formattedData = data.map((doc) => ({
        ...this.fillMissingFieldsWithZero(doc, config.projection),
        timestamp: this.formatDateTimestamp(doc.timestamp),
      }));
    } else {
      // 🔥 RANGE & LIVE MODE: Keep original data (no zero-fill)
      formattedData = data.map((doc) => ({
        ...doc,
        timestamp: this.formatDateTimestamp(doc.timestamp),
      }));
    }

    const latest = formattedData[formattedData.length - 1];

    // ✅ FIX: Pass empty array for live mode to ensure latest document values
    const metricsData = mode === 'live' ? [] : formattedData;

    // ✅ UPDATED: Pass correct data to metrics mapper
    let metrics = config.metricsMapper(latest, metricsData, mode);

    // ✅ ADDED: Calculate running hours for all modes
    if (mode === 'live') {
      // For live mode, use the latest running time value
      metrics.runningHours = latest.Engine_Running_TIME_calculated || 0;
    } else {
      // For historic/range mode, calculate running hours from data
      metrics.runningHours = this.calculateRunningHours(formattedData);
    }

    if (mode === 'range') {
      metrics = {
        ...metrics,
        onDurationMinutes: this.calculateOnDurationDate(formattedData),
      };
    }

    // ✅ UPDATED: Remove zero values but keep important metrics
    metrics = this.removeZeroValuesButKeepImportant(metrics);

    return {
      metrics,
      charts: config.chartsMapper(formattedData),
    };
  }

  /** -------------------
   * NEW: Fill Missing Fields with Zero (Historic Mode Only)
   * ------------------- */
  private fillMissingFieldsWithZero(
    doc: any,
    projection: Record<string, number>,
  ): any {
    const filledDoc = { ...doc };

    // Get all fields from projection (excluding timestamp)
    const projectedFields = Object.keys(projection).filter(
      (field) => field !== 'timestamp',
    );

    projectedFields.forEach((field) => {
      if (filledDoc[field] === undefined || filledDoc[field] === null) {
        filledDoc[field] = 0;
      }
    });

    return filledDoc;
  }

  /** -------------------
   * NEW: Enhanced Data Validation Logging
   * ------------------- */
  private logDataValidation(
    data: any[],
    mode: string,
    projection: Record<string, number>,
  ) {
    if (data.length === 0) {
      console.log(`=== NO DATA for ${mode.toUpperCase()} MODE ===`);
      return;
    }

    console.log(`=== DATA VALIDATION for ${mode.toUpperCase()} MODE ===`);
    console.log(`Total records: ${data.length}`);

    // Check first record for field completeness
    const firstRecord = data[0];
    const projectedFields = Object.keys(projection).filter(
      (field) => field !== 'timestamp',
    );

    const missingFields = projectedFields.filter(
      (field) =>
        firstRecord[field] === undefined || firstRecord[field] === null,
    );

    console.log(`Fields in projection: ${projectedFields.length}`);
    console.log(`Missing fields in first record: ${missingFields.length}`);

    if (missingFields.length > 0) {
      console.log('Missing fields sample:', missingFields.slice(0, 5)); // Show first 5
    }

    // Check Genset_Run_SS for range mode
    if (mode === 'range') {
      const gensetValues = data
        .map((d) => d.Genset_Run_SS)
        .filter((val) => val !== undefined);
      const validGensetValues = gensetValues.filter(
        (val) => val >= 1 && val <= 6,
      );

      console.log(
        `Genset_Run_SS values: ${gensetValues.length} total, ${validGensetValues.length} valid (1-6)`,
      );

      if (validGensetValues.length === 0) {
        console.warn('⚠️ No valid Genset_Run_SS values found in range mode!');
      }
    }

    console.log('First record timestamp:', firstRecord.timestamp);
    console.log('Last record timestamp:', data[data.length - 1].timestamp);

    // Log time interval between records
    if (data.length >= 2) {
      const firstTime = new Date(data[0].timestamp).getTime();
      const secondTime = new Date(data[1].timestamp).getTime();
      const intervalMs = secondTime - firstTime;
      console.log(
        `Approximate interval between records: ${intervalMs / 1000} seconds`,
      );
    }

    console.log('================================');
  }

  /** -------------------
   * UPDATED: Remove Zero Values but Keep Important Metrics
   * ------------------- */
  private removeZeroValuesButKeepImportant(
    metrics: Record<string, any>,
  ): Record<string, any> {
    const cleanedMetrics: Record<string, any> = {};
    const importantMetrics = [
      'runningHours',
      'onDurationMinutes',
      'load',
      'rpm',
      'powerFactor',
      'fuelConsumed',
      'batteryVoltage',
      'voltageL1',
      'voltageL2',
      'voltageL3',
      'activePowerL1',
      'activePowerL2',
      'activePowerL3',
      'intakeTemperature',
      'boostPressure',
      'oilPressure',
      'engineSpeed',
      'fuelRate',
      'totalFuelConsumption',
      'energyKWh',
    ];

    for (const [key, value] of Object.entries(metrics)) {
      // Keep important metrics even if zero
      if (importantMetrics.includes(key)) {
        cleanedMetrics[key] = value;
      }
      // Skip if value is 0, null, undefined, or empty string (for non-important metrics)
      else if (
        value !== 0 &&
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        cleanedMetrics[key] = value;
      }
    }

    console.log(
      'Cleaned metrics - removed zero values:',
      Object.keys(metrics).length - Object.keys(cleanedMetrics).length,
      'fields removed',
    );

    return cleanedMetrics;
  }

  /** -------------------
   * CORRECT: Running Hours Calculation
   * ------------------- */
  private calculateRunningHours(data: any[]): number {
    if (data.length === 0) return 0;

    // Method 1: Use the actual running hours from database if available
    const latestRunningHours =
      data[data.length - 1].Engine_Running_TIME_calculated;
    if (latestRunningHours && latestRunningHours > 0) {
      return +latestRunningHours.toFixed(2);
    }

    // Method 2: Calculate total time span when genset was ON
    let totalRunningTimeMs = 0;
    let lastRunningTime: number | null = null;

    // Sort data by timestamp to be safe
    const sortedData = [...data].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    for (const record of sortedData) {
      const isRunning = record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6;
      const currentTime = new Date(record.timestamp).getTime();

      if (isRunning && lastRunningTime === null) {
        // Genset started running
        lastRunningTime = currentTime;
      } else if (!isRunning && lastRunningTime !== null) {
        // Genset stopped running, add to total
        totalRunningTimeMs += currentTime - lastRunningTime;
        lastRunningTime = null;
      }
    }

    // If genset was still running at the end
    if (lastRunningTime !== null) {
      const endTime = new Date(
        sortedData[sortedData.length - 1].timestamp,
      ).getTime();
      totalRunningTimeMs += endTime - lastRunningTime;
    }

    const runningHours = totalRunningTimeMs / (1000 * 60 * 60); // ms to hours
    return +runningHours.toFixed(2);
  }

  /** -------------------
   * NEW: Calculate Average for Historic and Range Modes
   * ------------------- */
  private calculateAverageMetrics(
    data: any[],
    metricsConfig: any,
  ): Record<string, number> {
    const averages: Record<string, number> = {};

    for (const [key, calculator] of Object.entries(metricsConfig)) {
      // ✅ FIX: Type assertion for calculator function
      const calcFunc = calculator as (doc: any) => number;

      const values = data
        .map((doc) => calcFunc(doc))
        .filter((val) => val !== null && val !== undefined);

      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        averages[key] = +(sum / values.length).toFixed(2);
      } else {
        averages[key] = 0;
      }
    }

    return averages;
  }

  /** -------------------
   * UPDATED: Metrics Mapping with Mode Support
   * ------------------- */
  private mapMetricsWithMode(
    doc: any,
    data: any[],
    mode: string,
    definitions: any,
  ) {
    let metrics: Record<string, number> = {};

    if (mode === 'live') {
      // Live mode: Use latest document
      for (const key in definitions) {
        const value = definitions[key](doc);
        metrics[key] = typeof value === 'number' ? +value.toFixed(2) : 0;
      }
    } else {
      // Historic/Range mode: Calculate averages
      metrics = this.calculateAverageMetrics(data, definitions);
    }

    return metrics;
  }

  /** -------------------
   * UPDATED: Dashboard-specific Metrics with Mode Support
   * ------------------- */
  private mapMetricsDashboard2WithMode(
    doc: any,
    data: any[],
    mode: string,
  ): Record<string, number> {
    if (mode === 'live') {
      // Live mode - latest values
      return {
        voltageL1: doc.Genset_L1L2_Voltage || 0,
        voltageL2: doc.Genset_L2L3_Voltage || 0,
        voltageL3: doc.Genset_L3L1_Voltage || 0,
        activePowerL1: doc.Genset_L1_Active_Power || 0,
        activePowerL2: doc.Genset_L2_Active_Power || 0,
        activePowerL3: doc.Genset_L3_Active_Power || 0,
        CurrentImbalance: this.formulas.calculateCurrentImbalance(doc) || 0,
        voltageImbalance: this.formulas.calculateVoltageImbalance(doc) || 0,
        powerLossFactor: this.formulas.calculatePowerLossFactor(doc) || 0,
        thermalStress: this.formulas.calculateThermalStress(doc) || 0,
      };
    } else {
      // Historic/Range mode - averages
      const metricsConfig = {
        voltageL1: (d: any) => d.Genset_L1L2_Voltage || 0,
        voltageL2: (d: any) => d.Genset_L2L3_Voltage || 0,
        voltageL3: (d: any) => d.Genset_L3L1_Voltage || 0,
        activePowerL1: (d: any) => d.Genset_L1_Active_Power || 0,
        activePowerL2: (d: any) => d.Genset_L2_Active_Power || 0,
        activePowerL3: (d: any) => d.Genset_L3_Active_Power || 0,
        CurrentImbalance: (d: any) =>
          this.formulas.calculateCurrentImbalance(d) || 0,
        voltageImbalance: (d: any) =>
          this.formulas.calculateVoltageImbalance(d) || 0,
        powerLossFactor: (d: any) =>
          this.formulas.calculatePowerLossFactor(d) || 0,
        thermalStress: (d: any) => this.formulas.calculateThermalStress(d) || 0,
      };

      return this.calculateAverageMetrics(data, metricsConfig);
    }
  }

  private mapMetricsDashboard3WithMode(doc: any, data: any[], mode: string) {
    if (mode === 'live') {
      return {
        intakeTemperature: doc.Intake_Manifold_Temperature_calculated ?? 0,
        boostPressure: doc.Boost_Pressure ?? 0,
        avg_LL_Voltage: this.formulas.calculateAvgLLVoltage(doc) || 0,
        voltageImbalance: this.formulas.calculateVoltageImbalance(doc) || 0,
        coolingMarginF: this.formulas.calculateCoolingMarginF(doc) || 0,
        coolingMarginC: this.formulas.calculateCoolingMarginC(doc) || 0,
      };
    } else {
      const metricsConfig = {
        intakeTemperature: (d: any) =>
          d.Intake_Manifold_Temperature_calculated ?? 0,
        boostPressure: (d: any) => d.Boost_Pressure ?? 0,
        avg_LL_Voltage: (d: any) => this.formulas.calculateAvgLLVoltage(d) || 0,
        voltageImbalance: (d: any) =>
          this.formulas.calculateVoltageImbalance(d) || 0,
        coolingMarginF: (d: any) =>
          this.formulas.calculateCoolingMarginF(d) || 0,
        coolingMarginC: (d: any) =>
          this.formulas.calculateCoolingMarginC(d) || 0,
      };

      return this.calculateAverageMetrics(data, metricsConfig);
    }
  }

  private mapMetricsDashboard4WithMode(doc: any, data: any[], mode: string) {
    if (mode === 'live') {
      return {
        lubricationRiskIndex:
          this.formulas.calculateLubricationRiskIndex(doc) || 0,
        oilPressure: doc.Oil_Pressure ?? 0,
        engineSpeed: doc.Averagr_Engine_Speed ?? 0,
        boostPressure: doc.Boost_Pressure ?? 0,
        fuelOutletPressure: doc.Fuel_Outlet_Pressure_calculated ?? 0,
        biometricPressure: doc.Barometric_Absolute_Pressure ?? 0,
        loadPercent: this.formulas.calculateLoadPercent(doc) || 0,
      };
    } else {
      const metricsConfig = {
        lubricationRiskIndex: (d: any) =>
          this.formulas.calculateLubricationRiskIndex(d) || 0,
        oilPressure: (d: any) => d.Oil_Pressure ?? 0,
        engineSpeed: (d: any) => d.Averagr_Engine_Speed ?? 0,
        boostPressure: (d: any) => d.Boost_Pressure ?? 0,
        fuelOutletPressure: (d: any) => d.Fuel_Outlet_Pressure_calculated ?? 0,
        biometricPressure: (d: any) => d.Barometric_Absolute_Pressure ?? 0,
        loadPercent: (d: any) => this.formulas.calculateLoadPercent(d) || 0,
      };

      return this.calculateAverageMetrics(data, metricsConfig);
    }
  }

  private mapMetricsDashboard5WithMode(doc: any, data: any[], mode: string) {
    if (mode === 'live') {
      return {
        fuelRate: doc.Fuel_Rate ?? 0,
        loadPercent: this.formulas.calculateLoadPercent(doc) || 0,
        airFuelEffectiveness:
          this.formulas.calculateAirFuelEffectiveness(doc) || 0,
        specificFuelConsumption:
          this.formulas.calculateSpecificFuelConsumption(doc) || 0,
        heatRate: this.formulas.calculateHeatRate(doc) || 0,
        fuelOutletPressure: doc.Fuel_Outlet_Pressure_calculated ?? 0,
      };
    } else {
      const metricsConfig = {
        fuelRate: (d: any) => d.Fuel_Rate ?? 0,
        loadPercent: (d: any) => this.formulas.calculateLoadPercent(d) || 0,
        airFuelEffectiveness: (d: any) =>
          this.formulas.calculateAirFuelEffectiveness(d) || 0,
        specificFuelConsumption: (d: any) =>
          this.formulas.calculateSpecificFuelConsumption(d) || 0,
        heatRate: (d: any) => this.formulas.calculateHeatRate(d) || 0,
        fuelOutletPressure: (d: any) => d.Fuel_Outlet_Pressure_calculated ?? 0,
      };

      return this.calculateAverageMetrics(data, metricsConfig);
    }
  }

  private mapMetricsDashboard6WithMode(doc: any, data: any[], mode: string) {
    if (mode === 'live') {
      return {
        totalFuelConsumption: doc.Total_Fuel_Consumption_calculated ?? 0,
        energyKWh: doc.Energy_kWh ?? 0,
        fuelConsumptionCurrentRun: doc.Fuel_Consumption_Current_Run ?? 0,
      };
    } else {
      const metricsConfig = {
        totalFuelConsumption: (d: any) =>
          d.Total_Fuel_Consumption_calculated ?? 0,
        energyKWh: (d: any) => d.Energy_kWh ?? 0,
        fuelConsumptionCurrentRun: (d: any) =>
          d.Fuel_Consumption_Current_Run ?? 0,
      };

      return this.calculateAverageMetrics(data, metricsConfig);
    }
  }

  /** -------------------
   * Date Format Validation and Correction
   * ------------------- */
  private validateAndFormatDate(dateString: string): Date {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    console.log('Original date string:', dateString);

    // ✅ Clean unwanted parts like " 00:00"
    let cleanedDate = dateString
      .trim()
      .replace(' 00:00', '') // remove space + 00:00
      .replace(/\s+/g, ''); // remove extra spaces

    // ✅ Fix incomplete ISO (e.g. 2025-11-04T21:21:21.709)
    // if missing timezone, add 'Z' so JS parses as UTC
    if (!cleanedDate.endsWith('Z') && !cleanedDate.includes('+')) {
      cleanedDate += 'Z';
    }

    let date = new Date(cleanedDate);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid time value: ${dateString}`);
    }

    // ✅ Convert UTC → Asia/Karachi (UTC+5)
    const karachiOffsetMinutes = 5 * 60;
    const localDate = new Date(date.getTime() + karachiOffsetMinutes * 60000);

    console.log(
      `Converted (Asia/Karachi): ${date.toISOString()} -> ${localDate.toISOString()}`,
    );
    return localDate;
  }

  /** -------------------
   * UPDATED: Aggregation Pipeline with Genset Filter for Range Mode
   * ------------------- */
  private buildAggregationPipeline(
    mode: string,
    projection: Record<string, number>,
    start?: string,
    end?: string,
  ): any[] {
    const pipeline: any[] = [];
    const matchStage: any = {};

    console.log('=== BUILDING PIPELINE ===');
    console.log('Mode:', mode);
    console.log('Original dates:', { start, end });

    if ((mode === 'historic' || mode === 'range') && start && end) {
      try {
        const startDate = this.validateAndFormatDate(start);
        const endDate = this.validateAndFormatDate(end);

        // ✅ Karachi offset (UTC+5)
        const karachiOffsetMs = 5 * 60 * 60 * 1000;

        // ✅ Convert local → UTC
        const startUTC = new Date(startDate.getTime() - karachiOffsetMs);
        const endUTC = new Date(endDate.getTime() - karachiOffsetMs);

        // ✅ Adjust hours
        if (startDate.toDateString() === endDate.toDateString()) {
          startUTC.setUTCHours(0, 0, 0, 0);
          endUTC.setUTCHours(23, 59, 59, 999);
        } else {
          endUTC.setUTCHours(23, 59, 59, 999);
        }

        // ✅ Hybrid filter for string or Date timestamps
        matchStage.$expr = {
          $and: [
            {
              $gte: [
                {
                  $cond: {
                    if: { $eq: [{ $type: '$timestamp' }, 'string'] },
                    then: { $dateFromString: { dateString: '$timestamp' } },
                    else: '$timestamp',
                  },
                },
                startUTC,
              ],
            },
            {
              $lte: [
                {
                  $cond: {
                    if: { $eq: [{ $type: '$timestamp' }, 'string'] },
                    then: { $dateFromString: { dateString: '$timestamp' } },
                    else: '$timestamp',
                  },
                },
                endUTC,
              ],
            },
          ],
        };

        // 🔥 CRITICAL: Only apply Genset_Run_SS filter for RANGE mode
        if (mode === 'range') {
          matchStage.Genset_Run_SS = { $gte: 1, $lte: 6 };
        }

        console.log(`${mode} mode - Final UTC range:`, {
          startUTC: startUTC.toISOString(),
          endUTC: endUTC.toISOString(),
          gensetFilter: mode === 'range' ? '1-6' : 'none',
        });
      } catch (error) {
        console.error('Date validation error:', error.message);
        throw error;
      }
    } else if (mode === 'live') {
      const sixHoursAgo = new Date();
      sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

      // ✅ Handle hybrid type for "live" mode as well
      matchStage.$expr = {
        $gte: [
          {
            $cond: {
              if: { $eq: [{ $type: '$timestamp' }, 'string'] },
              then: { $dateFromString: { dateString: '$timestamp' } },
              else: '$timestamp',
            },
          },
          sixHoursAgo,
        ],
      };

      console.log('Live mode - Last 6 hours');
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
      console.log('Final match stage:', JSON.stringify(matchStage, null, 2));
    }

    pipeline.push({ $project: projection });
    pipeline.push({ $sort: { timestamp: 1 } });

    return pipeline;
  }

  /** -------------------
   * Date Timestamp Formatter
   * ------------------- */
  private formatDateTimestamp(timestamp: any): string {
    if (!timestamp) return '';

    try {
      // Convert timestamp to a Date object if needed
      let date: Date;
      if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return String(timestamp);
      }

      // Format for chart (example: "15 Oct 17:10" or just "17:10:07")
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false, // 24-hour format
      };

      return date.toLocaleString('en-US', options);
    } catch (error) {
      console.error('Error formatting timestamp:', timestamp, error);
      return String(timestamp);
    }
  }

  /** -------------------
   * On Duration Calculator for Date Timestamps
   * ------------------- */
  private calculateOnDurationDate(data: any[]): number {
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
      'Genset_Run_SS', // Added for running hours calculation
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
      console.log(`⚡ Cache hit for: ${key}`);
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
   * UPDATED: Charts Mapping Functions with Mode-specific Zero-fill
   * ------------------- */
  private mapCharts(data: any[], definitions: any) {
    const charts: Record<string, any[]> = {};

    for (const chartName in definitions) {
      charts[chartName] = data.map((d) => {
        const entry: any = { time: d.timestamp };
        definitions[chartName].forEach((field: string) => {
          // Use the data as-is (already zero-filled for historic mode)
          entry[field] = d[field] ?? null;
        });
        return entry;
      });
    }

    // Special charts
    charts.CurrentImbalanceNeutral = data.map((d) => ({
      time: d.timestamp,
      CurrentImbalance: this.formulas.calculateCurrentImbalance(d) || 0,
      neutralCurrent: this.formulas.calculateNeutralCurrent(d) || 0,
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
        CurrentImbalance: this.formulas.calculateCurrentImbalance(d) || 0,
      };
    });

    return charts;
  }

  private mapChartsDashboard2(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.phaseBalanceEffectiveness = data.map((d) => ({
      time: d.timestamp,
      Genset_L1_Current: d.Genset_L1_Current ?? null,
      Genset_L2_Current: d.Genset_L2_Current ?? null,
      Genset_L3_Current: d.Genset_L3_Current ?? null,
    }));

    charts.voltageQualitySymmetry = data.map((d) => ({
      time: d.timestamp,
      Genset_L1L2_Voltage: d.Genset_L1L2_Voltage ?? null,
      Genset_L2L3_Voltage: d.Genset_L2L3_Voltage ?? null,
      Genset_L3L1_Voltage: d.Genset_L3L1_Voltage ?? null,
      voltageImbalance: this.formulas.calculateVoltageImbalance(d) || 0,
      Genset_LL_Avg_Voltage: this.formulas.calculateAvgLLVoltage(d) || 0,
    }));

    charts.loadVsPowerFactor = data.map((d) => ({
      time: d.timestamp,
      LoadPercent: this.formulas.calculateLoadPercent?.(d) || 0,
      Genset_Total_Power_Factor_calculated:
        d.Genset_Total_Power_Factor_calculated ?? null,
    }));

    charts.electroMechanicalStress = data.map((d) => ({
      time: d.timestamp,
      LoadStress: this.formulas.calculateLoadStress(d) || 0,
    }));

    charts.lossesThermalStress = data.map((d) => ({
      time: d.timestamp,
      PowerLossFactor: this.formulas.calculatePowerLossFactor(d) || 0,
      I2: this.formulas.calculateThermalStress(d) || 0,
    }));

    charts.frequencyRegulationEffectiveness = data.map((d) => ({
      time: d.timestamp,
      Genset_Frequency_OP_calculated: d.Genset_Frequency_OP_calculated ?? null,
      Frequency_Deviation_Rad: d.Frequency_Deviation_Rad ?? null,
    }));

    return charts;
  }

  private mapChartsDashboard3(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.intakeBoost = data.map((d) => ({
      time: d.timestamp,
      Intake_Manifold3_Temperature:
        d.Intake_Manifold_Temperature_calculated ?? null,
      // Boost_Pressure: d.Boost_Pressure ?? null,
      oiltemp: d.Oil_Temperature ?? null,
    }));

    charts.thermalStress = data.map((d) => ({
      time: d.timestamp,
      thermalStressF: this.formulas.calculateThermalStressF(d) || 0,
      thermalStressC: this.formulas.calculateThermalStressC(d) || 0,
      OTSRF: this.formulas.calculateOTSRF(d) || 0,
      OTSRC: this.formulas.calculateOTSRC(d) || 0,
    }));

    charts.coolingMargin = data.map((d) => ({
      time: d.timestamp,
      Cooling_MarginF: this.formulas.calculateCoolingMarginF(d) || 0,
      Cooling_MarginC: this.formulas.calculateCoolingMarginC(d) || 0,
    }));

    charts.voltageImbalanceChart = data.map((d) => ({
      time: d.timestamp,
      avg_LL_Voltage: this.formulas.calculateAvgLLVoltage(d) || 0,
      voltageImbalance: this.formulas.calculateVoltageImbalance(d) || 0,
    }));

    return charts;
  }

  private mapChartsDashboard4(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.lubricationRiskIndex = data.map((d) => ({
      time: d.timestamp,
      Oil_Pressure: d.Oil_Pressure ?? null,
      Oil_Temperature: d.Oil_Temperature ?? null,
      Lubrication_Risk_Index:
        this.formulas.calculateLubricationRiskIndex(d) || 0,
    }));

    charts.oilPressureEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Oil_Pressure: d.Oil_Pressure ?? null,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? null,
    }));

    charts.boostFuelOutlet = data.map((d) => ({
      time: d.timestamp,
      Boost_Pressure: d.Boost_Pressure ?? null,
      Fuel_Outlet_Pressure_calculated:
        d.Fuel_Outlet_Pressure_calculated ?? null,
    }));

    charts.boostLoad = data.map((d) => ({
      time: d.timestamp,
      Boost_Pressure: d.Boost_Pressure ?? null,
      LoadPercent: this.formulas.calculateLoadPercent(d) || 0,
    }));

    charts.fuelOutletBiometric = data.map((d) => ({
      time: d.timestamp,
      Fuel_Outlet_Pressure_calculated:
        d.Fuel_Outlet_Pressure_calculated ?? null,
      Barometric_Absolute_Pressure: d.Barometric_Absolute_Pressure ?? null,
    }));

    return charts;
  }

  private mapChartsDashboard5(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.fuelRateLoad = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? null,
      LoadPercent: this.formulas.calculateLoadPercent(d) || 0,
    }));

    charts.airFuelEffectiveness = data.map((d) => ({
      time: d.timestamp,
      AirFuelEffectiveness: this.formulas.calculateAirFuelEffectiveness(d) || 0,
    }));

    charts.specificFuelConsumption = data.map((d) => ({
      time: d.timestamp,
      SpecificFuelConsumption:
        this.formulas.calculateSpecificFuelConsumption(d) || 0,
      Genset_Efficiency: d.Genset_Frequency_OP_calculated ?? null,
    }));

    charts.heatRate = data.map((d) => ({
      time: d.timestamp,
      HeatRate: this.formulas.calculateHeatRate(d) || 0,
    }));

    charts.fuelFlowRateChange = data.map((d, i) => ({
      time: d.timestamp,
      FuelFlowRateChange:
        this.formulas.calculateFuelFlowRateChange(
          d,
          i > 0 ? data[i - 1] : null,
        ) || 0,
    }));

    charts.fuelRateOutlet = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? null,
      Fuel_Outlet_Pressure: d.Fuel_Outlet_Pressure_calculated ?? null,
    }));

    return charts;
  }

  private mapChartsDashboard6(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.engineTorqueVsRunningTime = data.map((d) => ({
      time: d.timestamp,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? null,
      Engine_Running_Time_calculated: d.Engine_Running_Time_calculated ?? null,
    }));

    charts.fuelRateVsTorque = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? null,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? null,
    }));

    charts.torqueResponseLoad = data.map((d) => ({
      time: d.timestamp,
      load_Percent: this.formulas.calculateLoadPercent(d) || 0,
      Percent_Engine_Torque_or_Duty_Cycle:
        d.Percent_Engine_Torque_or_Duty_Cycle ?? null,
    }));

    charts.averageEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? null,
    }));

    charts.loadPercent = data.map((d) => ({
      time: d.timestamp,
      load_Percent: this.formulas.calculateLoadPercent(d) || 0,
      Genset_Efficiency: d.Genset_Frequency_OP_calculated ?? null,
    }));

    charts.mechanicalStress = data.map((d) => ({
      time: d.timestamp,
      Mechanical_Stress: this.formulas.calculateMechanicalStress(d) || 0,
      Electrical_Stress: this.formulas.calculateElectricalStress(d) || 0,
    }));

    charts.gensetPowerFactor = data.map((d) => ({
      time: d.timestamp,
      Genset_Total_kW: d.Genset_Total_kW ?? null,
      Genset_Efficiency: d.Genset_Frequency_OP_calculated ?? null,
    }));

    // Use FormulasService for complex calculations
    charts.rpmStabilityIndex =
      this.formulas.calculateRPMStabilityWithLoad(data);
    charts.oscillationIndex = this.formulas.calculateOscillationIndex(data);
    charts.fuelConsumption = this.formulas.calculateFuelConsumption(data);

    return charts;
  }
}
