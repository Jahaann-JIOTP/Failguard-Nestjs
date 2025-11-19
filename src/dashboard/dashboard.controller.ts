// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// import { Controller, Get, Query } from '@nestjs/common';
// import { DashboardService } from './dashboard.service';

// @Controller('dashboard')
// export class DashboardController {
//   constructor(private readonly dashboardService: DashboardService) {}

//   /** ---------------------------------------------------
//    *  DASHBOARD 1 — BASIC LEVEL
//    * --------------------------------------------------- */

//   //  Metrics
//   @Get('operator-level')
//   async getDashboard1Metrics(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { metrics } = await this.dashboardService.getDashboard1Data(
//       mode,
//       start,
//       end,
//     );
//     return metrics;
//   }

//   // Electrical Stability Chart
//   @Get('operator-level/electrical-stability')
//   async getElectricalStabilityChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard1Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.electricalStability;
//   }

//   // Load Sharing Chart
//   @Get('operator-level/load-sharing')
//   async getLoadSharingChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.phaseBalanceEffectiveness;
//   }

//   // Current Imbalance + Neutral Current Chart
//   @Get('operator-level/current-balance')
//   async getCurrentImbalanceNeutralChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard1Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.CurrentImbalanceNeutral;
//   }

//   // Engine Thermal Chart
//   @Get('operator-level/engine-thermal')
//   async getEngineThermalChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard1Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.engineThermal;
//   }

//   // Lubrication Chart
//   @Get('operator-level/lube-pressure')
//   async getLubricationChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard1Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.lubrication;
//   }

//   // Fuel Demand Chart
//   @Get('operator-level/fuel-demand')
//   async getFuelDemandChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard1Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.fuelDemand;
//   }

//   /** ---------------------------------------------------
//    *  DASHBOARD 2 — ENGINEER LEVEL
//    * --------------------------------------------------- */

//   // Metrics
//   @Get('electrical-health')
//   async getDashboard2Metrics(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { metrics } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return metrics;
//   }

//   // Phase Balance Effectiveness Chart
//   @Get('electrical-health/phase-balance')
//   async getPhaseBalanceEffectivenessChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard1Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.loadSharing;
//   }

//   // Voltage Quality & Symmetry Chart
//   @Get('electrical-health/voltage-quality')
//   async getVoltageQualitySymmetryChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.voltageQualitySymmetry;
//   }

//   // Load vs Power Factor Chart
//   @Get('electrical-health/load-power-factor')
//   async getLoadVsPowerFactorChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.loadVsPowerFactor;
//   }

//   // Electro–Mechanical Stress Chart
//   @Get('electrical-health/electro-mechanical-stress')
//   async getElectroMechanicalStressChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.electroMechanicalStress;
//   }

//   // Losses & Thermal Stress Chart
//   @Get('electrical-health/losses-thermal')
//   async getLossesThermalStressChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.lossesThermalStress;
//   }

//   // Frequency Regulation Effectiveness Chart
//   @Get('electrical-health/frequency-regulation')
//   async getFrequencyRegulationEffectivenessChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.frequencyRegulationEffectiveness;
//   }

//   // Current & Voltage Imbalance Chart
//   @Get('electrical-health/current-voltage-imbalance')
//   async getCurrentVoltageImbalanceChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.currentBalanceNeutral;
//   }

//   // Chart 1: combustion Air Temperature vs Boost Pressure
//   @Get('thermal-health/combustion-air')
//   async getIntakeBoostChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard3Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as Record<string, any[]>).intakeBoost ?? [];
//   }

//   // Chart 2: Cooling Margin
//   @Get('thermal-health/cooling-margin')
//   async getCoolingMarginChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard3Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as Record<string, any[]>).coolingMargin ?? [];
//   }

//   // Engine Thermal Chart
//   @Get('thermal-health/thermal-performance')
//   async getThermalPerformanceChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard1Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.engineThermal;
//   }

