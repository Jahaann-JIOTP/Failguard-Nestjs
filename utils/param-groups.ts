// utils/params.ts

export const params = [
  // Power
  'Genset_L1_kW',
  'Genset_L2_kW',
  'Genset_L3_kW',
  'Genset_Total_kW',
  'Genset_L1_kVA',
  'Genset_L2_kVA',
  'Genset_L3_kVA',
  'Genset_Total_kVA',

  // Current
  'Genset_L1_Current',
  'Genset_L2_Current',
  'Genset_L3_Current',
  'Genset_Avg_Current',

  // Voltage
  'Genset_L1L2_Voltage',
  'Genset_L2L3_Voltage',
  'Genset_L3L1_Voltage',
  'Genset_L1N_Voltage',
  'Genset_L2N_Voltage',
  'Genset_L3N_Voltage',
  'Genset_LL_Avg_Voltage',
  'Genset_LN_Avg_Voltage',

  // Power Factor
  'Genset_L1_Power_Factor_PC2X',
  'Genset_L2_Power_Factor_PC2X',
  'Genset_L3_Power_Factor_PC2X',
  'Genset_Total_Power_Factor_calculated',

  // Fuel & Engine
  'Total_Fuel_Consumption_calculated',
  'Averagr_Engine_Speed',
  'Percent_Engine_Torque_or_Duty_Cycle',
  'Fuel_Outlet_Pressure_calculated',
  'Barometric_Absolute_Pressure',
  'Engine_Running_Time_calculated',
  'Fuel_Rate',

  // Temperature & Pressure
  'Oil_Pressure',
  'Boost_Pressure',
  'Oil_TemperatureC',
  'Coolant_TemperatureC',
  'Intake_Manifold_Temperature_calculated',

  // Battery
  'Nominal_Battery_Voltage',
  'Battery_Voltage_calculated',
  'Base_Frequency_calculated',
  'V_Hz_Rolloff_Slope',
  'V_Hz_Knee_Frequency',
  'Genset_Frequency_OP_calculated',
  'Genset_Application_Nominal_Current_PC2X',
  'Genset_Standby_Nominal_Current_PC2X',
  'Genset_Standby_kW_Rating_PC2X',
  'Genset_Application_kW_Rating_PC2X',
  'Genset_Standby_kVA_Rating_PC2X',
  'Genset_Application_kVA_Rating_PC2X',

  // --- 🧮 Calculated (Formulas) ---
  'Load_Percent',
  'Current_Imbalance',
  'Voltage_Imbalance',
  'Power_Loss_Factor',
  'Thermal_Stress',
  'Neutral_Current',
  'Load_Stress',
  'Cooling_Margin',
  // 'Cooling_Margin_C',
  'Thermal_Stress',
  // 'Thermal_Stress_C',
  'OTSR',
  // 'OTSR_C',
  'Lubrication_Risk_Index',
  'Air_Fuel_Effectiveness',
  'Specific_Fuel_Consumption',
  'Heat_Rate',
  'Fuel_Flow_Change',
  'Mechanical_Stress',
  'RPM_Stability_Index',
  'Oscillation_Index',
  'Fuel_Consumption',
];
