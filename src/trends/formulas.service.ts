/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';

@Injectable()
export class FormulasService {
  /** -------------------
   * Utility Functions
   * ------------------- */

  formatTimeForResponse(time: Date): string {
    const date = new Date(time);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  calculateOnDuration(data: any[]): number {
    if (data.length < 2) return 0;
    let duration = 0;
    for (let i = 1; i < data.length; i++) {
      duration +=
        (new Date(data[i].timestamp).getTime() -
          new Date(data[i - 1].timestamp).getTime()) /
        60000;
    }
    return +duration.toFixed(2);
  }

  /** -------------------
   * Dashboard 1 Formulas
   * ------------------- */

  calculateLoad(doc: any): number {
    return doc.Genset_Application_kW_Rating_PC2X
      ? (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) * 100
      : 0;
  }

  // public calculateRunningHours(data: any[]): number {
  //   if (data.length < 2) return 0;

  //   let runningMinutes = 0;

  //   for (let i = 1; i < data.length; i++) {
  //     const prev = data[i - 1];
  //     const curr = data[i];

  //     // Check if generator was running in the previous record
  //     const wasRunning = prev.Genset_Run_SS && prev.Genset_Run_SS > 0;

  //     if (wasRunning) {
  //       const prevTime = new Date(prev.timestamp).getTime();
  //       const currTime = new Date(curr.timestamp).getTime();

  //       if (!isNaN(prevTime) && !isNaN(currTime)) {
  //         runningMinutes += (currTime - prevTime) / 60000; // convert ms → minutes
  //       }
  //     }
  //   }

  //   return +(runningMinutes / 60).toFixed(2); // convert minutes → hours
  // }

  /** -------------------
   * CORRECT: Running Hours Calculation using Engine_Running_Time_calculated
   * ------------------- */
  private calculateRunningHours(data: any[]): number {
    if (data.length === 0) return 0;

    // Method 1: Use the MAXIMUM running hours value from Engine_Running_Time_calculated
    const runningHoursValues = data
      .map((d) => d.Engine_Running_Time_calculated)
      .filter(
        (val) => val !== undefined && val !== null && !isNaN(val) && val > 0,
      );

    if (runningHoursValues.length > 0) {
      const maxRunningHours = Math.max(...runningHoursValues);
      // console.log(
      //   `Running hours - Using Engine_Running_Time_calculated: ${maxRunningHours} hours (from ${runningHoursValues.length} valid records)`,
      // );
      return +maxRunningHours.toFixed(2);
    }

    // Method 2: Fallback - Calculate total time span when genset was ON
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
    // console.log(
    //   `Running hours - Calculated from timestamps: ${runningHours} hours`,
    // );
    return +runningHours.toFixed(2);
  }

  /** -------------------
   * Dashboard 2 Formulas
   * ------------------- */

  calculateCurrentImbalance(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;
    const avgCurrent = (IA + IB + IC) / 3 || 1;
    return +(
      ((Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / avgCurrent) *
      100
    ).toFixed(2);
  }

  calculateVoltageImbalance(doc: any): number {
    const VL1 = doc.Genset_L1L2_Voltage || 0;
    const VL2 = doc.Genset_L2L3_Voltage || 0;
    const VL3 = doc.Genset_L3L1_Voltage || 0;
    const vAvg = (VL1 + VL2 + VL3) / 3 || 1;
    return +(
      ((Math.max(VL1, VL2, VL3) - Math.min(VL1, VL2, VL3)) / vAvg) *
      100
    ).toFixed(2);
  }

  calculatePowerLossFactor(doc: any): number {
    const pf = doc.Genset_Total_Power_Factor_calculated || 1;
    return +(1 / (pf * pf)).toFixed(2);
  }

  calculateThermalStress(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;
    const I2 = Math.sqrt((IA ** 2 + IB ** 2 + IC ** 2) / 3);
    return +I2.toFixed(2);
  }

  calculateNeutralCurrent(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;
    return +Math.sqrt(
      IA ** 2 + IB ** 2 + IC ** 2 - IA * IB - IB * IC - IC * IA,
    ).toFixed(2);
  }

  calculateLoadPercent(doc: any): number {
    if (!doc.Genset_Total_kW || !doc.Genset_Application_kW_Rating_PC2X) {
      return 0;
    }
    return +(
      (doc.Genset_Total_kW / doc.Genset_Application_kW_Rating_PC2X) *
      100
    ).toFixed(2);
  }

  // calculateLoadPercent1(doc: any): number {
  //   if (!doc.Genset_Total_KVA || !doc.Genset_Application_kVA_Rating_PC2X) {
  //     return 0;
  //   }
  //   return +(
  //     doc.Genset_Total_KVA / doc.Genset_Application_kVA_Rating_PC2X
  //   ).toFixed(2);
  // }

  // calculateLoadStress(doc: any): number {
  //   const loadPercent = this.calculateLoadPercent1(doc);
  //   const pf = doc.Genset_Total_Power_Factor_calculated || 1;

  //   return +(loadPercent * 1) / pf;
  // }

  // ✅ CORRECTED: Proper field checking with fallbacks
  calculateLoadStress(doc: any): number {
    // console.log('=== Load Stress Detailed Debug ===');

    // Check multiple field variations with proper fallbacks
    const kva = doc.Genset_Total_KVA || doc.Genset_Total_kVA || 0;
    const rating = doc.Genset_Application_kVA_Rating_PC2X || 0;
    const pf = doc.Genset_Total_Power_Factor_calculated || 1;

    // console.log('Raw values - KVA:', kva, 'Rating:', rating, 'PF:', pf);

    // If KVA or rating is zero/missing, use fallback calculation
    if (!kva || !rating || kva === 0 || rating === 0) {
      // console.log('Using fallback calculation with KW values');

      // Fallback to KW-based calculation
      const totalKW = doc.Genset_Total_kW || 0;
      const ratingKW = doc.Genset_Application_kW_Rating_PC2X || 1;

      const loadPercent = ratingKW > 0 ? totalKW / ratingKW : 0;
      const result = +(loadPercent / pf).toFixed(4);

      // console.log('Fallback result:', {
      //   totalKW,
      //   ratingKW,
      //   loadPercent,
      //   result,
      // });
      return result;
    }

    // Normal KVA-based calculation
    const loadPercent = kva / rating;
    const result = +(loadPercent / pf).toFixed(4);

    // console.log('KVA-based result:', { kva, rating, loadPercent, result });
    return result;
  }

  // ✅ SIMPLIFIED: Better load percent calculation
  calculateLoadPercent1(doc: any): number {
    // Try KVA first
    const kva = doc.Genset_Total_KVA || doc.Genset_Total_kVA || 0;
    const kvaRating = doc.Genset_Application_kVA_Rating_PC2X || 0;

    if (kva && kvaRating && kvaRating > 0) {
      return +(kva / kvaRating).toFixed(4);
    }

    // Fallback to KW
    const kw = doc.Genset_Total_kW || 0;
    const kwRating = doc.Genset_Application_kW_Rating_PC2X || 1;

    return +(kw / kwRating).toFixed(4);
  }

  /** -------------------
   * Dashboard 3 Formulas
   * ------------------- */

  calculateCoolingMarginF(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    const value = 212;
    return +(value - coolant).toFixed(2);
  }

  // calculateCoolingMarginC(doc: any): number {
  //   const coolant = this.convertCoolantToCelsius(doc);
  //   return +(100 - (coolant - 32) * 0.5).toFixed(2);
  // }

  calculateCoolingMarginC(doc: any): number {
    const coolant = this.convertCoolantToCelsius(doc);
    return +(102 - coolant).toFixed(2);
  }

  calculateThermalStressF(doc: any): number {
    const coolant = doc.Coolant_Temperature ?? 0;
    const min = 194;
    const max = 212;
    const stress = (coolant - min) / (max - min);
    return +stress.toFixed(2);
  }

  // Convert Fahrenheit to Celsius
  public fahrenheitToCelsius(fahrenheit: number): number {
    return +(((fahrenheit - 32) * 5) / 9).toFixed(2);
  }

  // Convert Coolant Temperature to Celsius
  convertCoolantToCelsius(doc: any): number {
    const coolantF = doc.Coolant_Temperature;
    return this.fahrenheitToCelsius(coolantF);
  }
  convertIntakeToCelsius(doc: any): number {
    const intakeF = doc.Intake_Manifold_Temperature_calculated;
    return this.fahrenheitToCelsius(intakeF);
  }

  // Convert Oil Temperature to Celsius
  convertOilTempToCelsius(doc: any): number {
    const oilF = doc.Oil_Temperature;
    return this.fahrenheitToCelsius(oilF);
  }

  calculateThermalStressC(doc: any): number {
    const coolant = this.convertCoolantToCelsius(doc) ?? 0;
    const tnom = 90;
    const tsafe = 102;
    const stress = (coolant - tnom) / (tsafe - tnom);
    return +stress.toFixed(2);
  }

  calculateOTSRF(doc: any): number {
    const temp = doc.Oil_Temperature ?? 0;
    const min = 200;
    const max = 257;
    const OTSRF = (max - temp) / (max - min);
    return +OTSRF.toFixed(2);
  }

  calculateOTSRC(doc: any): number {
    const temp = this.convertOilTempToCelsius(doc) ?? 0;
    const tnom = 90;
    const maxsafe = 125;
    const OTSRC = (maxsafe - temp) / (maxsafe - tnom);
    return +OTSRC.toFixed(2);
  }

  calculateAvgLLVoltage(doc: any): number {
    const VL1 = doc.Genset_L1L2_Voltage || 0;
    const VL2 = doc.Genset_L2L3_Voltage || 0;
    const VL3 = doc.Genset_L3L1_Voltage || 0;
    return +((VL1 + VL2 + VL3) / 3).toFixed(2);
  }

  /** -------------------
   * Dashboard 4 Formulas
   * ------------------- */

  // calculateLubricationRiskIndex(doc: any): number {
  //   const oilPressure = doc.Oil_Pressure ?? 0;
  //   const oilTemp = doc.Oil_Temperature ?? 0;
  //   return oilTemp !== 0 ? +(oilPressure / oilTemp).toFixed(2) : 0;
  // }

  calculateLubricationRiskIndex(doc: any): number {
    const oilPressure = doc.Oil_Pressure ?? 0;
    const oilTemp = this.convertOilTempToCelsius(doc) ?? 0;

    // Constants (from your notebook)
    const Pmin = 30; // Minimum safe oil pressure
    const Tmax = 125; // Maximum safe oil temperature
    const Tnom = 90; // Minimum safe oil temperature

    const pressureFactor = Math.min(1, oilPressure / Pmin);

    const temperatureFactor = Math.max(0, (Tmax - oilTemp) / (Tmax - Tnom));

    return +(pressureFactor * temperatureFactor).toFixed(2);
  }

  /** -------------------
   * Dashboard 5 Formulas
   * ------------------- */

  calculateAirFuelEffectiveness(doc: any): number {
    const fuelRate = doc.Fuel_Rate ?? 0;
    const boostPressure = doc.Boost_Pressure ?? 0;
    return fuelRate !== 0 ? +(boostPressure / fuelRate).toFixed(2) : 0;
  }
  calculateFuelEfficiencyIndex(doc: any): number {
    const gensetTotalKW = doc.Genset_Total_kW ?? 0;
    const fuelRate = doc.Fuel_Rate ?? 0; // assumed in gallons/hour

    // Convert fuel rate from gallons to liters
    const fuelRateLiters = fuelRate * 3.7854;

    // Calculate FEI in kWh/L
    return fuelRateLiters !== 0
      ? +(gensetTotalKW / fuelRateLiters).toFixed(2)
      : 0;
  }

  calculateSpecificFuelConsumption(doc: any): number {
    const fuelRate = doc.Fuel_Rate ?? 0;
    const powerOutput = doc.Genset_Total_kW ?? 1;
    return powerOutput !== 0
      ? +((fuelRate * 3.7854) / powerOutput).toFixed(3)
      : 0;
  }

  calculateHeatRate(doc: any): number {
    const fuelRate = doc.Fuel_Rate ?? 0;
    const powerOutput = doc.Genset_Total_kW ?? 1;
    const CV = 36000;
    return powerOutput > 0
      ? +((fuelRate * 3.7854 * CV) / powerOutput).toFixed(3)
      : 0;
  }

  calculateFuelFlowRateChange(current: any, previous: any): number {
    const currentRate = current.Fuel_Rate ?? 0;
    const previousRate = previous?.Fuel_Rate ?? currentRate;
    return +(currentRate - previousRate).toFixed(3);
  }

  /** -------------------
   * Dashboard 6 Formulas
   * ------------------- */

  calculateRPMStabilityWithLoad(data: any[]): any[] {
    const window = 10;
    const results: any[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) continue;

      const slice = data.slice(i - window + 1, i + 1);
      const rpmValues = slice.map((d) => d.Averagr_Engine_Speed ?? 0);

      const avg = rpmValues.reduce((a, b) => a + b, 0) / rpmValues.length;
      const variance =
        rpmValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) /
        rpmValues.length;
      const stdDev = Math.sqrt(variance);
      const RSI = +(stdDev / (avg || 1)).toFixed(4);

      const currentLoadPercent = this.calculateLoadPercent(data[i]);
      const Averagr_Engine_Speed = data[i].Averagr_Engine_Speed ?? 0;

      results.push({
        time: data[i].timestamp,
        RPM_Stability_Index: RSI,
        Load_Percent: currentLoadPercent,
        Averagr_Engine_Speed: Averagr_Engine_Speed,
      });
    }

    return results;
  }