//   /** Chart 3: Voltage Imbalance vs LL Average Voltage */
//   @Get('thermal-health/cooling-efficiency')
//   async getVoltageImbalanceChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard2Data(
//       mode,
//       start,
//       end,
//     );
//     return charts.voltageQualitySymmetry;
//   }

//   // Load vs Power Factor Chart
//   @Get('thermal-health/thermal-stress')
//   async getThermalStressAlertChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard3Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as Record<string, any[]>).thermalStress ?? [];
//   }

//   /** ---------------------------------------------------
//    *  DASHBOARD 4 — lubrication LEVEL
//    * --------------------------------------------------- */

//   // Metrics endpoint
//   // @Get('lubrication')
//   // async getDashboard4Metrics(
//   //   @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//   //   @Query('start') start?: string,
//   //   @Query('end') end?: string,
//   // ) {
//   //   const { metrics } = await this.dashboardService.getDashboard4Data(
//   //     mode,
//   //     start,
//   //     end,
//   //   );
//   //   return metrics;
//   // }

//   // Chart 1: Lubrication Risk Index
//   @Get('lubrication/lubrication-health')
//   async getLubricationRiskChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard4Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as Record<string, any[]>).lubricationRiskIndex ?? [];
//   }

//   // Chart 2: Oil Pressure & Engine Speed
//   @Get('lubrication/lub-pressure-response')
//   async getOilPressureEngineSpeed(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard4Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as Record<string, any[]>).oilPressureEngineSpeed ?? [];
//   }

//   // Chart 3: Boost & Fuel Outlet Pressure
//   @Get('lubrication/air-fuel-profile')
//   async getBoostFuelOutlet(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard4Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as Record<string, any[]>).boostFuelOutlet ?? [];
//   }

//   // Chart 4: Boost Pressure & Load%
//   @Get('lubrication/turbo-effectiveness')
//   async getBoostLoadChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard4Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as Record<string, any[]>).boostLoad ?? [];
//   }

//   // Chart 5: Fuel Outlet Pressure & Biometric Pressure
//   @Get('lubrication/fuel-ambient-pressure')
//   async getFuelOutletBiometricChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard4Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as Record<string, any[]>).fuelOutletBiometric ?? [];
//   }

//   /** ---------------------------------------------------
//    *  DASHBOARD 5 — FUEL & EFFICIENCY
//    * --------------------------------------------------- */

//   @Get('fuel-combustion/fuel-consumption-load')
//   async getFuelRateLoad(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard5Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).fuelRateLoad ?? [];
//   }
//   @Get('fuel-combustion/fuel-flow-variability')
//   async getFuelRateChange(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard5Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).fuelFlowRateChange ?? [];
//   }

//   @Get('fuel-combustion/air-fuel-effectiveness')
//   async getAirFuelEffectiveness(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard5Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).airFuelEffectiveness ?? [];
//   }

//   @Get('fuel-combustion/fuel-generator-efficiency')
//   async getFuelGeneratorEfficiency(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard5Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).specificFuelConsumption ?? [];
//   }

//   @Get('fuel-combustion/combustion-mixture')
//   async getHeatRate(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard5Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).heatRate ?? [];
//   }

//   @Get('fuel-combustion/injection-system-health')
//   async getInjectionSystemHealth(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard5Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).fuelRateOutlet ?? [];
//   }

//   /** ---------------------------------------------------
//    *  DASHBOARD 6 — ENGINE PERFORMANCE & TORQUE
//    * --------------------------------------------------- */

//   @Get('performance-general')
//   async getDashboard6Metrics(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { metrics } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return metrics;
//   }

//   @Get('performance-general/torque-speed-characteristics')
//   async getTorqueVsRunningTimeChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).engineTorqueVsRunningTime ?? [];
//   }

//   @Get('performance-general/torque-fuel-relationship')
//   async getFuelRateVsTorqueChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).fuelRateVsTorque ?? [];
//   }
//   @Get('performance-general/generator-oscillation')
//   async getTorqueGeneratorOscillationChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).oscillationIndex ?? [];
//   }

