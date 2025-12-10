/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/stream/stream.controller.ts
import { Controller, Get, Res, Header, Inject } from '@nestjs/common';
import { Response } from 'express';
import { Db } from 'mongodb';
import { FormulasService } from 'src/trends/formulas.service';

@Controller('stream')
export class StreamController {
  private liveCollection;
  private readonly UPDATE_INTERVAL = 12000;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulas: FormulasService,
  ) {
    this.liveCollection = this.db.collection('navy_12_live');
  }

  // ✅ Timestamp format: "Dec 10, 12:00:00"
  private formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
  }

  // ✅ Calculate ALL metrics
  private calculateAllMetrics(latest: any): Record<string, any> {
    return {
      load: this.formulas.calculateLoad(latest),
      rpm: latest.Averagr_Engine_Speed || 0,
      batteryVoltage: latest.Battery_Voltage_calculated || 0,
      powerFactor: latest.Genset_Total_Power_Factor_calculated || 0,
      runningHours: latest.Engine_Running_Time_calculated || 0,
      fuelConsumed: latest.Total_Fuel_Consumption_calculated
        ? +(latest.Total_Fuel_Consumption_calculated * 3.7854).toFixed(2)
        : 0,
      currentImbalance: this.formulas.calculateCurrentImbalance(latest) || 0,
      voltageImbalance: this.formulas.calculateVoltageImbalance(latest) || 0,
      neutralCurrent: this.formulas.calculateNeutralCurrent(latest) || 0,
      coolingMarginF: this.formulas.calculateCoolingMarginF(latest) || 0,
      coolingMarginC: this.formulas.calculateCoolingMarginC(latest) || 0,
      thermalStressF: this.formulas.calculateThermalStressF(latest) || 0,
      thermalStressC: this.formulas.calculateThermalStressC(latest) || 0,
      otsrF: this.formulas.calculateOTSRF(latest) || 0,
      otsrC: this.formulas.calculateOTSRC(latest) || 0,
      lubricationRiskIndex:
        this.formulas.calculateLubricationRiskIndex(latest) || 0,
      airFuelEffectiveness:
        this.formulas.calculateAirFuelEffectiveness(latest) || 0,
      specificFuelConsumption:
        this.formulas.calculateSpecificFuelConsumption(latest) || 0,
      heatRate: this.formulas.calculateHeatRate(latest) || 0,
      thermalEfficiency: this.formulas.calculateThermalEfficiency(latest) || 0,
      fuelFlowRateChange:
        this.formulas.calculateFuelFlowRateChange(latest, null) || 0,
      loadPercent: this.formulas.calculateLoadPercent(latest) || 0,
      powerLossFactor: this.formulas.calculatePowerLossFactor(latest) || 0,
      loadStress: this.formulas.calculateLoadStress(latest) || 0,
      electricalStress: this.formulas.calculateElectricalStress(latest) || 0,
      mechanicalStress: this.formulas.calculateMechanicalStress(latest) || 0,
      fuelEfficiencyIndex:
        this.formulas.calculateFuelEfficiencyIndex(latest) || 0,
      avgLLVoltage: this.formulas.calculateAvgLLVoltage(latest) || 0,
      oilTemperatureC: this.formulas.convertOilTempToCelsius(latest) || 0,
      coolantTemperatureC: this.formulas.convertCoolantToCelsius(latest) || 0,
      intakeTemperatureC: this.formulas.convertIntakeToCelsius(latest) || 0,
      energyKWh: this.formulas.calculateEnergy([latest])[0]?.Energy_kWh || 0,
    };
  }

  // ✅ Calculate ALL charts data
  private calculateAllCharts(latest: any): Record<string, any> {
    return {
      Genset_L1L2_Voltage: latest.Genset_L1L2_Voltage || 0,
      Genset_L2L3_Voltage: latest.Genset_L2L3_Voltage || 0,
      Genset_L3L1_Voltage: latest.Genset_L3L1_Voltage || 0,
      Genset_Frequency_OP_calculated:
        latest.Genset_Frequency_OP_calculated || 0,
      Genset_L1_Current: latest.Genset_L1_Current || 0,
      Genset_L2_Current: latest.Genset_L2_Current || 0,
      Genset_L3_Current: latest.Genset_L3_Current || 0,
      Coolant_Temperature: latest.Coolant_Temperature || 0,
      Oil_Temperature: latest.Oil_Temperature || 0,
      Oil_Pressure: latest.Oil_Pressure || 0,
      Fuel_Rate: latest.Fuel_Rate || 0,
      Genset_L1N_Voltage: latest.Genset_L1N_Voltage || 0,
      Genset_L2N_Voltage: latest.Genset_L2N_Voltage || 0,
      Genset_L3N_Voltage: latest.Genset_L3N_Voltage || 0,
      Genset_Total_kW: latest.Genset_Total_kW || 0,
      Genset_L1_kW: latest.Genset_L1_kW || 0,
      Genset_L2_kW: latest.Genset_L2_kW || 0,
      Genset_L3_kW: latest.Genset_L3_kW || 0,
      Genset_Total_kVA: latest.Genset_Total_kVA || 0,
      Intake_Manifold_Temperature_calculated:
        latest.Intake_Manifold_Temperature_calculated || 0,
      Boost_Pressure: latest.Boost_Pressure || 0,
      AfterCooler_Temperature: latest.AfterCooler_Temperature || 0,
      Percent_Engine_Torque_or_Duty_Cycle:
        latest.Percent_Engine_Torque_or_Duty_Cycle || 0,
      Fuel_Outlet_Pressure_calculated:
        latest.Fuel_Outlet_Pressure_calculated || 0,
      Barometric_Absolute_Pressure: latest.Barometric_Absolute_Pressure || 0,
      Energy_kWh: latest.Energy_kWh || 0,
      Fuel_Consumption_Current_Run: latest.Fuel_Consumption_Current_Run || 0,
    };
  }

  @Get('live')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async liveStream(@Res() res: Response) {
    console.log('📡 SSE Client connected');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendUpdate = async () => {
      try {
        const latest = await this.liveCollection.findOne(
          { Genset_Run_SS: { $gte: 1 } },
          { sort: { timestamp: -1 } },
        );

        if (latest) {
          const formattedTimestamp = this.formatTimestamp(latest.timestamp);

          const data = {
            type: 'dashboard-update',
            time: formattedTimestamp,
            recordFound: true,
            isRunning: latest.Genset_Run_SS >= 1,
            metrics: this.calculateAllMetrics(latest),
            charts: this.calculateAllCharts(latest),
          };

          res.write(`data: ${JSON.stringify(data)}\n\n`);
        } else {
          const anyRecord = await this.liveCollection.findOne(
            {},
            { sort: { timestamp: -1 } },
          );

          if (anyRecord) {
            const formattedTimestamp = this.formatTimestamp(
              anyRecord.timestamp,
            );

            const data = {
              type: 'dashboard-update',
              time: formattedTimestamp,
              recordFound: true,
              isRunning: anyRecord.Genset_Run_SS >= 1,
              metrics: this.calculateAllMetrics(anyRecord),
              charts: this.calculateAllCharts(anyRecord),
            };

            res.write(`data: ${JSON.stringify(data)}\n\n`);
          } else {
            const errorData = {
              type: 'no-data',
              message: 'No records in live collection',
            };
            res.write(`data: ${JSON.stringify(errorData)}\n\n`);
          }
        }
      } catch (error) {
        const errorData = {
          event: 'error',
          data: {
            type: 'error',
            message: 'Database error: ' + error.message,
          },
        };
        res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      }
    };

    await sendUpdate();
    const interval = setInterval(sendUpdate, this.UPDATE_INTERVAL);

    res.on('close', () => {
      console.log('❌ SSE Client disconnected');
      clearInterval(interval);
    });

    res.on('error', (err) => {
      console.error('❌ Response stream error:', err);
      clearInterval(interval);
    });
  }

  @Get('latest')
  async getLatestData() {
    const latest = await this.liveCollection.findOne(
      { Genset_Run_SS: { $gte: 1 } },
      { sort: { timestamp: -1 } },
    );

    if (!latest) {
      return { error: 'No running generator found' };
    }

    const formattedTimestamp = this.formatTimestamp(latest.timestamp);

    return {
      time: formattedTimestamp,
      metrics: this.calculateAllMetrics(latest),
      charts: this.calculateAllCharts(latest),
    };
  }
}
