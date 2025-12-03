/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
  // private cache = new Map<string, { data: any; ts: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes (live ke liye best)

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulas: FormulasService,
  ) {
    this.collection = this.db.collection('navy_12s');
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
        'Engine_Running_Time_calculated',
        'Battery_Voltage_calculated',
        'Genset_Total_Power_Factor_calculated',
        'Genset_Run_SS',
        'Genset_Total_kVA',
        'Genset_Application_kVA_Rating_PC2X',
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
        'Genset_L1_kW',
        'Genset_L2_kW',
        'Genset_L3_kW',
        'Genset_L1N_Voltage',
        'Genset_L2N_Voltage',
        'Genset_L3N_Voltage',
        'Genset_Total_KVA',
        'Genset_Total_Power_Factor_calculated',
        'Genset_Application_kVA_Rating_PC2X',
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
        'Percent_Engine_Torque_or_Duty_Cycle',
        'Genset_Total_kVA',
        'Genset_Application_kVA_Rating_PC2X',
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
        'Percent_Engine_Torque_or_Duty_Cycle',
        'Fuel_Rate',
        'Genset_Total_kW',
        'Genset_Total_kVA',
        'Genset_Application_kVA_Rating_PC2X',
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
        'Percent_Engine_Torque_or_Duty_Cycle',
        'Genset_Total_kW',
        'Genset_Total_Power_Factor_calculated',
        'Genset_Total_kVA',
        'Genset_Application_kVA_Rating_PC2X',
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
        'Genset_Total_Power_Factor_calculated',
        'Genset_Total_kW',
        'Genset_Total_kVA',
        'Genset_Application_kVA_Rating_PC2X',
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
   * UPDATED: Core Data Fetching Logic with consistent running hours
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

    console.log('Executing pipeline for mode:', mode);
    console.log('Date range:', { start, end });

    const data = await this.collection.aggregate(pipeline).toArray();

    console.log(
      `Fetched ${data.length} records from database for mode: ${mode}`,
    );

    this.logDataValidation(data, mode, config.projection);

    if (!data.length) {
      console.log('No data found for query:', { mode, start, end });
      return {
        metrics: mode === 'range' ? { onDurationMinutes: 0 } : {},
        charts: {},
      };
    }

    let formattedData;
    if (mode === 'historic') {
      formattedData = data.map((doc) => ({
        ...this.fillMissingFieldsWithZero(doc, config.projection),
        timestamp: this.formatDateTimestamp(doc.timestamp),
      }));
    } else {
      formattedData = data.map((doc) => ({
        ...doc,
        timestamp: this.formatDateTimestamp(doc.timestamp),
      }));
    }

    const latest = formattedData[formattedData.length - 1];
    const metricsData = mode === 'live' ? [] : formattedData;
    let metrics = config.metricsMapper(latest, metricsData, mode);

    // ✅ FIXED: Use consistent running hours calculation
    let runningHoursDecimal;
    let runningHoursWithMinutes;

    if (mode === 'live') {
      runningHoursDecimal = latest.Engine_Running_Time_calculated || 0;
      runningHoursWithMinutes = this.convertToHoursMinutes(runningHoursDecimal);
      console.log(
        `Live mode - Running hours: ${runningHoursDecimal} = ${runningHoursWithMinutes.totalHours}`,
      );
    } else {
      // For historic/range mode, calculate from data
      runningHoursDecimal = this.calculateRunningHours(formattedData);
      runningHoursWithMinutes = this.convertToHoursMinutes(runningHoursDecimal);
      console.log(
        `Historic/Range mode - Running hours: ${runningHoursDecimal} = ${runningHoursWithMinutes.totalHours}`,
      );
    }

    // ✅ UPDATED: Total Fuel Consumed calculation (MAX - MIN) and convert to liters
    let totalFuelConsumed;
    let totalFuelConsumedLiters;
    if (mode === 'live') {
      totalFuelConsumed = latest.Total_Fuel_Consumption_calculated || 0;
      totalFuelConsumedLiters = totalFuelConsumed * 3.7854;
      console.log(
        `Live mode - Total Fuel Consumed from latest: ${totalFuelConsumed} gallons = ${totalFuelConsumedLiters} liters`,
      );
    } else {
      totalFuelConsumed = this.calculateTotalFuelConsumed(formattedData);
      totalFuelConsumedLiters = totalFuelConsumed * 3.7854;
    }

    // ✅ UPDATED: Fuel Consumed Current Run calculation
    let fuelConsumedCurrentRun;
    let fuelConsumedCurrentRunLiters;
    if (mode === 'live') {
      fuelConsumedCurrentRun = latest.Total_Fuel_Consumption_calculated || 0;
      fuelConsumedCurrentRunLiters = fuelConsumedCurrentRun * 3.7854;
      console.log(
        `Live mode - Fuel Consumed Current Run from latest: ${fuelConsumedCurrentRun} gallons = ${fuelConsumedCurrentRunLiters} liters`,
      );
    } else {
      fuelConsumedCurrentRun =
        this.calculateFuelConsumedCurrentRun(formattedData);
      fuelConsumedCurrentRunLiters = fuelConsumedCurrentRun * 3.7854;
    }

    // ✅ FIXED: Use consistent running hours values
    metrics = {
      ...metrics,
      runningHours: +runningHoursDecimal.toFixed(2), // Keep the decimal value
      runningHoursH: runningHoursWithMinutes.hours,
      runningHoursM: runningHoursWithMinutes.minutes,
      totalHours: runningHoursWithMinutes.totalHours, // Use the formatted "H:MM" value
      fuelConsumed: +totalFuelConsumedLiters.toFixed(2),
      fuelConsumedCurrentRun: +fuelConsumedCurrentRunLiters.toFixed(2),
    };

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
   * NEW: Calculate Fuel Consumed Current Run (last - first)
   * ------------------- */
  /** -------------------
   * UPDATED: Fuel Consumed Current Run calculation using only END DATE range
   * ------------------- */
  private calculateFuelConsumedCurrentRun(data: any[]): number {
    if (data.length === 0) return 0;

    // console.log(
    //   '=== DEBUG: Fuel Consumed Current Run Calculation (END DATE ONLY) ===',
    // );
    // console.log(`Total records: ${data.length}`);

    const fuelField = 'Total_Fuel_Consumption_calculated';
    const firstRecord = data[0];

    if (!(fuelField in firstRecord)) {
      // console.log(`❌ Field ${fuelField} not found in data`);
      return 0;
    }

    // console.log(`✅ Using fuel field for current run: ${fuelField}`);

    // ✅ CHANGED: Always use first and last of the current data range (end date)
    const firstValue = data[0][fuelField];
    const lastValue = data[data.length - 1][fuelField];

    // console.log(
    //   `END DATE RANGE - First value: ${firstValue}, Last value: ${lastValue}`,
    // );

    // Validate values
    if (
      firstValue === undefined ||
      firstValue === null ||
      isNaN(firstValue) ||
      lastValue === undefined ||
      lastValue === null ||
      isNaN(lastValue)
    ) {
      // console.log('❌ Invalid fuel values found');
      return 0;
    }

    const fuelConsumedCurrentRun = lastValue - firstValue;

    // console.log(
    //   `Fuel Consumed Current Run (END DATE) - LAST=${lastValue}, FIRST=${firstValue}, DIFF=${fuelConsumedCurrentRun}`,
    // );

    return Math.max(0, +fuelConsumedCurrentRun.toFixed(2));
  }

  /** -------------------
   * NEW: Calculate Total Fuel Consumed (MAX - MIN)
   * ------------------- */
  private calculateTotalFuelConsumed(data: any[]): number {
    if (data.length === 0) return 0;

    // console.log('=== DEBUG: Total Fuel Consumed Calculation ===');
    // console.log(`Total records: ${data.length}`);

    const fuelField = 'Total_Fuel_Consumption_calculated';
    const firstRecord = data[0];

    if (!(fuelField in firstRecord)) {
      // console.log(`❌ Field ${fuelField} not found in data`);
      // console.log('Available fields:', Object.keys(firstRecord));
      return 0;
    }

    // console.log(`✅ Using fuel field: ${fuelField}`);

    const fuelValues = data
      .map((d) => d[fuelField])
      .filter(
        (val) => val !== undefined && val !== null && !isNaN(val) && val >= 0,
      );

    // console.log(`Valid ${fuelField} values: ${fuelValues.length}`);

    if (fuelValues.length === 0) {
      // console.log('❌ No valid fuel values found');
      return 0;
    }

    // console.log('Sample fuel values:', fuelValues.slice(0, 5));

    const maxFuel = Math.max(...fuelValues);
    const minFuel = Math.min(...fuelValues);
    const totalFuelConsumed = maxFuel - minFuel;

    // console.log(
    //   `Total Fuel Consumed - MAX=${maxFuel.toFixed(2)}, MIN=${minFuel.toFixed(2)}, DIFF=${totalFuelConsumed.toFixed(2)}`,
    // );

    return +totalFuelConsumed.toFixed(2);
  }

  private convertToHoursMinutes(decimalHours: number): {
    hours: number;
    minutes: number;
    totalHours: string;
  } {
    // ✅ FIX: Proper conversion from decimal hours to hours and minutes
    const totalMinutes = Math.round(decimalHours * 60); // Round to nearest minute
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // Format as "3:25" for 3.42 hours
    const totalHoursFormatted = `${hours}:${minutes.toString().padStart(2, '0')}`;

    // console.log(
    //   `DEBUG: ${decimalHours} hours = ${hours}h ${minutes}m = ${totalHoursFormatted}`,
    // );

    return {
      hours: hours,
      minutes: minutes,
      totalHours: totalHoursFormatted,
    };
  }

  private calculateRunningHoursWithMinutes(data: any[]): {
    hours: number;
    minutes: number;
    totalHours: string;
  } {
    if (data.length === 0) return { hours: 0, minutes: 0, totalHours: '0:00' };

    const runningHoursField = 'Engine_Running_Time_calculated';
    const runningHoursValues = data
      .map((d) => d[runningHoursField])
      .filter(
        (val) => val !== undefined && val !== null && !isNaN(val) && val >= 0,
      );

    if (runningHoursValues.length === 0) {
      return { hours: 0, minutes: 0, totalHours: '0:00' };
    }

    const firstValue = runningHoursValues[0];
    const lastValue = runningHoursValues[runningHoursValues.length - 1];
    const totalHoursDecimal = Math.max(0, lastValue - firstValue);

    // console.log(
    //   `Running hours calculation: FIRST=${firstValue}, LAST=${lastValue}, DIFF=${totalHoursDecimal}`,
    // );

    return this.convertToHoursMinutes(totalHoursDecimal);
  }

  private calculateRunningHours(data: any[]): number {
    if (data.length === 0) return 0;

    // console.log('=== DEBUG: Running Hours Calculation ===');

    const runningHoursField = 'Engine_Running_Time_calculated';

    // Check if field exists
    if (!(runningHoursField in data[0])) {
      // console.log(`❌ ${runningHoursField} not found in data`);
      return 0;
    }

    const runningHoursValues = data
      .map((d) => d[runningHoursField])
      .filter(
        (val) => val !== undefined && val !== null && !isNaN(val) && val >= 0,
      );

    // console.log(`Valid ${runningHoursField} values:`, runningHoursValues);

    if (runningHoursValues.length >= 2) {
      const maxRunningHours = Math.max(...runningHoursValues);
      const minRunningHours = Math.min(...runningHoursValues);
      const calculatedRunningHours = maxRunningHours - minRunningHours;

      // console.log(
      //   `Running hours: MAX=${maxRunningHours}, MIN=${minRunningHours}, DIFF=${calculatedRunningHours}`,
      // );
      return +calculatedRunningHours.toFixed(2);
    }

    if (runningHoursValues.length === 1) {
      return +runningHoursValues[0].toFixed(2);
    }

    return 0;
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

  private logDataValidation(
    data: any[],
    mode: string,
    projection: Record<string, number>,
  ) {
    if (data.length === 0) {
      // console.log(`=== NO DATA for ${mode.toUpperCase()} MODE ===`);
      return;
    }

    // console.log(`=== DATA VALIDATION for ${mode.toUpperCase()} MODE ===`);
    // console.log(`Total records: ${data.length}`);

    // Check Engine_Running_Time_calculated values in detail
    const runningTimeValues = data
      .map((d) => d.Engine_Running_Time_calculated)
      .filter((val) => val !== undefined && val !== null);

    // console.log(`Engine_Running_Time_calculated field analysis:`);
    // console.log(`- Total records with field: ${runningTimeValues.length}`);
    // console.log(`- Sample values:`, runningTimeValues.slice(0, 5));

    const validRunningTimeValues = runningTimeValues.filter(
      (val) => !isNaN(val) && val >= 0,
    );

    // console.log(`- Valid values (>0): ${validRunningTimeValues.length}`);

    if (validRunningTimeValues.length > 0) {
      const minRunningTime = Math.min(...validRunningTimeValues);
      const maxRunningTime = Math.max(...validRunningTimeValues);
      const calculatedRunningHours = maxRunningTime - minRunningTime;

      // console.log(
      //   `Running hours calculation: MIN=${minRunningTime.toFixed(2)}, MAX=${maxRunningTime.toFixed(2)}, DIFF=${calculatedRunningHours.toFixed(2)}`,
      // );
    }

    // Check if Engine_Running_Time_calculated is in projection
    // console.log(
    //   `Projection includes Engine_Running_Time_calculated: ${'Engine_Running_Time_calculated' in projection}`,
    // );

    // Check first record for field completeness
    const firstRecord = data[0];
    // console.log('First record fields:', Object.keys(firstRecord));

    const projectedFields = Object.keys(projection).filter(
      (field) => field !== 'timestamp',
    );

    const missingFields = projectedFields.filter(
      (field) =>
        firstRecord[field] === undefined || firstRecord[field] === null,
    );

    // console.log(`Fields in projection: ${projectedFields.length}`);
    // console.log(`Missing fields in first record: ${missingFields.length}`);

    if (missingFields.length > 0) {
      // console.log('Missing fields:', missingFields);
    }

    // Rest of the validation code...
    // console.log('================================');
  }

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
      'fuelConsumed', // Keep fuel consumed
      'fuelConsumedCurrentRun', // Keep fuel consumed current run
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
      'runningHoursH',
      'runningHoursM',
      'totalHours',
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

    // console.log(
    //   'Cleaned metrics - removed zero values:',
    //   Object.keys(metrics).length - Object.keys(cleanedMetrics).length,
    //   'fields removed',
    // );

    return cleanedMetrics;
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
        voltageL1: doc.Genset_L1N_Voltage || 0,
        voltageL2: doc.Genset_L2N_Voltage || 0,
        voltageL3: doc.Genset_L3N_Voltage || 0,
        activePowerL1: doc.Genset_L1_kW || 0,
        activePowerL2: doc.Genset_L2_kW || 0,
        activePowerL3: doc.Genset_L3_kW || 0,
        CurrentImbalance: this.formulas.calculateCurrentImbalance(doc) || 0,
        voltageImbalance: this.formulas.calculateVoltageImbalance(doc) || 0,
        powerLossFactor: this.formulas.calculatePowerLossFactor(doc) || 0,
        // thermalStress: this.formulas.calculateThermalStress(doc) || 0,
      };
    } else {
      // Historic/Range mode - averages
      const metricsConfig = {
        voltageL1: (d: any) => d.Genset_L1N_Voltage || 0,
        voltageL2: (d: any) => d.Genset_L2N_Voltage || 0,
        voltageL3: (d: any) => d.Genset_L3N_Voltage || 0,
        activePowerL1: (d: any) => d.Genset_L1_kW || 0,
        activePowerL2: (d: any) => d.Genset_L2_kW || 0,
        activePowerL3: (d: any) => d.Genset_L3_kW || 0,
        // CurrentImbalance: (d: any) =>
        //   this.formulas.calculateCurrentImbalance(d) || 0,
        // voltageImbalance: (d: any) =>
        //   this.formulas.calculateVoltageImbalance(d) || 0,
        // powerLossFactor: (d: any) =>
        //   this.formulas.calculatePowerLossFactor(d) || 0,
        // thermalStress: (d: any) => this.formulas.calculateThermalStress(d) || 0,
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
        energyKWh: this.formulas.calculateEnergy(doc)[0]?.Energy_kWh ?? 0,
        fuelConsumptionCurrentRun: doc.Fuel_Consumption_Current_Run ?? 0,
      };
    } else {
      const metricsConfig = {
        totalFuelConsumption: (d: any) =>
          d.Total_Fuel_Consumption_calculated ?? 0,
        // ✅ FIX: Make this a function that takes a document parameter
        energyKWh: (d: any) =>
          this.formulas.calculateEnergy(d)[0]?.Energy_kWh ?? 0,
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

    // console.log('Original date string:', dateString);

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

    // console.log(
    //   `Converted (Asia/Karachi): ${date.toISOString()} -> ${localDate.toISOString()}`,
    // );
    return localDate;
  }

  /** -------------------
   * UPDATED: Aggregation Pipeline with Genset Filter for Range Mode
   * ------------------- */
  // private buildAggregationPipeline(
  //   mode: string,
  //   projection: Record<string, number>,
  //   start?: string,
  //   end?: string,
  // ): any[] {
  //   const pipeline: any[] = [];
  //   const matchStage: any = {};

  //   console.log('=== BUILDING PIPELINE ===');
  //   console.log('Mode:', mode);
  //   console.log('Original dates:', { start, end });

  //   if ((mode === 'historic' || mode === 'range') && start && end) {
  //     try {
  //       const startDate = this.validateAndFormatDate(start);
  //       const endDate = this.validateAndFormatDate(end);

  //       // ✅ Karachi offset (UTC+5)
  //       const karachiOffsetMs = 5 * 60 * 60 * 1000;

  //       // ✅ Convert local → UTC
  //       const startUTC = new Date(startDate.getTime() - karachiOffsetMs);
  //       const endUTC = new Date(endDate.getTime() - karachiOffsetMs);

  //       // ✅ Adjust hours
  //       if (startDate.toDateString() === endDate.toDateString()) {
  //         startUTC.setUTCHours(0, 0, 0, 0);
  //         endUTC.setUTCHours(23, 59, 59, 999);
  //       } else {
  //         endUTC.setUTCHours(23, 59, 59, 999);
  //       }

  //       // ✅ Hybrid filter for string or Date timestamps
  //       matchStage.$expr = {
  //         $and: [
  //           {
  //             $gte: [
  //               {
  //                 $cond: {
  //                   if: { $eq: [{ $type: '$timestamp' }, 'string'] },
  //                   then: { $dateFromString: { dateString: '$timestamp' } },
  //                   else: '$timestamp',
  //                 },
  //               },
  //               startUTC,
  //             ],
  //           },
  //           {
  //             $lte: [
  //               {
  //                 $cond: {
  //                   if: { $eq: [{ $type: '$timestamp' }, 'string'] },
  //                   then: { $dateFromString: { dateString: '$timestamp' } },
  //                   else: '$timestamp',
  //                 },
  //               },
  //               endUTC,
  //             ],
  //           },
  //         ],
  //       };

  //       // 🔥 CRITICAL: Only apply Genset_Run_SS filter for RANGE mode
  //       if (mode === 'range') {
  //         matchStage.Genset_Run_SS = { $gte: 1 };
  //       }

  //       console.log(`${mode} mode - Final UTC range:`, {
  //         startUTC: startUTC.toISOString(),
  //         endUTC: endUTC.toISOString(),
  //         gensetFilter: mode === 'range' ? '1-6' : 'none',
  //       });
  //     } catch (error) {
  //       console.error('Date validation error:', error.message);
  //       throw error;
  //     }
  //   } else if (mode === 'live') {
  //     const sixHoursAgo = new Date();
  //     sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

  //     // ✅ Handle hybrid type for "live" mode as well
  //     matchStage.$expr = {
  //       $gte: [
  //         {
  //           $cond: {
  //             if: { $eq: [{ $type: '$timestamp' }, 'string'] },
  //             then: { $dateFromString: { dateString: '$timestamp' } },
  //             else: '$timestamp',
  //           },
  //         },
  //         sixHoursAgo,
  //       ],
  //     };

  //     console.log('Live mode - Last 6 hours');
  //   }

  //   if (Object.keys(matchStage).length > 0) {
  //     pipeline.push({ $match: matchStage });
  //     console.log('Final match stage:', JSON.stringify(matchStage, null, 2));
  //   }

  //   pipeline.push({ $project: projection });
  //   pipeline.push({ $sort: { timestamp: 1 } });

  //   return pipeline;
  // }

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
    console.log('Received dates:', { start, end });

    if ((mode === 'historic' || mode === 'range') && start && end) {
      let startISO = start;
      let endISO = end;

      // Agar sirf date hai (2025-11-18) to +05:00 add kar do
      if (!start.includes('T')) {
        startISO = `${start}T00:00:00+05:00`;
        endISO = `${end}T23:59:59.999+05:00`;
      }

      // Agar end time 00:00:00 hai to 23:59:59 bana do
      if (endISO.includes('T00:00:00') && !endISO.includes('23:59')) {
        const datePart = endISO.split('T')[0];
        endISO = `${datePart}T23:59:59.999+05:00`;
      }

      matchStage.timestamp = {
        $gte: startISO,
        $lte: endISO,
      };

      if (mode === 'range') {
        matchStage.Genset_Run_SS = { $gte: 1 };
      }

      console.log('Final +05:00 Range (Direct String Compare):');
      console.log('  $gte →', startISO);
      console.log('  $lte →', endISO);
    } else if (mode === 'live') {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      matchStage.timestamp = { $gte: sixHoursAgo.toISOString() };
      console.log('Live mode → Last 6 hours (UTC OK)');
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({ $project: projection });
    pipeline.push({ $sort: { timestamp: 1 } });

    console.log('Pipeline built successfully with +05:00 direct comparison');
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
      'Engine_Running_Time_calculated',
      'Battery_Voltage_calculated',
      'Genset_Total_Power_Factor_calculated',
      'Genset_Run_SS',

      // ADD THESE for Dashboard2 charts compatibility
      'Genset_Total_KVA',
      'Genset_Application_kVA_Rating_PC2X',
      'Genset_Total_kVA', // Dono versions include karein
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
    // fuelConsumed: (doc: any) => doc.Total_Fuel_Consumption_calculated || 0,
    batteryVoltage: (doc: any) => doc.Battery_Voltage_calculated || 0,
    powerFactor: (doc: any) => doc.Genset_Total_Power_Factor_calculated || 0,
    // runninghours: (doc: any) => doc.Engine_Running_Time_calculated || 0,
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
      'Genset_Total_kW',
      'Genset_Application_kW_Rating_PC2X',
    ],
    voltageQualitySymmetry: [
      'Genset_L1L2_Voltage',
      'Genset_L2L3_Voltage',
      'Genset_L3L1_Voltage',
      'Genset_LL_Avg_Voltage',
      'Coolant_Temperature',
      'Genset_Total_kW',
      'Genset_Application_kW_Rating_PC2X',
    ],
    loadVsPowerFactor: [
      'Genset_Total_kW',
      'Genset_Application_kW_Rating_PC2X',
      'Genset_Total_Power_Factor_calculated',
    ],
    electroMechanicalStress: [
      'LoadPercent',
      'Genset_Total_Power_Factor_calculated',
      'Genset_Total_KVA',
      'Genset_Application_kVA_Rating_PC2X',
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
      LoadPercent: this.formulas.calculateLoadPercent?.(d) || 0,
    }));

    charts.voltageQualitySymmetry = data.map((d) => ({
      time: d.timestamp,
      Coolant_Temperature: d.Coolant_Temperature ?? null,
      Genset_L1L2_Voltage: d.Genset_L1L2_Voltage ?? null,
      Genset_L2L3_Voltage: d.Genset_L2L3_Voltage ?? null,
      Genset_L3L1_Voltage: d.Genset_L3L1_Voltage ?? null,
      voltageImbalance: this.formulas.calculateVoltageImbalance(d) || 0,
      // load_Percent: this.formulas.calculateLoadPercent(d) || 0,
      Genset_LL_Avg_Voltage: this.formulas.calculateAvgLLVoltage(d) || 0,
      Coolant_TemperatureC: this.formulas.convertCoolantToCelsius(d) ?? null,
    }));
    charts.voltageQuality = data.map((d) => ({
      time: d.timestamp,
      Coolant_Temperature: d.Coolant_Temperature ?? null,
      Coolant_TemperatureC: this.formulas.convertCoolantToCelsius(d) ?? null,
      // Genset_L1L2_Voltage: d.Genset_L1L2_Voltage ?? null,
      // Genset_L2L3_Voltage: d.Genset_L2L3_Voltage ?? null,
      // Genset_L3L1_Voltage: d.Genset_L3L1_Voltage ?? null,
      // voltageImbalance: this.formulas.calculateVoltageImbalance(d) || 0,
      load_Percent: this.formulas.calculateLoadPercent(d) || 0,
      // Genset_LL_Avg_Voltage: this.formulas.calculateAvgLLVoltage(d) || 0,
    }));

    charts.loadVsPowerFactor = data.map((d) => ({
      time: d.timestamp,
      LoadPercent: this.formulas.calculateLoadPercent?.(d) || 0,
      Genset_Total_Power_Factor_calculated:
        d.Genset_Total_Power_Factor_calculated ?? null,
    }));
    charts.coc = data.map((d) => ({
      time: d.timestamp,
      Oil_TemperatureC: this.formulas.convertOilTempToCelsius?.(d) || 0,
      Coolant_TemperatureC: this.formulas.convertCoolantToCelsius?.(d) || 0,
    }));

    charts.electroMechanicalStress = data.map((d) => {
      // 🔥 NEW: Debug each document
      const loadStress = this.formulas.calculateLoadStress(d);
      // console.log('Load Stress Calculation:', {
      //   hasKVA: !!(d.Genset_Total_KVA || d.Genset_Total_kVA),
      //   hasRating: !!d.Genset_Application_kVA_Rating_PC2X,
      //   hasPF: !!d.Genset_Total_Power_Factor_calculated,
      //   result: loadStress,
      // });

      return {
        time: d.timestamp,
        LoadStress: loadStress || 0,
        electricStress: this.formulas.calculateElectricalStress(d) || 0,
      };
    });

    charts.lossesThermalStress = data.map((d) => ({
      time: d.timestamp,
      PowerLossFactor: this.formulas.calculatePowerLossFactor(d) || 0,
      I2: this.formulas.calculateThermalStress(d) || 0,
    }));

    charts.frequencyRegulationEffectiveness = data.map((d) => ({
      time: d.timestamp,
      Genset_Frequency_OP_calculated: d.Genset_Frequency_OP_calculated ?? null,
      Frequency_Deviation_Rad: d.Averagr_Engine_Speed ?? null,
    }));

    return charts;
  }

  private mapChartsDashboard3(data: any[]): Record<string, any[]> {
    const charts: Record<string, any[]> = {};

    charts.intakeBoost = data.map((d) => ({
      time: d.timestamp,
      Intake_Manifold3_Temperature:
        d.Intake_Manifold_Temperature_calculated ?? null,
      Intake_Manifold3_TemperatureC:
        this.formulas.convertIntakeToCelsius(d) ?? null,
      Boost_Pressure: d.Boost_Pressure ?? null,
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
      Oil_TemperatureC: this.formulas.convertOilTempToCelsius(d) ?? null,
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
      Percent_Engine: d.Percent_Engine_Torque_or_Duty_Cycle ?? null,
    }));

    charts.heatRate = data.map((d) => ({
      time: d.timestamp,
      HeatRate: this.formulas.calculateHeatRate(d) || 0,
      thermalEfficiency: this.formulas.calculateThermalEfficiency(d) || 0,
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
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? null,
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
    charts.loadImpact = data.map((d) => ({
      time: d.timestamp,
      load_Percent: this.formulas.calculateLoadPercent(d) || 0,
      Average_Engine_Speed: d.Averagr_Engine_Speed ?? null,
    }));

    charts.averageEngineSpeed = data.map((d) => ({
      time: d.timestamp,
      Averagr_Engine_Speed: d.Averagr_Engine_Speed ?? null,
    }));

    charts.loadPercent = data.map((d) => ({
      time: d.timestamp,
      load_Percent: this.formulas.calculateLoadPercent(d) || 0,
      PowerFactor: d.Genset_Total_Power_Factor_calculated ?? null,
    }));

    charts.mechanicalStress = data.map((d) => ({
      time: d.timestamp,
      Mechanical_Stress: this.formulas.calculateMechanicalStress(d) || 0,
      Electrical_Stress: this.formulas.calculateElectricalStress(d) || 0,
    }));

    charts.gensetPowerFactor = data.map((d) => ({
      time: d.timestamp,
      Genset_Total_kW: d.Genset_Total_kW ?? null,
      Fuel_Efficiency_Index: this.formulas.calculateFuelEfficiencyIndex(d) || 0,
    }));

    // Use FormulasService for complex calculations
    charts.rpmStabilityIndex =
      this.formulas.calculateRPMStabilityWithLoad(data);
    charts.oscillationIndex = this.formulas.calculateOscillationIndex(data);
    // charts.fuelConsumption = this.formulas.calculateFuelConsumption(data);
    // charts.fuelConsumption = this.formulas.calculateFuelConsumption(data);

    charts.fuelConsumption = data.map((d) => ({
      time: d.timestamp,
      Fuel_Rate: d.Fuel_Rate ?? null,
      Load_Percent: this.formulas.calculateLoadPercent(d) || 0,
    }));

    return charts;
  }

  /** -------------------
   * NEW: Separate API for Total Consumption, Current Run, and Energy Calculations
   * ------------------- */
  async getConsumptionMetrics(
    mode: 'live' | 'historic' | 'range',
    start?: string,
    end?: string,
  ): Promise<{
    totalConsumption: number;
    totalConsumptionCurrentRun: number;
    energy: number;
    powerFactorStats: { max: number; min: number };
  }> {
    const cacheKey = `consumption_${mode}_${start}_${end}`;

    // ⚡ Cache check
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Define projection fields
    const projection = this.getProjectionFields([
      'Genset_Total_Power_Factor_calculated',
      'Total_Fuel_Consumption_calculated',
      'Genset_Total_kW',
      'timestamp',
    ]);

    const pipeline = this.buildAggregationPipeline(
      mode,
      projection,
      start,
      end,
    );
    const data = await this.collection.aggregate(pipeline).toArray();

    if (!data.length) {
      const result = {
        totalConsumption: 0,
        totalConsumptionCurrentRun: 0,
        energy: 0,
        powerFactorStats: { max: 0, min: 0 },
      };
      this.setCache(cacheKey, result);
      return result;
    }

    // Sort data by timestamp
    const sortedData = data.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // ✅ CHANGED: Pass start and end parameters
    const metrics = this.calculateConsumptionMetrics(
      sortedData,
      mode,
      start,
      end,
    );

    this.setCache(cacheKey, metrics);
    return metrics;
  }

  // private calculateConsumptionMetrics(
  //   data: any[],
  //   mode: string,
  //   start?: string,
  //   end?: string,
  // ): {
  //   totalConsumption: number;
  //   totalConsumptionCurrentRun: number;
  //   energy: number;
  //   powerFactorStats: { max: number; min: number };
  // } {
  //   if (data.length === 0) {
  //     return {
  //       totalConsumption: 0,
  //       totalConsumptionCurrentRun: 0,
  //       energy: 0,
  //       powerFactorStats: { max: 0, min: 0 },
  //     };
  //   }

  //   // 1. Calculate Power Factor Stats
  //   const powerFactorValues = data
  //     .map((d) => d.Genset_Total_Power_Factor_calculated)
  //     .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //   const powerFactorStats = {
  //     max: powerFactorValues.length > 0 ? Math.max(...powerFactorValues) : 0,
  //     min: powerFactorValues.length > 0 ? Math.min(...powerFactorValues) : 0,
  //   };

  //   // 2. Calculate Total Consumption (MAX - MIN of Total_Fuel_Consumption_calculated)
  //   const totalConsumptionValues = data
  //     .map((d) => d.Total_Fuel_Consumption_calculated)
  //     .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //   let totalConsumption = 0;
  //   if (totalConsumptionValues.length >= 2) {
  //     const maxValue = Math.max(...totalConsumptionValues);
  //     const minValue = Math.min(...totalConsumptionValues);
  //     totalConsumption = Math.max(0, maxValue - minValue);
  //   } else if (totalConsumptionValues.length === 1) {
  //     totalConsumption = totalConsumptionValues[0];
  //   }

  //   // 3. Calculate Total Consumption Current Run
  //   let totalConsumptionCurrentRun = 0;

  //   // console.log('=== DEBUG CURRENT RUN CALCULATION ===');
  //   // console.log(`Mode: ${mode}, End date provided: ${!!end}`);

  //   if (mode === 'range' && end) {
  //     // Filter data for only END DATE
  //     const endDateData = this.filterDataForEndDateOnly(data, end);

  //     // console.log(`End date data filtered: ${endDateData.length} records`);

  //     if (endDateData.length > 0) {
  //       console.log('End date data sample timestamps:');
  //       endDateData.slice(0, 3).forEach((d, i) => {
  //         console.log(
  //           `  ${i + 1}. ${d.timestamp} - Fuel: ${d.Total_Fuel_Consumption_calculated}`,
  //         );
  //       });

  //       const currentRunValues = endDateData
  //         .map((d) => d.Total_Fuel_Consumption_calculated)
  //         .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //       // console.log(
  //       //   `Valid fuel values in end date: ${currentRunValues.length}`,
  //       // );

  //       if (currentRunValues.length >= 2) {
  //         const firstValue = currentRunValues[0];
  //         const lastValue = currentRunValues[currentRunValues.length - 1];
  //         totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
  //         // console.log(
  //         //   `Current Run Calculation: LAST=${lastValue}, FIRST=${firstValue}, DIFF=${totalConsumptionCurrentRun}`,
  //         // );
  //       } else if (currentRunValues.length === 1) {
  //         totalConsumptionCurrentRun = currentRunValues[0];
  //         // console.log(
  //         //   `Current Run Single Value: ${totalConsumptionCurrentRun}`,
  //         // );
  //       } else {
  //         console.log('No valid fuel values found in end date data');
  //       }
  //     } else {
  //       console.log('No end date data found after filtering');
  //     }
  //   } else {
  //     // For live/historic mode, use normal calculation
  //     const currentRunValues = data
  //       .map((d) => d.Total_Fuel_Consumption_calculated)
  //       .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //     if (currentRunValues.length >= 2) {
  //       const firstValue = currentRunValues[0];
  //       const lastValue = currentRunValues[currentRunValues.length - 1];
  //       totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
  //     } else if (currentRunValues.length === 1) {
  //       totalConsumptionCurrentRun = currentRunValues[0];
  //     }
  //   }

  //   // ✅ Convert gallons to liters
  //   const totalConsumptionLiters = totalConsumption * 3.7854;
  //   const totalConsumptionCurrentRunLiters =
  //     totalConsumptionCurrentRun * 3.7854;

  //   // 4. Calculate Energy
  //   const energyData = this.formulas.calculateEnergy(data);
  //   let energy = 0;

  //   if (energyData.length > 0) {
  //     const lastEnergyRecord = energyData[energyData.length - 1];
  //     energy = lastEnergyRecord.Cumulative_Energy_kWh || 0;
  //   }

  //   // console.log('=== FINAL CONSUMPTION METRICS ===');
  //   // console.log(
  //   //   `Total Consumption: ${totalConsumptionLiters.toFixed(2)} liters`,
  //   // );
  //   // console.log(
  //   //   `Current Run Consumption: ${totalConsumptionCurrentRunLiters.toFixed(2)} liters`,
  //   // );
  //   // console.log(`Energy: ${energy}`);

  //   return {
  //     totalConsumption: +totalConsumptionLiters.toFixed(2),
  //     totalConsumptionCurrentRun: +totalConsumptionCurrentRunLiters.toFixed(2),
  //     energy: +energy.toFixed(2),
  //     powerFactorStats: {
  //       max: +powerFactorStats.max.toFixed(4),
  //       min: +powerFactorStats.min.toFixed(4),
  //     },
  //   };
  // }

  // private calculateConsumptionMetrics(
  //   data: any[],
  //   mode: string,
  //   start?: string,
  //   end?: string,
  // ): {
  //   totalConsumption: number;
  //   totalConsumptionCurrentRun: number;
  //   energy: number;
  //   powerFactorStats: { max: number; min: number };
  // } {
  //   if (data.length === 0) {
  //     return {
  //       totalConsumption: 0,
  //       totalConsumptionCurrentRun: 0,
  //       energy: 0,
  //       powerFactorStats: { max: 0, min: 0 },
  //     };
  //   }

  //   // 1. Calculate Power Factor Stats
  //   const powerFactorValues = data
  //     .map((d) => d.Genset_Total_Power_Factor_calculated)
  //     .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //   const powerFactorStats = {
  //     max: powerFactorValues.length > 0 ? Math.max(...powerFactorValues) : 0,
  //     min: powerFactorValues.length > 0 ? Math.min(...powerFactorValues) : 0,
  //   };

  //   // 2. Calculate Total Consumption (ENTIRE DATE RANGE: start date first - end date last)
  //   let totalConsumption = 0;

  //   console.log('=== TOTAL CONSUMPTION CALCULATION (ENTIRE RANGE) ===');

  //   if (mode === 'range' && start && end) {
  //     // For range mode: Use entire date range (start date first record - end date last record)
  //     const startDateData = this.filterDataForStartDateOnly(data, start);
  //     const endDateData = this.filterDataForEndDateOnly(data, end);

  //     console.log(
  //       `Start date records: ${startDateData.length}, End date records: ${endDateData.length}`,
  //     );

  //     if (startDateData.length > 0 && endDateData.length > 0) {
  //       const firstValue = startDateData[0].Total_Fuel_Consumption_calculated;
  //       const lastValue =
  //         endDateData[endDateData.length - 1].Total_Fuel_Consumption_calculated;

  //       console.log(
  //         `TOTAL: FIRST (${start}) = ${firstValue}, LAST (${end}) = ${lastValue}`,
  //       );

  //       if (
  //         firstValue !== undefined &&
  //         lastValue !== undefined &&
  //         !isNaN(firstValue) &&
  //         !isNaN(lastValue)
  //       ) {
  //         totalConsumption = Math.max(0, lastValue - firstValue);
  //         console.log(
  //           `TOTAL CONSUMPTION: ${lastValue} - ${firstValue} = ${totalConsumption}`,
  //         );
  //       }
  //     } else {
  //       // Fallback: Use MAX - MIN if date filtering fails
  //       const totalConsumptionValues = data
  //         .map((d) => d.Total_Fuel_Consumption_calculated)
  //         .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //       if (totalConsumptionValues.length >= 2) {
  //         const maxValue = Math.max(...totalConsumptionValues);
  //         const minValue = Math.min(...totalConsumptionValues);
  //         totalConsumption = Math.max(0, maxValue - minValue);
  //         console.log(
  //           `TOTAL CONSUMPTION (FALLBACK MAX-MIN): ${maxValue} - ${minValue} = ${totalConsumption}`,
  //         );
  //       } else if (totalConsumptionValues.length === 1) {
  //         totalConsumption = totalConsumptionValues[0];
  //         console.log(
  //           `TOTAL CONSUMPTION (FALLBACK SINGLE): ${totalConsumption}`,
  //         );
  //       }
  //     }
  //   } else {
  //     // For live/historic mode: Use MAX - MIN of entire dataset
  //     const totalConsumptionValues = data
  //       .map((d) => d.Total_Fuel_Consumption_calculated)
  //       .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //     if (totalConsumptionValues.length >= 2) {
  //       const maxValue = Math.max(...totalConsumptionValues);
  //       const minValue = Math.min(...totalConsumptionValues);
  //       totalConsumption = Math.max(0, maxValue - minValue);
  //       console.log(
  //         `TOTAL CONSUMPTION (MAX-MIN): ${maxValue} - ${minValue} = ${totalConsumption}`,
  //       );
  //     } else if (totalConsumptionValues.length === 1) {
  //       totalConsumption = totalConsumptionValues[0];
  //       console.log(`TOTAL CONSUMPTION (SINGLE): ${totalConsumption}`);
  //     }
  //   }

  //   // 3. Calculate Total Consumption Current Run (END DATE ONLY: end date first - end date last)
  //   let totalConsumptionCurrentRun = 0;

  //   console.log('=== CURRENT RUN CONSUMPTION CALCULATION (END DATE ONLY) ===');

  //   if (mode === 'range' && end) {
  //     // Filter data for only END DATE
  //     const endDateData = this.filterDataForEndDateOnly(data, end);

  //     console.log(`End date data filtered: ${endDateData.length} records`);

  //     if (endDateData.length > 0) {
  //       console.log('End date data sample:');
  //       endDateData.slice(0, 3).forEach((d, i) => {
  //         console.log(
  //           `  ${i + 1}. ${d.timestamp} - Fuel: ${d.Total_Fuel_Consumption_calculated}`,
  //         );
  //       });

  //       // ✅ FIX: Only use end date data for current run calculation
  //       if (endDateData.length >= 2) {
  //         const firstValue = endDateData[0].Total_Fuel_Consumption_calculated;
  //         const lastValue =
  //           endDateData[endDateData.length - 1]
  //             .Total_Fuel_Consumption_calculated;

  //         console.log(
  //           `CURRENT RUN: FIRST in end date = ${firstValue}, LAST in end date = ${lastValue}`,
  //         );

  //         if (
  //           firstValue !== undefined &&
  //           lastValue !== undefined &&
  //           !isNaN(firstValue) &&
  //           !isNaN(lastValue)
  //         ) {
  //           totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
  //           console.log(
  //             `CURRENT RUN CALCULATION: ${lastValue} - ${firstValue} = ${totalConsumptionCurrentRun}`,
  //           );
  //         }
  //       } else if (endDateData.length === 1) {
  //         totalConsumptionCurrentRun =
  //           endDateData[0].Total_Fuel_Consumption_calculated || 0;
  //         console.log(
  //           `CURRENT RUN (SINGLE RECORD): ${totalConsumptionCurrentRun}`,
  //         );
  //       }
  //     } else {
  //       console.log('No end date data found after filtering');
  //     }
  //   } else {
  //     // For live/historic mode: Use normal calculation (last - first of entire dataset)
  //     const currentRunValues = data
  //       .map((d) => d.Total_Fuel_Consumption_calculated)
  //       .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //     if (currentRunValues.length >= 2) {
  //       const firstValue = currentRunValues[0];
  //       const lastValue = currentRunValues[currentRunValues.length - 1];
  //       totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
  //       console.log(
  //         `CURRENT RUN (ENTIRE DATASET): LAST=${lastValue}, FIRST=${firstValue}, DIFF=${totalConsumptionCurrentRun}`,
  //       );
  //     } else if (currentRunValues.length === 1) {
  //       totalConsumptionCurrentRun = currentRunValues[0];
  //       console.log(`CURRENT RUN (SINGLE): ${totalConsumptionCurrentRun}`);
  //     }
  //   }

  //   // ✅ Convert gallons to liters
  //   const totalConsumptionLiters = totalConsumption * 3.7854;
  //   const totalConsumptionCurrentRunLiters =
  //     totalConsumptionCurrentRun * 3.7854;

  //   // 4. Calculate Energy
  //   const energyData = this.formulas.calculateEnergy(data);
  //   let energy = 0;

  //   if (energyData.length > 0) {
  //     const lastEnergyRecord = energyData[energyData.length - 1];
  //     energy = lastEnergyRecord.Cumulative_Energy_kWh || 0;
  //   }

  //   console.log('=== FINAL CONSUMPTION METRICS ===');
  //   console.log(
  //     `Total Consumption: ${totalConsumption} gallons = ${totalConsumptionLiters.toFixed(2)} liters`,
  //   );
  //   console.log(
  //     `Current Run Consumption: ${totalConsumptionCurrentRun} gallons = ${totalConsumptionCurrentRunLiters.toFixed(2)} liters`,
  //   );
  //   console.log(`Energy: ${energy} kWh`);

  //   return {
  //     totalConsumption: +totalConsumptionLiters.toFixed(2),
  //     totalConsumptionCurrentRun: +totalConsumptionCurrentRunLiters.toFixed(2),
  //     energy: +energy.toFixed(2),
  //     powerFactorStats: {
  //       max: +powerFactorStats.max.toFixed(4),
  //       min: +powerFactorStats.min.toFixed(4),
  //     },
  //   };
  // }

  // private calculateConsumptionMetrics(
  //   data: any[],
  //   mode: string,
  //   start?: string,
  //   end?: string,
  // ): {
  //   totalConsumption: number;
  //   totalConsumptionCurrentRun: number;
  //   energy: number;
  //   powerFactorStats: { max: number; min: number };
  // } {
  //   if (data.length === 0) {
  //     return {
  //       totalConsumption: 0,
  //       totalConsumptionCurrentRun: 0,
  //       energy: 0,
  //       powerFactorStats: { max: 0, min: 0 },
  //     };
  //   }

  //   // 1. Calculate Power Factor Stats
  //   const powerFactorValues = data
  //     .map((d) => d.Genset_Total_Power_Factor_calculated)
  //     .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //   const powerFactorStats = {
  //     max: powerFactorValues.length > 0 ? Math.max(...powerFactorValues) : 0,
  //     min: powerFactorValues.length > 0 ? Math.min(...powerFactorValues) : 0,
  //   };

  //   // 2. Calculate Total Consumption (MAX - MIN of Total_Fuel_Consumption_calculated)
  //   const totalConsumptionValues = data
  //     .map((d) => d.Total_Fuel_Consumption_calculated)
  //     .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //   let totalConsumption = 0;
  //   if (totalConsumptionValues.length >= 2) {
  //     const maxValue = Math.max(...totalConsumptionValues);
  //     const minValue = Math.min(...totalConsumptionValues);
  //     totalConsumption = Math.max(0, maxValue - minValue);
  //   } else if (totalConsumptionValues.length === 1) {
  //     totalConsumption = totalConsumptionValues[0];
  //   }

  //   // 3. Calculate Total Consumption Current Run
  //   let totalConsumptionCurrentRun = 0;

  //   console.log('=== DEBUG CURRENT RUN CALCULATION ===');
  //   console.log(`Mode: ${mode}, End date provided: ${!!end}`);

  //   if (mode === 'range' && end) {
  //     // Filter data for only END DATE
  //     const endDateData = this.filterDataForEndDateOnly(data, end);

  //     console.log(`End date data filtered: ${endDateData.length} records`);

  //     if (endDateData.length > 0) {
  //       console.log('End date data sample timestamps:');
  //       endDateData.slice(0, 3).forEach((d, i) => {
  //         console.log(
  //           `  ${i + 1}. ${d.timestamp} - Fuel: ${d.Total_Fuel_Consumption_calculated}`,
  //         );
  //       });

  //       const currentRunValues = endDateData
  //         .map((d) => d.Total_Fuel_Consumption_calculated)
  //         .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //       console.log(
  //         `Valid fuel values in end date: ${currentRunValues.length}`,
  //       );

  //       if (currentRunValues.length >= 2) {
  //         const firstValue = currentRunValues[0];
  //         const lastValue = currentRunValues[currentRunValues.length - 1];
  //         totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
  //         console.log(
  //           `Current Run Calculation: LAST=${lastValue}, FIRST=${firstValue}, DIFF=${totalConsumptionCurrentRun}`,
  //         );
  //       } else if (currentRunValues.length === 1) {
  //         totalConsumptionCurrentRun = currentRunValues[0];
  //         console.log(
  //           `Current Run Single Value: ${totalConsumptionCurrentRun}`,
  //         );
  //       } else {
  //         console.log('No valid fuel values found in end date data');
  //       }
  //     } else {
  //       console.log('No end date data found after filtering');
  //     }
  //   } else {
  //     // For live/historic mode, use normal calculation
  //     const currentRunValues = data
  //       .map((d) => d.Total_Fuel_Consumption_calculated)
  //       .filter((val) => val !== undefined && val !== null && !isNaN(val));

  //     if (currentRunValues.length >= 2) {
  //       const firstValue = currentRunValues[0];
  //       const lastValue = currentRunValues[currentRunValues.length - 1];
  //       totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
  //     } else if (currentRunValues.length === 1) {
  //       totalConsumptionCurrentRun = currentRunValues[0];
  //     }
  //   }

  //   // ✅ Convert gallons to liters
  //   const totalConsumptionLiters = totalConsumption * 3.7854;
  //   const totalConsumptionCurrentRunLiters =
  //     totalConsumptionCurrentRun * 3.7854;

  //   // 4. Calculate Energy
  //   const energyData = this.formulas.calculateEnergy(data);
  //   let energy = 0;

  //   if (energyData.length > 0) {
  //     const lastEnergyRecord = energyData[energyData.length - 1];
  //     energy = lastEnergyRecord.Cumulative_Energy_kWh || 0;
  //   }

  //   console.log('=== FINAL CONSUMPTION METRICS ===');
  //   console.log(
  //     `Total Consumption: ${totalConsumptionLiters.toFixed(2)} liters`,
  //   );
  //   console.log(
  //     `Current Run Consumption: ${totalConsumptionCurrentRunLiters.toFixed(2)} liters`,
  //   );
  //   console.log(`Energy: ${energy}`);

  //   return {
  //     totalConsumption: +totalConsumptionLiters.toFixed(2),
  //     totalConsumptionCurrentRun: +totalConsumptionCurrentRunLiters.toFixed(2),
  //     energy: +energy.toFixed(2),
  //     powerFactorStats: {
  //       max: +powerFactorStats.max.toFixed(4),
  //       min: +powerFactorStats.min.toFixed(4),
  //     },
  //   };
  // }

  private calculateConsumptionMetrics(
    data: any[],
    mode: string,
    start?: string,
    end?: string,
  ): {
    totalConsumption: number;
    totalConsumptionCurrentRun: number;
    energy: number;
    powerFactorStats: { max: number; min: number };
  } {
    if (data.length === 0) {
      return {
        totalConsumption: 0,
        totalConsumptionCurrentRun: 0,
        energy: 0,
        powerFactorStats: { max: 0, min: 0 },
      };
    }

    // 1. Calculate Power Factor Stats
    const powerFactorValues = data
      .map((d) => d.Genset_Total_Power_Factor_calculated)
      .filter((val) => val !== undefined && val !== null && !isNaN(val));

    const powerFactorStats = {
      max: powerFactorValues.length > 0 ? Math.max(...powerFactorValues) : 0,
      min: powerFactorValues.length > 0 ? Math.min(...powerFactorValues) : 0,
    };

    // 2. Calculate Total Consumption (MAX - MIN of Total_Fuel_Consumption_calculated)
    const totalConsumptionValues = data
      .map((d) => d.Total_Fuel_Consumption_calculated)
      .filter((val) => val !== undefined && val !== null && !isNaN(val));

    let totalConsumption = 0;
    if (totalConsumptionValues.length >= 2) {
      const maxValue = Math.max(...totalConsumptionValues);
      const minValue = Math.min(...totalConsumptionValues);
      totalConsumption = Math.max(0, maxValue - minValue);
    } else if (totalConsumptionValues.length === 1) {
      totalConsumption = totalConsumptionValues[0];
    }

    // 3. Calculate Total Consumption Current Run
    let totalConsumptionCurrentRun = 0;

    console.log('=== DEBUG CURRENT RUN CALCULATION ===');
    console.log(`Mode: ${mode}, Start: ${start}, End: ${end}`);

    // ✅ CHANGED: Use range logic for BOTH range and historic modes
    if ((mode === 'range' || mode === 'historic') && end) {
      // Filter data for only END DATE
      const endDateData = this.filterDataForEndDateOnly(data, end);

      console.log(`End date data filtered: ${endDateData.length} records`);

      if (endDateData.length > 0) {
        console.log('End date data sample timestamps:');
        endDateData.slice(0, 3).forEach((d, i) => {
          console.log(
            `  ${i + 1}. ${d.timestamp} - Fuel: ${d.Total_Fuel_Consumption_calculated}`,
          );
        });

        const currentRunValues = endDateData
          .map((d) => d.Total_Fuel_Consumption_calculated)
          .filter((val) => val !== undefined && val !== null && !isNaN(val));

        console.log(
          `Valid fuel values in end date: ${currentRunValues.length}`,
        );

        if (currentRunValues.length >= 2) {
          const firstValue = currentRunValues[0];
          const lastValue = currentRunValues[currentRunValues.length - 1];
          totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
          console.log(
            `Current Run Calculation: LAST=${lastValue}, FIRST=${firstValue}, DIFF=${totalConsumptionCurrentRun}`,
          );
        } else if (currentRunValues.length === 1) {
          totalConsumptionCurrentRun = currentRunValues[0];
          console.log(
            `Current Run Single Value: ${totalConsumptionCurrentRun}`,
          );
        } else {
          console.log('No valid fuel values found in end date data');
        }
      } else {
        console.log('No end date data found after filtering');
      }
    } else {
      // For live mode only, use normal calculation
      const currentRunValues = data
        .map((d) => d.Total_Fuel_Consumption_calculated)
        .filter((val) => val !== undefined && val !== null && !isNaN(val));

      if (currentRunValues.length >= 2) {
        const firstValue = currentRunValues[0];
        const lastValue = currentRunValues[currentRunValues.length - 1];
        totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
      } else if (currentRunValues.length === 1) {
        totalConsumptionCurrentRun = currentRunValues[0];
      }
    }

    // ✅ Convert gallons to liters
    const totalConsumptionLiters = totalConsumption * 3.7854;
    const totalConsumptionCurrentRunLiters =
      totalConsumptionCurrentRun * 3.7854;

    // 4. Calculate Energy
    const energyData = this.formulas.calculateEnergy(data);
    let energy = 0;

    if (energyData.length > 0) {
      const lastEnergyRecord = energyData[energyData.length - 1];
      energy = lastEnergyRecord.Cumulative_Energy_kWh || 0;
    }

    console.log('=== FINAL CONSUMPTION METRICS ===');
    console.log(
      `Total Consumption: ${totalConsumptionLiters.toFixed(2)} liters`,
    );
    console.log(
      `Current Run Consumption: ${totalConsumptionCurrentRunLiters.toFixed(2)} liters`,
    );
    console.log(`Energy: ${energy}`);

    return {
      totalConsumption: +totalConsumptionLiters.toFixed(2),
      totalConsumptionCurrentRun: +totalConsumptionCurrentRunLiters.toFixed(2),
      energy: +energy.toFixed(2),
      powerFactorStats: {
        max: +powerFactorStats.max.toFixed(4),
        min: +powerFactorStats.min.toFixed(4),
      },
    };
  }

  /** -------------------
   * FIXED: Filter data for End Date only with string timestamp handling
   * ------------------- */
  // private filterDataForEndDateOnly(data: any[], endDate: string): any[] {
  //   try {
  //     console.log(`Filtering for end date: ${endDate}`);

  //     // Parse end date and set time range for Karachi timezone
  //     const end = new Date(endDate);
  //     const startOfEndDate = new Date(end);
  //     startOfEndDate.setHours(0, 0, 0, 0);

  //     const endOfEndDate = new Date(end);
  //     endOfEndDate.setHours(23, 59, 59, 999);

  //     console.log(
  //       `Local date range: ${startOfEndDate.toISOString()} to ${endOfEndDate.toISOString()}`,
  //     );

  //     const filteredData = data.filter((d) => {
  //       if (!d.timestamp) return false;

  //       // ✅ FIX: Handle string timestamp with timezone
  //       let recordDate;
  //       if (typeof d.timestamp === 'string') {
  //         // Parse string timestamp directly
  //         recordDate = new Date(d.timestamp);
  //       } else {
  //         recordDate = d.timestamp;
  //       }

  //       if (isNaN(recordDate.getTime())) {
  //         console.log(`Invalid timestamp: ${d.timestamp}`);
  //         return false;
  //       }

  //       // Compare dates (ignore time for date comparison)
  //       const recordDateOnly = new Date(recordDate);
  //       recordDateOnly.setHours(0, 0, 0, 0);

  //       const targetDateOnly = new Date(end);
  //       targetDateOnly.setHours(0, 0, 0, 0);

  //       return recordDateOnly.getTime() === targetDateOnly.getTime();
  //     });

  //     console.log(`Filtered ${filteredData.length} records for end date`);

  //     if (filteredData.length > 0) {
  //       console.log('First 3 filtered records:');
  //       filteredData.slice(0, 3).forEach((item, index) => {
  //         console.log(
  //           `  ${index + 1}. ${item.timestamp} - ${item.Total_Fuel_Consumption_calculated}`,
  //         );
  //       });
  //     } else {
  //       console.log('No records found for end date. All timestamps:');
  //       data.slice(0, 5).forEach((item, index) => {
  //         console.log(`  ${index + 1}. ${item.timestamp}`);
  //       });
  //     }

  //     return filteredData;
  //   } catch (error) {
  //     console.error('Error filtering end date data:', error);
  //     return [];
  //   }
  // }

  private filterDataForEndDateOnly(data: any[], endDate: string): any[] {
    try {
      console.log(`Filtering for end date (RAW): ${endDate}`);

      // ✅ Convert incoming date to pure UTC date string (YYYY-MM-DD)
      const targetUTCDate = new Date(endDate).toISOString().split('T')[0];

      console.log(`Target UTC date: ${targetUTCDate}`);

      const filteredData = data.filter((d) => {
        if (!d.timestamp) return false;

        // ✅ Safely parse timestamp (works with ISO strings + Date objects)
        const recordDate = new Date(d.timestamp);

        if (isNaN(recordDate.getTime())) {
          console.log(`Invalid timestamp: ${d.timestamp}`);
          return false;
        }

        // ✅ Convert record timestamp to UTC date string
        const recordUTCDate = recordDate.toISOString().split('T')[0];

        return recordUTCDate === targetUTCDate;
      });

      console.log(`Filtered ${filteredData.length} records for end UTC date`);

      if (filteredData.length > 0) {
        console.log('First 3 filtered records:');
        filteredData.slice(0, 3).forEach((item, index) => {
          console.log(
            `  ${index + 1}. ${item.timestamp} - ${item.Total_Fuel_Consumption_calculated}`,
          );
        });
      } else {
        console.log('No records found for end UTC date. Sample timestamps:');
        data.slice(0, 5).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.timestamp}`);
        });
      }

      return filteredData;
    } catch (error) {
      console.error('Error filtering end date data:', error);
      return [];
    }
  }
}