//   // @Get('performance-general/rpm-stability')
//   // async getAverageEngineSpeedChart(
//   //   @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//   //   @Query('start') start?: string,
//   //   @Query('end') end?: string,
//   // ) {
//   //   const { charts } = await this.dashboardService.getDashboard6Data(
//   //     mode,
//   //     start,
//   //     end,
//   //   );
//   //   return (charts as any).averageEngineSpeed ?? [];
//   // }

//   @Get('performance-general/rpm-stability')
//   async getAverageEngineSpeedChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );

//     // const averageEngineSpeedData = (charts as any).averageEngineSpeed ?? [];
//     // const rpmStabilityData = (charts as any).rpmStabilityIndex ?? [];

//     // ✅ Separate objects return karein
//     return (charts as any).rpmStabilityIndex ?? [];
//   }

//   @Get('performance-general/output-efficiency')
//   async getGensetPowerFactorChart(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).gensetPowerFactor ?? [];
//   }
//   @Get('performance-general/multi-dimensional-stress')
//   async getMultiDimensionalStress(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).mechanicalStress ?? [];
//   }
//   @Get('performance-load/load-impact-speed')
//   async getRPMStabilityIndex(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).rpmStabilityIndex ?? [];
//     // const loadPercentData = (charts as any).loadPercent ?? [];
//     // const rpmStabilityData = (charts as any).rpmStabilityIndex ?? [];

//     // // ✅ Separate objects return karein
//     // return {
//     //   loadPercent: loadPercentData,
//     //   rpmStabilityIndex: rpmStabilityData,
//     // };
//   }

//   // @Get('performance-load/oscillation-behavior')
//   // async getOscillationIndex(
//   //   @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//   //   @Query('start') start?: string,
//   //   @Query('end') end?: string,
//   // ) {
//   //   const { charts } = await this.dashboardService.getDashboard6Data(
//   //     mode,
//   //     start,
//   //     end,
//   //   );

//   //   const oscillationData = (charts as any).oscillationIndex ?? [];
//   //   const loadPercentData = (charts as any).loadPercent ?? [];

//   //   // ✅ Separate objects return karein
//   //   return {
//   //     oscillationIndex: oscillationData,
//   //     loadPercent: loadPercentData,
//   //   };
//   // }
//   @Get('performance-load/oscillation-behavior')
//   async getOscillationIndex(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );

//     return (charts as any).oscillationIndex ?? [];
//   }
//   @Get('performance-load/fuel-demand-load')
//   async getFuelConsumption(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).fuelConsumption ?? [];

//     // const fuelConsumptionData = (charts as any).fuelConsumption ?? [];
//     // const loadPercentData = (charts as any).loadPercent ?? [];