  calculateOscillationIndex(data: any[]): any[] {
    const window = 10;
    const results: any[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < window - 1) continue;

      const slice = data.slice(i - window + 1, i + 1);

      const P = slice.map((d) => d.Genset_Total_kW ?? 0);
      const S = slice.map((d) => d.Genset_Total_kVA ?? 0);

      const Q = S.map((s, idx) => {
        const p = P[idx];
        return s >= p ? Math.sqrt(s * s - p * p) : 0;
      });

      const meanP = P.reduce((a, b) => a + b, 0) / P.length;
      const meanQ = Q.reduce((a, b) => a + b, 0) / Q.length;

      const stdP = Math.sqrt(
        P.reduce((a, b) => a + Math.pow(b - meanP, 2), 0) / P.length,
      );
      const stdQ = Math.sqrt(
        Q.reduce((a, b) => a + Math.pow(b - meanQ, 2), 0) / Q.length,
      );

      const OI = +Math.sqrt(
        Math.pow(stdP / (meanP || 1), 2) + Math.pow(stdQ / (meanQ || 1), 2),
      ).toFixed(4);

      const currentLoadPercent = this.calculateLoadPercent(data[i]);

      results.push({
        time: data[i].timestamp,
        Oscillation_Index: OI,
        Load_Percent: currentLoadPercent,
      });
    }

