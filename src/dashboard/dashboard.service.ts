/* eslint-disable @typescript-eslint/no-unsafe-call */
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
  private liveCollection; // ✅ ADD THIS LINE
  private cache = new Map();
  // private cache = new Map<string, { data: any; ts: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes (live ke liye best)
  // private readonly LIVE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes (live ke liye best)

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulas: FormulasService,
  ) {
    this.collection = this.db.collection('navy_12s');
    this.liveCollection = this.db.collection('navy_12_live'); // ADD THIS LINE
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
        'Genset_Frequency_OP_calculated',
        'Averagr_Engine_Speed',
        'Percent_Engine_Torque_or_Duty_Cycle',
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
        'Percent_Engine_Torque_or_Duty_Cycle',
        'Averagr_Engine_Speed',
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
        'Percent_Engine_Torque_or_Duty_Cycle',
        'Averagr_Engine_Speed',
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
        'Percent_Engine_Torque_calculated',
        'Averagr_Engine_Speed',
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

  private async getLatestGensetRunPeriod(): Promise<{
    firstDoc: any;
    lastDoc: any;
  } | null> {
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: this.getTodayStartTime() }, // Aaj se start
        },
      },
      { $sort: { timestamp: 1 } },
    ];

    const allDocs = await this.liveCollection.aggregate(pipeline).toArray();

    console.log(`\n📊 Total documents today: ${allDocs.length}`);

    const periods: Array<{ firstDoc: any; lastDoc: any }> = [];
    let currentPeriod: any[] = [];
    let wasGensetOn = false;

    for (const doc of allDocs) {
      const isGensetOn = doc.Genset_Run_SS >= 1;

      // ✅ Sirf status change se period break detect karo
      if (isGensetOn !== wasGensetOn) {
        // Period break detected
        if (currentPeriod.length > 0) {
          console.log(`\n🔴 Period Complete:`);
          console.log(`   First: ${currentPeriod[0].timestamp}`);
          console.log(
            `   Last:  ${currentPeriod[currentPeriod.length - 1].timestamp}`,
          );

          periods.push({
            firstDoc: currentPeriod[0],
            lastDoc: currentPeriod[currentPeriod.length - 1],
          });
        }

        // Naya period start karo agar genset ON hai
        if (isGensetOn) {
          console.log(`\n🟢 New Period Started: ${doc.timestamp}`);
          currentPeriod = [doc];
        } else {
          currentPeriod = [];
        }
      } else if (isGensetOn) {
        // Same period continue
        currentPeriod.push(doc);
      }

      wasGensetOn = isGensetOn;
    }

    // Last period add karo
    if (currentPeriod.length > 0) {
      console.log(`\n📌 Current Period (Ongoing):`);
      console.log(`   First: ${currentPeriod[0].timestamp}`);
      console.log(
        `   Last:  ${currentPeriod[currentPeriod.length - 1].timestamp}`,
      );

      periods.push({
        firstDoc: currentPeriod[0],
        lastDoc: currentPeriod[currentPeriod.length - 1],
      });
    }

    // ✅ Latest period return karo
    return periods.length > 0 ? periods[periods.length - 1] : null;
  }

  private getTodayStartTime(): string {
    const now = new Date();

    // Pakistan time (UTC+5) ke hisaab se aaj ki start time (00:00:00)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    // ISO format with +05:00 timezone
    return `${year}-${month}-${day}T00:00:00+05:00`;
  }

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

    // ✅ USE DIFFERENT COLLECTION BASED ON MODE
    let collectionToUse;
    if (mode === 'live') {
      collectionToUse = this.liveCollection;
    } else {
      collectionToUse = this.collection;
    }

    const data = await collectionToUse.aggregate(pipeline).toArray();

    console.log(
      `Fetched ${data.length} records from ${mode === 'live' ? 'live' : 'historical'} collection for mode: ${mode}`,
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

    // ✅ FIXED: Define ALL variables first
    let runningHoursDecimal;
    let runningHoursWithMinutes;
    let totalHoursDecimal; // ✅ ADD THIS
    let totalHoursFormatted; // ✅ ADD THIS

    if (mode === 'live') {
      runningHoursDecimal = latest.Engine_Running_Time_calculated || 0;
      totalHoursDecimal = latest.Engine_Running_Time_calculated || 0; // ✅ ADD
    } else {
      // For historic/range mode, calculate from data
      runningHoursDecimal = this.calculateRunningHours(formattedData);
      totalHoursDecimal = this.calculateTotalHours(formattedData); // ✅ ADD
    }

    // Convert to formatted hours
    runningHoursWithMinutes = this.convertToHoursMinutes(runningHoursDecimal);
    totalHoursFormatted = this.convertToHoursMinutes(totalHoursDecimal); // ✅ ADD

    console.log('📊 Hours Calculation:');
    console.log(
      `Running Hours: ${runningHoursDecimal} = ${runningHoursWithMinutes.totalHours}`,
    );
    console.log(
      `Total Hours (MAX): ${totalHoursDecimal} = ${totalHoursFormatted.totalHours}`,
    );

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
      console.log(
        `Historic/Range mode - Total Fuel Consumed: ${totalFuelConsumed.toFixed(2)} gallons = ${totalFuelConsumedLiters.toFixed(2)} liters`,
      );
    }

    // ✅ UPDATED: Fuel Consumed Current Run calculation - PASS END DATE
    let fuelConsumedCurrentRun;
    let fuelConsumedCurrentRunLiters;
    if (mode === 'live') {
      // fuelConsumedCurrentRun = latest.Total_Fuel_Consumption_calculated || 0;
      // fuelConsumedCurrentRunLiters = fuelConsumedCurrentRun * 3.7854;
      // console.log(
      //   `Live mode - Fuel Consumed Current Run from latest: ${fuelConsumedCurrentRun} gallons = ${fuelConsumedCurrentRunLiters} liters`,
      // );

      // // Pehla document fetch karo genset ON hone ke baad ka
      // const firstLiveDoc = await this.getFirstLiveDocumentSinceGensetOn();

      // // 2. Latest document latest variable mein already hai
      // if (firstLiveDoc && latest) {
      //   const firstFuel = firstLiveDoc.Total_Fuel_Consumption_calculated;
      //   const latestFuel = latest.Total_Fuel_Consumption_calculated;

      //   // ✅ DONO KE LIYE SAME FORMULA (latest - first)
      //   const fuelDifference = Math.max(0, latestFuel - firstFuel);

      //   fuelConsumedCurrentRun = fuelDifference;
      //   fuelConsumedCurrentRunLiters = fuelDifference * 3.7854;

      //   // ✅ fuelConsumed bhi same formula se
      //   totalFuelConsumed = fuelDifference;
      //   totalFuelConsumedLiters = fuelDifference * 3.7854;

      //   console.log(`Live Fuel Calculation:`);
      //   console.log(`- First document fuel: ${firstFuel} gallons`);
      //   console.log(`- Latest document fuel: ${latestFuel} gallons`);
      //   console.log(
      //     `- Difference: ${fuelDifference} gallons = ${fuelDifference * 3.7854} liters`,
      //   );
      //   console.log(`✅ fuelConsumed: ${totalFuelConsumedLiters} liters`);
      //   console.log(
      //     `✅ fuelConsumedCurrentRun: ${fuelConsumedCurrentRunLiters} liters`,
      //   );
      // }
      //
      // ✅ Sirf latest period ka first aur last document fetch karo
      const latestPeriod = await this.getLatestGensetRunPeriod();

      if (latestPeriod && latestPeriod.firstDoc && latestPeriod.lastDoc) {
        // Latest period ke first aur last fuel values
        const firstFuel =
          latestPeriod.firstDoc.Total_Fuel_Consumption_calculated || 0;
        const lastFuel =
          latestPeriod.lastDoc.Total_Fuel_Consumption_calculated || 0;

        // ✅ DONO KE LIYE SAME FORMULA (last - first of latest period)
        const fuelDifference = Math.max(0, lastFuel - firstFuel);

        fuelConsumedCurrentRun = fuelDifference;
        fuelConsumedCurrentRunLiters = fuelDifference * 3.7854;

        // ✅ fuelConsumed bhi same formula se (latest period ka)
        totalFuelConsumed = fuelDifference;
        totalFuelConsumedLiters = fuelDifference * 3.7854;

        console.log(`✅ Latest Period Fuel Calculation:`);
        console.log(`- Period first document fuel: ${firstFuel} gallons`);
        console.log(`- Period last document fuel: ${lastFuel} gallons`);
        console.log(
          `- Difference: ${fuelDifference} gallons = ${fuelDifference * 3.7854} liters`,
        );
      } else {
        // ❌ Koi period nahi mila
        console.log(`⚠️ No run period found`);
        fuelConsumedCurrentRun = 0;
        fuelConsumedCurrentRunLiters = 0;
        totalFuelConsumed = 0;
        totalFuelConsumedLiters = 0;
      }
    } else {
      // ✅ PASS END DATE TO CALCULATION
      fuelConsumedCurrentRun = this.calculateFuelConsumedCurrentRun(
        formattedData,
        end,
      );
      fuelConsumedCurrentRunLiters = fuelConsumedCurrentRun * 3.7854;

      console.log('=== FUEL CONSUMPTION SUMMARY ===');
      console.log(`📅 Date range: ${start} to ${end}`);
      console.log(
        `⛽ Total Fuel Consumed (MAX-MIN): ${totalFuelConsumed.toFixed(2)} gallons = ${totalFuelConsumedLiters.toFixed(2)} liters`,
      );
      console.log(
        `⛽ Fuel Consumed Current Run (END DATE): ${fuelConsumedCurrentRun.toFixed(2)} gallons = ${fuelConsumedCurrentRunLiters.toFixed(2)} liters`,
      );
    }

    // ✅ FIXED: Update metrics with BOTH running and total hours
    metrics = {
      ...metrics,
      // Running Hours (selected period)
      runningHours: +runningHoursDecimal.toFixed(2),
      runningHoursH: runningHoursWithMinutes.hours,
      runningHoursM: runningHoursWithMinutes.minutes,

      // Total Hours (lifetime MAX)
      totalHours: totalHoursFormatted.totalHours, // Formatted string "125:30"
      totalHoursDecimal: +totalHoursDecimal.toFixed(2), // Decimal 125.50

      // Fuel related
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
   * UPDATED: Fuel Consumed Current Run calculation - ONLY END DATE
   * ------------------- */
  private calculateFuelConsumedCurrentRun(
    data: any[],
    endDate?: string,
  ): number {
    console.log('=== CALCULATE FUEL CONSUMED CURRENT RUN ===');

    if (data.length === 0) return 0;

    const fuelField = 'Total_Fuel_Consumption_calculated';

    if (!(fuelField in data[0])) return 0;

    let fuelConsumedCurrentRun = 0;

    if (endDate) {
      console.log('🎯 MODE: Using END DATE ONLY calculation');

      // ✅ Extract day from endDate (e.g., "11" from 2025-11-11)
      const dayMatch = endDate.match(/-\d{2}T/);
      const targetDay = dayMatch ? dayMatch[0].replace(/-|T/g, '') : '11';

      console.log(`Looking for day: ${targetDay} in timestamps`);

      // ✅ Filter data for the target day (check formatted timestamp)
      const endDateData = data.filter((item) => {
        if (!item.timestamp) return false;
        const formattedTs = String(item.timestamp);
        // Check for day in formatted timestamp (e.g., "Nov 11" or ", 11,")
        return (
          formattedTs.includes(` ${targetDay},`) ||
          formattedTs.includes(` ${targetDay} `) ||
          formattedTs.includes(`, ${targetDay}:`)
        );
      });

      console.log(`📊 End date records found: ${endDateData.length}`);

      if (endDateData.length >= 2) {
        const firstValue = endDateData[0][fuelField];
        const lastValue = endDateData[endDateData.length - 1][fuelField];

        fuelConsumedCurrentRun = Math.max(0, lastValue - firstValue);
        console.log(
          `✅ END DATE Calculation: ${lastValue} - ${firstValue} = ${fuelConsumedCurrentRun}`,
        );
      } else if (endDateData.length === 1) {
        fuelConsumedCurrentRun = 0; // Can't calculate difference with one record
        console.log(`📌 Single record for end date`);
      } else {
        console.log('⚠️ No end date records found, returning 0');
        return 0;
      }
    } else {
      // Live mode - normal calculation
      const firstValue = data[0][fuelField];
      const lastValue = data[data.length - 1][fuelField];
      fuelConsumedCurrentRun = Math.max(0, lastValue - firstValue);
      console.log(
        `🔢 Normal Calculation: ${lastValue} - ${firstValue} = ${fuelConsumedCurrentRun}`,
      );
    }

    console.log(
      `🏁 FINAL Fuel Current Run: ${fuelConsumedCurrentRun.toFixed(2)} gallons`,
    );

    return +fuelConsumedCurrentRun.toFixed(2);
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

  // private calculateRunningHours(data: any[]): number {
  //   if (!data?.length) return 0;

  //   // Filter only entries where genset was ON
  //   const runData = data.filter((d) => d.Genset_Run_SS >= 1);
  //   if (!runData.length) return 0;

  //   // Sort by timestamp
  //   const sortedData = runData.sort(
  //     (a, b) =>
  //       new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  //   );

  //   const startTime = new Date(sortedData[0].timestamp).getTime();
  //   const endTime = new Date(
  //     sortedData[sortedData.length - 1].timestamp,
  //   ).getTime();

  //   // Calculate hours from timestamp difference (same as report)
  //   let runHours = (endTime - startTime) / (1000 * 60 * 60);

  //   // Agar single record hai to 0.25 hours (15 min) assume karein (report ke hisaab se)
  //   if (runHours === 0 && sortedData.length === 1) {
  //     runHours = 0.25;
  //   }

  //   return +runHours.toFixed(2);
  // }

  private calculateRunningHours(data: any[]): number {
    if (!data?.length) return 0;

    // Filter genset ON records
    const runData = data.filter((d) => d.Genset_Run_SS >= 1);
    if (!runData.length) return 0;

    // Group into periods (15 minute gap - same as report)
    const periods = this.groupIntoPeriods(runData, 15);

    // Calculate total hours from all periods (SAME AS REPORT)
    let totalHours = 0;

    periods.forEach((period) => {
      if (period.length === 0) return;

      const startTime = new Date(period[0].timestamp).getTime();
      const endTime = new Date(period[period.length - 1].timestamp).getTime();

      let periodHours = (endTime - startTime) / (1000 * 60 * 60);

      // Handle single record (15 min = 0.25 hours - SAME AS REPORT)
      if (periodHours === 0 && period.length === 1) {
        periodHours = 0.25;
      }

      totalHours += periodHours;
    });

    return +totalHours.toFixed(2);
  }

  private groupIntoPeriods(data: any[], gapMinutes: number = 15): any[] {
    if (!data.length) return [];

    // Sort by timestamp
    const sortedData = data.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const periods: any[] = [];
    let currentPeriod: any[] = [sortedData[0]];

    for (let i = 1; i < sortedData.length; i++) {
      const current = sortedData[i];
      const prev = sortedData[i - 1];

      const diffMinutes =
        (new Date(current.timestamp).getTime() -
          new Date(prev.timestamp).getTime()) /
        (1000 * 60);

      if (diffMinutes > gapMinutes) {
        // New period
        if (currentPeriod.length > 0) {
          periods.push(currentPeriod);
        }
        currentPeriod = [current];
      } else {
        // Same period
        currentPeriod.push(current);
      }
    }

    // Add last period
    if (currentPeriod.length > 0) {
      periods.push(currentPeriod);
    }

    return periods;
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

  // ✅ Total Hours (sirf MAX)
  private calculateTotalHours(data: any[]): number {
    const field = 'Engine_Running_Time_calculated';

    const values = data
      .map((d) => d[field])
      .filter(
        (val) => val !== undefined && val !== null && !isNaN(val) && val >= 0,
      );

    if (values.length > 0) {
      const maxValue = Math.max(...values); // ✅ Sirf MAX value
      console.log(
        `📊 Total Hours: MAX=${maxValue} (from ${values.length} values)`,
      );
      return +maxValue.toFixed(2);
    }

    return 0;
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
  // private calculateAverageMetrics(
  //   data: any[],
  //   metricsConfig: any,
  // ): Record<string, number> {
  //   const averages: Record<string, number> = {};

  //   for (const [key, calculator] of Object.entries(metricsConfig)) {
  //     // ✅ FIX: Type assertion for calculator function
  //     const calcFunc = calculator as (doc: any) => number;

  //     const values = data
  //       .map((doc) => calcFunc(doc))
  //       .filter((val) => val !== null && val !== undefined);

  //     if (values.length > 0) {
  //       const sum = values.reduce((acc, val) => acc + val, 0);
  //       averages[key] = +(sum / values.length).toFixed(2);
  //     } else {
  //       averages[key] = 0;
  //     }
  //   }

  //   return averages;
  // }

  private calculateAverageMetrics(
    data: any[],
    metricsConfig: any,
  ): Record<string, number> {
    const averages: Record<string, number> = {};

    console.log(`📊 Calculating averages from ${data.length} records`);

    for (const [key, calculator] of Object.entries(metricsConfig)) {
      const calcFunc = calculator as (doc: any) => number;

      // ✅ Collect ONLY valid numbers from ON records
      const validValues: number[] = [];

      data.forEach((doc, index) => {
        try {
          // ✅ Check if genset is ON for meaningful calculations
          const isGensetOn = doc.Genset_Run_SS >= 1;

          if (isGensetOn) {
            const value = calcFunc(doc);

            // ✅ STRICT validation: must be finite number
            if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
              validValues.push(value);
            }
          }
        } catch (error) {
          // Skip failed calculations
        }
      });

      // ✅ Calculate average ONLY with valid values
      if (validValues.length > 0) {
        const sum = validValues.reduce((a, b) => a + b, 0);
        averages[key] = +(sum / validValues.length).toFixed(2);
        console.log(
          `   ${key}: ${averages[key]} (from ${validValues.length} ON records)`,
        );
      } else {
        averages[key] = 0;
        console.log(`   ${key}: 0 (no valid ON records)`);
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

  // private mapMetricsDashboard6WithMode(doc: any, data: any[], mode: string) {
  //   if (mode === 'live') {
  //     return {
  //       totalFuelConsumption: doc.Total_Fuel_Consumption_calculated ?? 0,
  //       energyKWh: this.formulas.calculateEnergy(doc)[0]?.Energy_kWh ?? 0,
  //       fuelConsumptionCurrentRun: doc.Fuel_Consumption_Current_Run ?? 0,
  //     };
  //   } else {
  //     const metricsConfig = {
  //       totalFuelConsumption: (d: any) =>
  //         d.Total_Fuel_Consumption_calculated ?? 0,
  //       // ✅ FIX: Make this a function that takes a document parameter
  //       // energyKWh: (d: any) =>
  //       //   this.formulas.calculateEnergy(d)[0]?.Energy_kWh ?? 0,
  //       fuelConsumptionCurrentRun: (d: any) =>
  //         d.Fuel_Consumption_Current_Run ?? 0,
  //     };

  //     return this.calculateAverageMetrics(data, metricsConfig);
  //   }
  // }

  private mapMetricsDashboard6WithMode(
    doc: any,
    data: any[],
    mode: string,
  ): Record<string, any> {
    console.log('=== DASHBOARD 6 PRODUCTION CALCULATION ===');
    console.log('Total data points:', data.length);

    // ✅ SABHI DATA POINTS KA TOTAL PRODUCTION (Report wala formula)
    let totalProductionKWh = 0;
    let totalFuelConsumption = 0;
    let runningHours = 0;

    if (data.length > 0) {
      // 1. TOTAL PRODUCTION: Genset_Total_kW × 0.000833 × (sabhi data points)
      totalProductionKWh = data.reduce((sum, record) => {
        const kW = record.Genset_Total_kW || 0;
        const productionPerRecord = kW * 0.000833 * 4;
        return sum + productionPerRecord;
      }, 0);

      console.log('Production per record formula: kW × 0.000833');
      console.log('Example: 100 kW × 0.000833 = 0.0833 kWh per record');

      // 2. TOTAL FUEL CONSUMPTION (Report wala formula)
      const fuelValues = data
        .map((d) => d.Total_Fuel_Consumption_calculated)
        .filter((val) => val !== undefined && val !== null && !isNaN(val));

      if (fuelValues.length >= 2) {
        const maxFuel = Math.max(...fuelValues);
        const minFuel = Math.min(...fuelValues);
        totalFuelConsumption = maxFuel - minFuel;
      }

      // 3. RUNNING HOURS
      runningHours = this.calculateRunningHours(data);

      // Debug print
      // console.log('=== CALCULATION RESULTS ===');
      // console.log(`Data points: ${data.length}`);
      // console.log(`Total Production: ${totalProductionKWh.toFixed(2)} kWh`);
      // console.log(
      //   `Total Fuel Consumed: ${totalFuelConsumption.toFixed(2)} gallons`,
      // );
      // console.log(`Running Hours: ${runningHours.toFixed(2)} hours`);

      // First 3 records check
      //   console.log('First 3 records production:');
      //   for (let i = 0; i < Math.min(3, data.length); i++) {
      //     const kW = data[i].Genset_Total_kW || 0;
      //     const production = kW * 0.000833;
      //     console.log(`  Record ${i}: ${kW} kW → ${production.toFixed(4)} kWh`);
      //   }
    }

    if (mode === 'live') {
      // Live mode: Latest record values
      const latest = doc;
      const instantProduction = (latest.Genset_Total_kW || 0) * 0.000833;

      return {
        // ✅ TOTAL PRODUCTION (SABHI DATA POINTS KA)
        totalProductionKWh: +totalProductionKWh.toFixed(2),

        // Instant/Current values
        instantProductionKWh: +instantProduction.toFixed(4),
        currentPowerKW: latest.Genset_Total_kW || 0,

        // Fuel metrics
        totalFuelConsumptionGallons: +totalFuelConsumption.toFixed(2),
        totalFuelConsumptionLiters: +(totalFuelConsumption * 3.7854).toFixed(2),
        fuelConsumptionCurrentRun: latest.Fuel_Consumption_Current_Run ?? 0,

        // Time metrics
        runningHours: +runningHours.toFixed(2),
        runningHoursFormatted:
          this.convertToHoursMinutes(runningHours).totalHours,

        // Efficiency
        specificFuelConsumption:
          totalFuelConsumption > 0
            ? +(totalFuelConsumption / totalProductionKWh).toFixed(4)
            : 0,
      };
    } else {
      // Historic/Range mode
      const metricsConfig = {
        // These will be averages
        // currentPowerKW: (d: any) => d.Genset_Total_kW || 0,
        // instantProductionKWh: (d: any) => (d.Genset_Total_kW || 0) * 0.000833,
        fuelConsumptionCurrentRun: (d: any) =>
          d.Fuel_Consumption_Current_Run ?? 0,
      };

      const averages = this.calculateAverageMetrics(data, metricsConfig);

      // ✅ RETURN BOTH: AVERAGES + TOTALS
      return {
        // Averages (for charts, trends)
        ...averages,

        // ✅ TOTALS (Report ke hisaab se - SABHI DATA POINTS KA)
        energyKWh: +totalProductionKWh.toFixed(2),
        // totalFuelConsumptionGallons: +totalFuelConsumption.toFixed(2),
        // totalFuelConsumptionLiters: +(totalFuelConsumption * 3.7854).toFixed(2),
        runningHours: +runningHours.toFixed(2),
        runningHoursFormatted:
          this.convertToHoursMinutes(runningHours).totalHours,

        // Efficiency metrics
        fuelEfficiencyIndex:
          totalFuelConsumption > 0
            ? +(totalProductionKWh / (totalFuelConsumption * 3.7854)).toFixed(2)
            : 0,
        specificFuelConsumption:
          totalProductionKWh > 0
            ? +((totalFuelConsumption * 3.7854) / totalProductionKWh).toFixed(4)
            : 0,
      };
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
      // const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
      // matchStage.timestamp = { $gte: oneHourAgo.toISOString() };
      // // matchStage.Genset_Run_SS = { $gte: 1 };
      // matchStage.Genset_Run_SS = 0;
      // console.log('Live mode → Last 1 hour with Genset_Run_SS >= 1');

      // ✅ SIMPLE FIX: Sirf date part plus time zone
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // YYYY-MM-DDTHH:MM:SS+05:00 format
      const year = oneHourAgo.getFullYear();
      const month = String(oneHourAgo.getMonth() + 1).padStart(2, '0');
      const day = String(oneHourAgo.getDate()).padStart(2, '0');
      const hours = String(oneHourAgo.getHours()).padStart(2, '0');
      const minutes = String(oneHourAgo.getMinutes()).padStart(2, '0');
      const seconds = String(oneHourAgo.getSeconds()).padStart(2, '0');

      const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+05:00`;

      matchStage.timestamp = { $gte: formattedTime };
      // matchStage.Genset_Run_SS = 0;
      matchStage.Genset_Run_SS = { $gte: 1 };

      console.log('Live mode filter:', formattedTime);
      console.log(
        'Current time:',
        new Date().toISOString().replace('Z', '+05:00'),
      );
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({ $project: projection });
    pipeline.push({ $sort: { timestamp: 1 } });

    console.log('Pipeline built successfully with +05:00 direct comparison');
    return pipeline;
  }

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
  //   console.log('Received dates:', { start, end });

  //   if ((mode === 'historic' || mode === 'range') && start && end) {
  //     let startISO = start;
  //     let endISO = end;

  //     // Agar sirf date hai (2025-11-18) to +05:00 add kar do
  //     if (!start.includes('T')) {
  //       startISO = `${start}T00:00:00+05:00`;
  //       endISO = `${end}T23:59:59.999+05:00`;
  //     }

  //     // Agar end time 00:00:00 hai to 23:59:59 bana do
  //     if (endISO.includes('T00:00:00') && !endISO.includes('23:59')) {
  //       const datePart = endISO.split('T')[0];
  //       endISO = `${datePart}T23:59:59.999+05:00`;
  //     }

  //     matchStage.timestamp = {
  //       $gte: startISO,
  //       $lte: endISO,
  //     };

  //     if (mode === 'range') {
  //       matchStage.Genset_Run_SS = { $gte: 1 };
  //     }

  //     console.log('Final +05:00 Range (Direct String Compare):');
  //     console.log('  $gte →', startISO);
  //     console.log('  $lte →', endISO);
  //     // } else if (mode === 'live') {
  //     //   const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  //     //   matchStage.timestamp = { $gte: sixHoursAgo.toISOString() };

  //     //   // ✅ YEH LINE ADD KARAIN - Live mode ke liye Genset_Run_SS condition
  //     //   matchStage.Genset_Run_SS = { $gte: 1 };

  //     //   console.log('Live mode → Last 6 hours with Genset_Run_SS >= 1');
  //     // }
  //   } else if (mode === 'live') {
  //     const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour
  //     matchStage.timestamp = { $gte: oneHourAgo.toISOString() };
  //     matchStage.Genset_Run_SS = { $gte: 1 };
  //     console.log('Live mode → Last 1 hour with Genset_Run_SS >= 1');
  //   }

  //   if (Object.keys(matchStage).length > 0) {
  //     pipeline.push({ $match: matchStage });
  //   }

  //   pipeline.push({ $project: projection });
  //   pipeline.push({ $sort: { timestamp: 1 } });

  //   console.log('Pipeline built successfully with +05:00 direct comparison');
  //   return pipeline;
  // }

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

  // private buildAggregationPipeline(
  //   mode: string,
  //   projection: Record<string, number>,
  //   clientId?: string,
  //   init?: boolean,
  //   start?: string,
  //   end?: string,
  // ): any[] {
  //   const pipeline: any[] = [];
  //   const matchStage: any = {};

  //   // ---------------- HISTORIC / RANGE ----------------
  //   if ((mode === 'historic' || mode === 'range') && start && end) {
  //     let startISO = start;
  //     let endISO = end;

  //     if (!start.includes('T')) {
  //       startISO = `${start}T00:00:00+05:00`;
  //       endISO = `${end}T23:59:59.999+05:00`;
  //     }

  //     matchStage.timestamp = { $gte: startISO, $lte: endISO };

  //     if (mode === 'range') {
  //       matchStage.Genset_Run_SS = { $gte: 1 };
  //     }
  //   }

  //   // ---------------- LIVE MODE ----------------
  //   if (mode === 'live') {
  //     if (!clientId) throw new Error('clientId required in live mode');

  //     // First call → last 1 hour history
  //     if (init || !this.liveClients[clientId]) {
  //       const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  //       matchStage.timestamp = { $gte: oneHourAgo.toISOString() };
  //       matchStage.Genset_Run_SS = { $gte: 1 };
  //     }

  //     // Subsequent calls → only new data
  //     else {
  //       matchStage.timestamp = {
  //         $gt: this.liveClients[clientId],
  //       };
  //       matchStage.Genset_Run_SS = { $gte: 1 };
  //     }
  //   }

  //   if (Object.keys(matchStage).length) {
  //     pipeline.push({ $match: matchStage });
  //   }

  //   pipeline.push({ $project: projection });
  //   pipeline.push({ $sort: { timestamp: 1 } });

  //   return pipeline;
  // }

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
      'Percent_Engine_Torque_calculated',
      'Averagr_Engine_Speed',

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

  // private getFromCache(key: string): any {
  //   const cached = this.cache.get(key);
  //   if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
  //     console.log(`⚡ Cache hit for: ${key}`);
  //     return cached.data;
  //   }
  //   return null;
  // }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);

    // 🔴 LIVE MODE KE LIYE CACHE DISABLE KARDEIN
    if (key.includes('_live_') || key.includes('mode=live')) {
      console.log(`🔄 Live mode - Cache bypass for: ${key}`);
      return null; // ❌ Live mode mein cache nahi chalega
    }

    // ✅ Historic/Range mode ke liye cache chalega (5 minutes)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`⚡ Historic cache hit for: ${key}`);
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
      'Percent_Engine_Torque_or_Duty_Cycle',
      'Averagr_Engine_Speed',
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
      // const loadStress = this.formulas.calculateLoadStress(d);
      // console.log('Load Stress Calculation:', {
      //   hasKVA: !!(d.Genset_Total_KVA || d.Genset_Total_kVA),
      //   hasRating: !!d.Genset_Application_kVA_Rating_PC2X,
      //   hasPF: !!d.Genset_Total_Power_Factor_calculated,
      //   result: loadStress,
      // });

      return {
        time: d.timestamp,
        LoadStress: this.formulas.calculateMechanicalStress(d) || 0,
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
      // Frequency_Deviation_Rad: d.Averagr_Engine_Speed ?? null,
      Frequency_Deviation_Rad: this.formulas.calculateFrequencyDeviationAbs(d),
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
      Fuel_Efficiency_Index:
        this.formulas.calculateSpecificFuelConsumption(d) || 0,
    }));

    // Use FormulasService for complex calculations
    charts.rpmStabilityIndex =
      this.formulas.calculateRPMStabilityWithLoad(data);
    charts.oscillationIndex = this.formulas.calculateOscillationIndex(data);
    charts.fuelConsumption = this.formulas.calculateFuelConsumption(data);
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
    console.log('=== CALCULATE CONSUMPTION METRICS ===');
    console.log(`Data records: ${data.length}, Mode: ${mode}`);
    console.log(`Start: ${start}, End: ${end}`);

    if (data.length === 0) {
      console.log('❌ No data available');
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

    console.log(
      `⚡ Power Factor - Max: ${powerFactorStats.max}, Min: ${powerFactorStats.min}`,
    );

    // 2. Calculate Total Consumption (MAX - MIN of ENTIRE RANGE)
    const totalConsumptionValues = data
      .map((d) => d.Total_Fuel_Consumption_calculated)
      .filter((val) => val !== undefined && val !== null && !isNaN(val));

    let totalConsumption = 0;
    if (totalConsumptionValues.length >= 2) {
      const maxValue = Math.max(...totalConsumptionValues);
      const minValue = Math.min(...totalConsumptionValues);
      totalConsumption = Math.max(0, maxValue - minValue);
      console.log(`⛽ TOTAL CONSUMPTION (ENTIRE RANGE):`);
      console.log(`   Max value: ${maxValue.toFixed(2)} gallons`);
      console.log(`   Min value: ${minValue.toFixed(2)} gallons`);
      console.log(`   Difference: ${totalConsumption.toFixed(2)} gallons`);
    } else if (totalConsumptionValues.length === 1) {
      totalConsumption = totalConsumptionValues[0];
      console.log(
        `⛽ TOTAL CONSUMPTION (Single value): ${totalConsumption} gallons`,
      );
    }

    // 3. Calculate Total Consumption Current Run (END DATE ONLY)
    let totalConsumptionCurrentRun = 0;

    if ((mode === 'range' || mode === 'historic') && end) {
      console.log('🎯 CALCULATING CURRENT RUN (END DATE ONLY)');

      const endDateData = this.filterDataForEndDateOnly(data, end);
      console.log(`📊 End date records: ${endDateData.length}`);

      if (endDateData.length >= 2) {
        const endDateValues = endDateData
          .map((d) => d.Total_Fuel_Consumption_calculated)
          .filter((val) => val !== undefined && val !== null && !isNaN(val));

        if (endDateValues.length >= 2) {
          const firstValue = endDateValues[0];
          const lastValue = endDateValues[endDateValues.length - 1];
          totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);

          console.log(`⛽ CURRENT RUN (END DATE ONLY):`);
          console.log(
            `   First value (end date): ${firstValue.toFixed(2)} gallons`,
          );
          console.log(
            `   Last value (end date): ${lastValue.toFixed(2)} gallons`,
          );
          console.log(
            `   Difference: ${totalConsumptionCurrentRun.toFixed(2)} gallons`,
          );
        }
      } else if (endDateData.length === 1) {
        totalConsumptionCurrentRun =
          endDateData[0].Total_Fuel_Consumption_calculated || 0;
        console.log(
          `⛽ CURRENT RUN (Single end date record): ${totalConsumptionCurrentRun} gallons`,
        );
      } else {
        console.log('⚠️ No end date data found for current run calculation');
      }
    } else {
      console.log('🎯 CALCULATING CURRENT RUN (NORMAL - NO END DATE)');
      const currentRunValues = data
        .map((d) => d.Total_Fuel_Consumption_calculated)
        .filter((val) => val !== undefined && val !== null && !isNaN(val));

      if (currentRunValues.length >= 2) {
        const firstValue = currentRunValues[0];
        const lastValue = currentRunValues[currentRunValues.length - 1];
        totalConsumptionCurrentRun = Math.max(0, lastValue - firstValue);
        console.log(
          `⛽ CURRENT RUN (NORMAL): ${lastValue} - ${firstValue} = ${totalConsumptionCurrentRun} gallons`,
        );
      } else if (currentRunValues.length === 1) {
        totalConsumptionCurrentRun = currentRunValues[0];
        console.log(
          `⛽ CURRENT RUN (Single): ${totalConsumptionCurrentRun} gallons`,
        );
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
      `📊 Total Consumption: ${totalConsumptionLiters.toFixed(2)} liters (${totalConsumption.toFixed(2)} gallons)`,
    );
    console.log(
      `📊 Current Run Consumption: ${totalConsumptionCurrentRunLiters.toFixed(2)} liters (${totalConsumptionCurrentRun.toFixed(2)} gallons)`,
    );
    console.log(`⚡ Energy: ${energy.toFixed(2)} kWh`);
    console.log(
      `🔌 Power Factor - Max: ${powerFactorStats.max.toFixed(4)}, Min: ${powerFactorStats.min.toFixed(4)}`,
    );

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

  private filterDataForEndDateOnly(data: any[], endDate: string): any[] {
    console.log('=== FILTER DATA FOR END DATE ONLY ===');
    console.log(`Input endDate: "${endDate}"`);
    console.log(`Total data records: ${data.length}`);

    // ✅ Extract just the date part from endDate
    let targetDate = '';

    // Extract YYYY-MM-DD from endDate
    const dateMatch = endDate.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      targetDate = dateMatch[0];
    } else {
      console.log('❌ Could not extract date from endDate');
      return [];
    }

    console.log(`🎯 Target date to filter: ${targetDate}`);

    // ✅ Check first 5 timestamps in data
    console.log('🔍 Checking first 5 timestamps in data:');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const timestamp = data[i].timestamp;
      console.log(
        `  ${i + 1}. ${timestamp} - Contains "${targetDate}": ${String(timestamp).includes(targetDate)}`,
      );
    }

    // ✅ Check last 5 timestamps in data
    console.log('🔍 Checking last 5 timestamps in data:');
    for (let i = Math.max(0, data.length - 5); i < data.length; i++) {
      const timestamp = data[i].timestamp;
      console.log(
        `  ${i + 1}. ${timestamp} - Contains "${targetDate}": ${String(timestamp).includes(targetDate)}`,
      );
    }

    // ✅ Filter the data
    const filteredData = data.filter((item, index) => {
      if (!item.timestamp) return false;

      const timestampStr = String(item.timestamp);
      const containsDate = timestampStr.includes(targetDate);

      // Debug: Log first few matches
      if (containsDate && filteredData.length < 3) {
        console.log(`✅ Found match at index ${index}: ${timestampStr}`);
        console.log(`   Fuel value: ${item.Total_Fuel_Consumption_calculated}`);
      }

      return containsDate;
    });

    console.log(
      `📊 Filtered ${filteredData.length} records for date: ${targetDate}`,
    );

    if (filteredData.length > 0) {
      console.log('📈 First filtered record:');
      console.log(`   Time: ${filteredData[0].timestamp}`);
      console.log(
        `   Fuel: ${filteredData[0].Total_Fuel_Consumption_calculated}`,
      );

      console.log('📈 Last filtered record:');
      console.log(
        `   Time: ${filteredData[filteredData.length - 1].timestamp}`,
      );
      console.log(
        `   Fuel: ${filteredData[filteredData.length - 1].Total_Fuel_Consumption_calculated}`,
      );

      const diff =
        filteredData[filteredData.length - 1]
          .Total_Fuel_Consumption_calculated -
        filteredData[0].Total_Fuel_Consumption_calculated;
      console.log(`💰 Fuel difference: ${diff.toFixed(2)} gallons`);
    } else {
      console.log('⚠️ No records found for the target date!');
      console.log('🔍 All unique dates in data:');

      // Get unique dates from data
      const uniqueDates = new Set<string>();
      data.forEach((item) => {
        if (item.timestamp) {
          const ts = String(item.timestamp);
          const dateMatch = ts.match(/\d{4}-\d{2}-\d{2}/);
          if (dateMatch) {
            uniqueDates.add(dateMatch[0]);
          }
        }
      });

      console.log('   Unique dates found:', Array.from(uniqueDates).sort());
    }

    return filteredData;
  }

  getDashboardConfig(dashboard: string) {
    return this.dashboardConfigs[dashboard];
  }

  // Optimize live query for Change Streams
  async getLiveDataForChangeStream(lastTimestamp?: string) {
    const matchStage: any = { Genset_Run_SS: { $gte: 1 } };

    if (lastTimestamp) {
      matchStage.timestamp = { $gt: lastTimestamp };
    } else {
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      matchStage.timestamp = { $gte: thirtySecondsAgo.toISOString() };
    }

    const pipeline = [
      { $match: matchStage },
      { $sort: { timestamp: 1 } },
      { $limit: 100 }, // Max 100 documents
    ];

    return await this.collection.aggregate(pipeline).toArray();
  }

  /** -------------------
   * OPTIMIZED LIVE DASHBOARD APIs - Latest single document
   * ------------------- */

  async getDashboard1LiveLatest() {
    const config = this.dashboardConfigs['dashboard1'];
    const latestDoc = await this.getLatestLiveDocument(config.projection);
    return this.formatLiveResponse(latestDoc, config);
  }

  async getDashboard2LiveLatest() {
    const config = this.dashboardConfigs['dashboard2'];
    const latestDoc = await this.getLatestLiveDocument(config.projection);
    return this.formatLiveResponse(latestDoc, config);
  }

  async getDashboard3LiveLatest() {
    const config = this.dashboardConfigs['dashboard3'];
    const latestDoc = await this.getLatestLiveDocument(config.projection);
    return this.formatLiveResponse(latestDoc, config);
  }

  async getDashboard4LiveLatest() {
    const config = this.dashboardConfigs['dashboard4'];
    const latestDoc = await this.getLatestLiveDocument(config.projection);
    return this.formatLiveResponse(latestDoc, config);
  }

  async getDashboard5LiveLatest() {
    const config = this.dashboardConfigs['dashboard5'];
    const latestDoc = await this.getLatestLiveDocument(config.projection);
    return this.formatLiveResponse(latestDoc, config);
  }

  async getDashboard6LiveLatest() {
    const config = this.dashboardConfigs['dashboard6'];
    const latestDoc = await this.getLatestLiveDocument(config.projection);
    return this.formatLiveResponse(latestDoc, config);
  }

  private async getLatestLiveDocument(projection: Record<string, number>) {
    const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000);

    const pipeline = [
      {
        $match: {
          timestamp: { $gte: ninetyMinutesAgo.toISOString() },
          Genset_Run_SS: { $gte: 1 },
        },
      },
      { $project: projection },
      { $sort: { timestamp: -1 } },
      { $limit: 1 },
    ];

    const result = await this.liveCollection.aggregate(pipeline).toArray();
    return result.length > 0 ? result[0] : null;
  }

  private formatLiveResponse(latestDoc: any, config: DashboardConfig) {
    if (!latestDoc) {
      return {
        metrics: {},
        charts: {},
        timestamp: new Date().toISOString(),
        message: 'No live data available',
      };
    }

    // Sirf latest metrics (charts ke liye array nahi, sirf latest values)
    const metrics = config.metricsMapper(latestDoc, [], 'live');

    // Charts ke liye sirf latest values as single point arrays
    const chartsData = [
      {
        ...latestDoc,
        timestamp: this.formatDateTimestamp(latestDoc.timestamp),
      },
    ];

    const charts = config.chartsMapper(chartsData);

    return {
      metrics: this.removeZeroValuesButKeepImportant(metrics),
      charts: this.convertChartsToLatestOnly(charts),
      timestamp: latestDoc.timestamp,
      formattedTimestamp: this.formatDateTimestamp(latestDoc.timestamp),
    };
  }

  private convertChartsToLatestOnly(
    charts: Record<string, any[]>,
  ): Record<string, any[]> {
    const result: Record<string, any[]> = {};

    for (const [chartName, data] of Object.entries(charts)) {
      // Agar data hai to sirf last point le lo
      result[chartName] = data.length > 0 ? [data[data.length - 1]] : [];
    }

    return result;
  }
}