//     // // ✅ Separate objects return karein
//     // return {
//     //   fuelConsumption: fuelConsumptionData,
//     //   loadPercent: loadPercentData,
//     // };
//   }
//   @Get('performance-load/efficiency-under-load')
//   async getEfficiencyUnderLoad(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).loadPercent ?? [];
//   }
//   @Get('performance-load/torque-response-load')
//   async getTorqueResponseLoad(
//     @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
//     @Query('start') start?: string,
//     @Query('end') end?: string,
//   ) {
//     const { charts } = await this.dashboardService.getDashboard6Data(
//       mode,
//       start,
//       end,
//     );
//     return (charts as any).torqueResponseLoad ?? [];
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** ---------------------------------------------------
   *  DASHBOARD 1 — BASIC LEVEL (Operator Level)
   * --------------------------------------------------- */

  // Complete Dashboard 1 Data
  @Get('operator-level/metrics')
  async getDashboard1Data(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
  }

  // Metrics Only
  @Get('operator-level')
  async getDashboard1Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
    return metrics;
  }

  // Electrical Stability Chart
  @Get('operator-level/electrical-stability')
  async getElectricalStabilityChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
    return charts.electricalStability || [];
  }

  // Load Sharing Chart
  @Get('electrical-health/load-sharing')
  async getLoadSharingChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
    return charts.loadSharing || [];
  }

  // Current Imbalance + Neutral Current Chart
  @Get('operator-level/current-balance')
  async getCurrentImbalanceNeutralChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
    return charts.CurrentImbalanceNeutral || [];
  }

  // Engine Thermal Chart
  @Get('operator-level/engine-thermal')
  async getEngineThermalChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
    return charts.engineThermal || [];
  }

  // Lubrication Chart
  @Get('operator-level/lube-pressure')
  async getLubricationChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
    return charts.lubrication || [];
  }

  // Fuel Demand Chart
  @Get('operator-level/fuel-demand')
  async getFuelDemandChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
    return charts.fuelDemand || [];
  }

  /** ---------------------------------------------------
   *  DASHBOARD 2 — ENGINEER LEVEL (Electrical Health)
   * --------------------------------------------------- */

  // Complete Dashboard 2 Data
  @Get('electrical-health/metrics')
  async getDashboard2Data(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
  }

  // Metrics Only
  @Get('electrical-health')
  async getDashboard2Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
    return metrics;
  }

  // Phase Balance Effectiveness Chart
  @Get('operator-level/phase-balance')
  async getPhaseBalanceEffectivenessChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
    return charts.phaseBalanceEffectiveness || [];
  }

  // Voltage Quality & Symmetry Chart
  @Get('electrical-health/voltage-quality')
  async getVoltageQualitySymmetryChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
    return charts.voltageQualitySymmetry || [];
  }

  // Load vs Power Factor Chart
  @Get('electrical-health/load-power-factor')
  async getLoadVsPowerFactorChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
    return charts.loadVsPowerFactor || [];
  }

  // Electro–Mechanical Stress Chart
  @Get('electrical-health/electro-mechanical-stress')
  async getElectroMechanicalStressChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
    return charts.electroMechanicalStress || [];
  }

  // Losses & Thermal Stress Chart
  @Get('electrical-health/losses-thermal')
  async getLossesThermalStressChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
    return charts.lossesThermalStress || [];
  }

  // Frequency Regulation Effectiveness Chart
  @Get('electrical-health/frequency-regulation')
  async getFrequencyRegulationEffectivenessChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
    return charts.frequencyRegulationEffectiveness || [];
  }

  /** ---------------------------------------------------
   *  DASHBOARD 3 — MAINTENANCE LEVEL (Thermal Health)
   * --------------------------------------------------- */

  // Complete Dashboard 3 Data
  @Get('thermal-health/metrics')
  async getDashboard3Data(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.dashboardService.getDashboardData(
      'dashboard3',
      mode,
      start,
      end,
    );
  }

  // Metrics Only
  @Get('thermal-health')
  async getDashboard3Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboardData(
      'dashboard3',
      mode,
      start,
      end,
    );
    return metrics;
  }

  // Combustion Air Temperature vs Boost Pressure
  @Get('thermal-health/combustion-air')
  async getIntakeBoostChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard3',
      mode,
      start,
      end,
    );
    return charts.intakeBoost || [];
  }

  // Cooling Margin Chart
  @Get('thermal-health/cooling-margin')
  async getCoolingMarginChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard3',
      mode,
      start,
      end,
    );
    return charts.coolingMargin || [];
  }

  // Engine Thermal Chart (from Dashboard 1)
  @Get('thermal-health/thermal-performance')
  async getThermalPerformanceChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard1',
      mode,
      start,
      end,
    );
    return charts.engineThermal || [];
  }

  // Voltage Imbalance Chart (from Dashboard 2)
  @Get('thermal-health/cooling-efficiency')
  async getVoltageImbalanceChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard2',
      mode,
      start,
      end,
    );
    return charts.voltageQuality || [];
  }

  // Thermal Stress Alert Chart
  @Get('thermal-health/thermal-stress')
  async getThermalStressAlertChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard3',
      mode,
      start,
      end,
    );
    return charts.thermalStress || [];
  }

  /** ---------------------------------------------------
   *  DASHBOARD 4 — LUBRICATION LEVEL
   * --------------------------------------------------- */

  // Complete Dashboard 4 Data
  @Get('lubrication/metrics')
  async getDashboard4Data(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.dashboardService.getDashboardData(
      'dashboard4',
      mode,
      start,
      end,
    );
  }

  // Metrics Only
  @Get('lubrication')
  async getDashboard4Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboardData(
      'dashboard4',
      mode,
      start,
      end,
    );
    return metrics;
  }

  // Lubrication Risk Index Chart
  @Get('lubrication/lubrication-health')
  async getLubricationRiskChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard4',
      mode,
      start,
      end,
    );
    return charts.lubricationRiskIndex || [];
  }

  // Oil Pressure & Engine Speed Chart
  @Get('lubrication/lub-pressure-response')
  async getOilPressureEngineSpeed(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard4',
      mode,
      start,
      end,
    );
    return charts.oilPressureEngineSpeed || [];
  }

  // Boost & Fuel Outlet Pressure Chart
  @Get('lubrication/air-fuel-profile')
  async getBoostFuelOutlet(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard4',
      mode,
      start,
      end,
    );
    return charts.boostFuelOutlet || [];
  }

  // Boost Pressure & Load% Chart
  @Get('lubrication/turbo-effectiveness')
  async getBoostLoadChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard4',
      mode,
      start,
      end,
    );
    return charts.boostLoad || [];
  }

  // Fuel Outlet Pressure & Biometric Pressure Chart
  @Get('lubrication/fuel-ambient-pressure')
  async getFuelOutletBiometricChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard4',
      mode,
      start,
      end,
    );
    return charts.fuelOutletBiometric || [];
  }

  /** ---------------------------------------------------
   *  DASHBOARD 5 — FUEL & EFFICIENCY
   * --------------------------------------------------- */

  // Complete Dashboard 5 Data
  @Get('fuel-combustion/metrics')
  async getDashboard5Data(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.dashboardService.getDashboardData(
      'dashboard5',
      mode,
      start,
      end,
    );
  }

  // Metrics Only
  @Get('fuel-combustion')
  async getDashboard5Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboardData(
      'dashboard5',
      mode,
      start,
      end,
    );
    return metrics;
  }

  // Fuel Consumption vs Load Chart
  @Get('fuel-combustion/fuel-consumption-load')
  async getFuelRateLoad(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard5',
      mode,
      start,
      end,
    );
    return charts.fuelRateLoad || [];
  }

  // Fuel Flow Variability Chart
  @Get('fuel-combustion/fuel-flow-variability')
  async getFuelRateChange(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard5',
      mode,
      start,
      end,
    );
    return charts.fuelFlowRateChange || [];
  }

  // Air Fuel Effectiveness Chart
  @Get('fuel-combustion/air-fuel-effectiveness')
  async getAirFuelEffectiveness(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard5',
      mode,
      start,
      end,
    );
    return charts.airFuelEffectiveness || [];
  }

  // Fuel Generator Efficiency Chart
  @Get('fuel-combustion/fuel-generator-efficiency')
  async getFuelGeneratorEfficiency(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard5',
      mode,
      start,
      end,
    );
    return charts.specificFuelConsumption || [];
  }

  // Combustion Mixture Chart
  @Get('fuel-combustion/combustion-mixture')
  async getHeatRate(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard5',
      mode,
      start,
      end,
    );
    return charts.heatRate || [];
  }

  // Injection System Health Chart
  @Get('fuel-combustion/injection-system-health')
  async getInjectionSystemHealth(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard5',
      mode,
      start,
      end,
    );
    return charts.fuelRateOutlet || [];
  }

  /** ---------------------------------------------------
   *  DASHBOARD 6 — ENGINE PERFORMANCE & TORQUE
   * --------------------------------------------------- */

  // Complete Dashboard 6 Data
  @Get('performance-general/metrics')
  async getDashboard6Data(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
  }

  // Metrics Only
  @Get('performance-general1')
  async getDashboard6Metrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { metrics } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return metrics;
  }

  // Torque Speed Characteristics Chart
  @Get('performance-general/torque-speed-characteristics')
  async getTorqueVsRunningTimeChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.engineTorqueVsRunningTime || [];
  }

  // Torque Fuel Relationship Chart
  @Get('performance-general/torque-fuel-relationship')
  async getFuelRateVsTorqueChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.fuelRateVsTorque || [];
  }

  // Generator Oscillation Chart
  @Get('performance-general/generator-oscillation')
  async getTorqueGeneratorOscillationChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.oscillationIndex || [];
  }

  // RPM Stability Chart
  @Get('performance-general/rpm-stability')
  async getAverageEngineSpeedChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.rpmStabilityIndex || [];
  }

  // Output Efficiency Chart
  @Get('performance-general/output-efficiency')
  async getGensetPowerFactorChart(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.gensetPowerFactor || [];
  }

  // Multi-dimensional Stress Chart
  @Get('performance-general/multi-dimensional-stress')
  async getMultiDimensionalStress(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.mechanicalStress || [];
  }

  // Load Impact on Speed Chart
  @Get('performance-load/load-impact-speed')
  async getRPMStabilityIndex(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.rpmStabilityIndex || [];
  }

  // Oscillation Behavior Chart
  @Get('performance-load/oscillation-behavior')
  async getOscillationIndex(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.oscillationIndex || [];
  }

  // Fuel Demand vs Load Chart
  @Get('performance-load/fuel-demand-load')
  async getFuelConsumption(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.fuelConsumption || [];
  }

  // Efficiency Under Load Chart
  @Get('performance-load/efficiency-under-load')
  async getEfficiencyUnderLoad(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.loadPercent || [];
  }

  // Torque Response to Load Chart
  @Get('performance-load/torque-response-load')
  async getTorqueResponseLoad(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const { charts } = await this.dashboardService.getDashboardData(
      'dashboard6',
      mode,
      start,
      end,
    );
    return charts.torqueResponseLoad || [];
  }

  /** ---------------------------------------------------
   *  BATCH ENDPOINTS - Multiple Dashboards in Single Call
   * --------------------------------------------------- */

  // Get Multiple Specific Dashboards
  @Get('batch')
  async getMultipleDashboards(
    @Query('dashboards') dashboards: string, // comma separated: 'dashboard1,dashboard2,dashboard3'
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const dashboardList = dashboards.split(',');
    return this.dashboardService.getMultipleDashboards(
      dashboardList,
      mode,
      start,
      end,
    );
  }

  // Get All Dashboards in Single Call
  @Get('all')
  async getAllDashboards(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const allDashboards = [
      'dashboard1',
      'dashboard2',
      'dashboard3',
      'dashboard4',
      'dashboard5',
      'dashboard6',
    ];
    return this.dashboardService.getMultipleDashboards(
      allDashboards,
      mode,
      start,
      end,
    );
  }

  /** ---------------------------------------------------
   *  HEALTH CHECK & CACHE STATUS
   * --------------------------------------------------- */

  @Get('health')
  // eslint-disable-next-line @typescript-eslint/require-await
  async getHealthStatus() {
    return {
      status: 'healthy',
      service: 'Optimized Dashboard Service',
      timestamp: new Date().toISOString(),
      features: ['caching', 'batch-processing', 'aggregation-pipelines'],
    };
  }

  @Get('performance-general')
  async getConsumptionMetrics(
    @Query('mode') mode: 'live' | 'historic' | 'range' = 'live',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.dashboardService.getConsumptionMetrics(mode, start, end);
  }
}