    return results;
  }

  calculateFuelConsumption(data: any[]): any[] {
    let cumulative = 0;
    const results: any[] = [];

    for (const d of data) {
      const fuelRate = d.Fuel_Rate ?? 0;
      const fuelUsed = +((fuelRate * 3) / 3600).toFixed(5);
      cumulative += fuelUsed;

      const currentLoadPercent = this.calculateLoadPercent(d);

      results.push({
        time: d.timestamp,
        Fuel_Used: fuelUsed,
        Fuel_Cumulative: +cumulative.toFixed(5),
        Load_Percent: currentLoadPercent,
      });
    }

    return results;
  }

  // calculateMechanicalStress(doc: any): number {
  //   const avg = doc.Averagr_Engine_Speed ?? 0;
  //   return +((avg - 1500) / 1500).toFixed(3);
  // }

  private lastTorque: number | null = null;

  calculateMechanicalStress(doc: any): number {
    const engineSpeed = doc.Averagr_Engine_Speed;
    const torque = doc.Percent_Engine_Torque_or_Duty_Cycle;

    // ---------- C1 ----------
    const C1 = Math.abs(engineSpeed - 1500) / 1500;

    // ---------- C2 ----------
    const C2 = torque / 100;

    // ---------- C3 (Derived ΔT from torque samples) ----------
    let deltaT = 0;

    if (this.lastTorque !== null) {
      deltaT = Math.abs(torque - this.lastTorque);
    }

    this.lastTorque = torque; // store for next cycle

    const deltaTMax = 20;
    const C3 = deltaT / deltaTMax;

    // ---------- MSI ----------
    const MSI = 0.2 * C1 + 0.5 * C2 + 0.3 * C3;

    return +MSI.toFixed(3);
  }

  // calculateElectricalStress(doc: any): number {
  //   // Voltage Unbalance (VU)
  //   const VL1 = doc.Genset_L1L2_Voltage ?? 0;
  //   const VL2 = doc.Genset_L2L3_Voltage ?? 0;
  //   const VL3 = doc.Genset_L3L1_Voltage ?? 0;
  //   const Vavg = (VL1 + VL2 + VL3) / 3 || 1;
  //   const VmaxDev =
  //     (Math.max(
  //       Math.abs(VL1 - Vavg),
  //       Math.abs(VL2 - Vavg),
  //       Math.abs(VL3 - Vavg),
  //     ) /
  //       Vavg) *
  //     100;
  //   const VU = Math.min(1, VmaxDev / 2); // 2% typical limit

  //   // Current Unbalance (CU)
  //   const IA = doc.Genset_L1_Current ?? 0;
  //   const IB = doc.Genset_L2_Current ?? 0;
  //   const IC = doc.Genset_L3_Current ?? 0;
  //   const Iavg = (IA + IB + IC) / 3 || 1;
  //   const ImaxDev =
  //     (Math.max(Math.abs(IA - Iavg), Math.abs(IB - Iavg), Math.abs(IC - Iavg)) /
  //       Iavg) *
  //     100;
  //   const CU = Math.min(1, ImaxDev / 10); // 10% typical limit

  //   // Overload Index (OL)
  //   const Inom = doc.Genset_Application_Nominal_Current_PC2X ?? 1;
  //   const IpuA = IA / Inom;
  //   const IpuB = IB / Inom;
  //   const IpuC = IC / Inom;
  //   const OL = Math.min(1, Math.max(IpuA, IpuB, IpuC) - 1);

  //   // Power Factor Index (PFI)
  //   const pf = doc.Genset_Total_Power_Factor_calculated ?? 1;
  //   const pf_nom = 0.8; // datasheet value
  //   const PFI = Math.min(1, (pf_nom - pf) / 0.1);

  //   // Frequency Index (FI)
  //   const freq = doc.Genset_Frequency ?? 50;
  //   const deltaF = Math.abs(freq - 50);
  //   const FI = Math.min(1, (deltaF * 100) / 50);

  //   // Torque Index (TI)
  //   const torquePct = doc.Percent_Engine_Torque_or_Duty_Cycle ?? 0; // 0–100
  //   const TI = Math.min(1, torquePct / 100);

  //   // Weighted Electrical Stress Index
  //   const ESI =
  //     0.2 * VU + 0.2 * CU + 0.25 * OL + 0.15 * PFI + 0.1 * FI + 0.1 * TI;
  //   const ESI_percent = +(ESI * 100).toFixed(2);

  //   return ESI_percent;
  // }

  calculateElectricalStress(doc: any): number {
    // Extract currents
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;

    // Current Imbalance
    const Iavg = (IA + IB + IC) / 3 || 1;
    const Iunb = (Math.max(IA, IB, IC) - Math.min(IA, IB, IC)) / Iavg;

    // Extract voltages
    const VAN = doc.Genset_L1N_Voltage || 0;
    const VBN = doc.Genset_L2N_Voltage || 0;
    const VCN = doc.Genset_L3N_Voltage || 0;

    // Voltage Imbalance
    const Vavg = (VAN + VBN + VCN) / 3 || 1;
    const Vunb = (Math.max(VAN, VBN, VCN) - Math.min(VAN, VBN, VCN)) / Vavg;

    // Total Power
    const P1 = doc.Genset_1_KW || 0;
    const P2 = doc.Genset_2_KW || 0;
    const P3 = doc.Genset_3_KW || 0;
    const Ptotal = P1 + P2 + P3;

    const Prated = doc.Genset_Rated_KW || 400; // fallback 400 kW

    // Electrical Stress Index
    const ESI = 0.5 * (Ptotal / Prated) + 0.25 * Vunb + 0.25 * Iunb;

    return +ESI.toFixed(3); // return value 0–1
  }

  calculateThermalEfficiency(doc: any): number {
    const fuelRate = doc.Fuel_Rate ?? 0; // gallons per hour
    const gensetPower = doc.Genset_Total_kW ?? 0;

    // Fuel energy in kW
    const fuelEnergy_kW = (fuelRate * 3.7854 * 0.85 * 43000) / 3600;

    // Thermal efficiency (%)
    const thermalEff =
      fuelEnergy_kW > 0 ? (gensetPower / fuelEnergy_kW) * 100 : 0;

    return +thermalEff.toFixed(2);
  }

  // calculateEnergy(data: any[] | any): any[] {
  //   const dataArray = Array.isArray(data) ? data : [data]; // wrap single object in array
  //   let cumulative = 0;

  //   return dataArray.map((d) => {
  //     const energy = +(d.Genset_Total_kW * 308).toFixed(6);
  //     cumulative += energy;
  //     return {
  //       ...d,
  //       Energy_kWh: energy,
  //       Cumulative_Energy_kWh: +cumulative.toFixed(6),
  //     };
  //   });
  // }

  calculateEnergy(data: any[] | any): any[] {
    const dataArray = Array.isArray(data) ? data : [data]; // ensure array
    let cumulative = 0;

    return dataArray.map((d) => {
      // Energy per record = Genset_Total_kW × 308
      const energy = +(d.Genset_Total_kW * 0.000833).toFixed(6);

      // Cumulative energy over the interval
      cumulative += energy;

      return {
        ...d,
        Energy_kWh: energy,
        Cumulative_Energy_kWh: +cumulative.toFixed(6),
        Production_kWh: +cumulative.toFixed(2), // interval production
      };
    });
  }

  calculateL1LoadSharing(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;

    const total = IA + IB + IC || 1;
    return +((IA / total) * 100).toFixed(2);
  }

  calculateL2LoadSharing(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;

    const total = IA + IB + IC || 1;
    return +((IB / total) * 100).toFixed(2);
  }

  calculateL3LoadSharing(doc: any): number {
    const IA = doc.Genset_L1_Current || 0;
    const IB = doc.Genset_L2_Current || 0;
    const IC = doc.Genset_L3_Current || 0;

    const total = IA + IB + IC || 1;
    return +((IC / total) * 100).toFixed(2);
  }

  calculateFrequencyDeviation(doc: any): number {
    const ft = doc.Genset_Frequency_OP_calculated ?? 0; // current frequency
    const fn = 50; // nominal frequency (Pakistan standard)

    const deviation = ft - fn;

    return +deviation.toFixed(2); // Hz
  }

  calculateFrequencyDeviationAbs(doc: any): number {
    const ft = doc.Genset_Frequency_OP_calculated ?? 0;
    const fn = 50;
    return +Math.abs(ft - fn).toFixed(2);
  }
}
