// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from 'src/trends/formulas.service';

// @Injectable()
// export class ReportsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('navy');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   private formatTimestamp(value: any): string {
//     if (!value) return '';
//     const date = new Date(value);
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const seconds = date.getSeconds().toString().padStart(2, '0');
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   }

//   private toISOStringString(dateStr: string) {
//     return new Date(dateStr).toISOString();
//   }

//   async getFuelReport(payload: {
//     startDate: string;
//     endDate: string;
//     fuelCostPerLitre: number;
//   }) {
//     const { startDate, endDate, fuelCostPerLitre } = payload;

//     if (!startDate || !endDate)
//       throw new Error('startDate and endDate are required');

//     // 🔹 Detect timestamp type
//     const sampleDoc = await this.collection.findOne(
//       {},
//       { projection: { timestamp: 1 } },
//     );
//     const isTimestampString =
//       sampleDoc && typeof sampleDoc.timestamp === 'string';

//     // 🔹 Query only within date range
//     const query = isTimestampString
//       ? {
//           timestamp: {
//             $gte: this.toISOStringString(startDate),
//             $lte: this.toISOStringString(endDate),
//           },
//         }
//       : {
//           timestamp: {
//             $gte: new Date(startDate),
//             $lte: new Date(endDate),
//           },
//         };

//     const projection = {
//       timestamp: 1,
//       Fuel_Rate: 1,
//       Genset_Total_kW: 1,
//       Genset_Application_kW_Rating_PC2X: 1,
//       Genset_Run_SS: 1,
//     };

//     const docs = await this.collection
//       .find(query, { projection })
//       .sort({ timestamp: 1 })
//       .toArray();

//     if (!docs.length) {
//       return [
//         {
//           Duration: '0 mins (0.00 hr)',
//           Fuel_Consumed: '0.00 Ltrs',
//           Production: '0.00 kWh',
//           Cost: '0',
//           TotalCost: '0',
//         },
//       ];
//     }

//     // 🔹 Format timestamps
//     const data = docs.map((d) => ({
//       ...d,
//       timestamp: this.formatTimestamp(d.timestamp),
//     }));

//     // 🔹 Compute fuel per record
//     const fuelData = this.formulasService.calculateFuelConsumption(data);

//     // 🔹 Merge fuel data with genset info
//     const merged = fuelData.map((f, i) => ({
//       ...f,
//       Genset_Total_kW: data[i]?.Genset_Total_kW ?? 0,
//       Genset_Run_SS: data[i]?.Genset_Run_SS ?? 0,
//     }));

//     // 🔹 Detect ON–OFF intervals
//     const intervals: any[] = [];
//     let currentInterval: any[] = [];

//     for (const record of merged) {
//       if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
//         currentInterval.push(record);
//       } else if (currentInterval.length > 0) {
//         intervals.push(currentInterval);
//         currentInterval = [];
//       }
//     }
//     if (currentInterval.length > 0) intervals.push(currentInterval);

//     // 🔹 Calculate per-interval data
//     const reportRows: any[] = [];
//     let totalFuel = 0;
//     let totalProduction = 0;
//     let totalCost = 0;

//     for (const interval of intervals) {
//       const start = interval[0].time;
//       const end = interval[interval.length - 1].time;

//       const startDateObj = new Date(start);
//       const endDateObj = new Date(end);

//       const durationMins =
//         (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
//       const runHours = +(durationMins / 60).toFixed(2);

//       const fuelConsumed = +interval
//         .reduce((sum, r) => sum + (r.Fuel_Used ?? 0), 0)
//         .toFixed(2);

//       const avgKW =
//         interval.reduce((sum, r) => sum + (r.Genset_Total_kW ?? 0), 0) /
//         (interval.length || 1);

//       const production = +(avgKW * runHours).toFixed(2);
//       const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
//       const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//       totalFuel += fuelConsumed;
//       totalProduction += production;
//       totalCost += cost;

//       // Format interval time like “03:00–03:30”
//       const formatTime = (d: Date) =>
//         `${d.getUTCHours().toString().padStart(2, '0')}:${d
//           .getUTCMinutes()
//           .toString()
//           .padStart(2, '0')}`;

//       reportRows.push({
//         Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
//         Run_Hours: runHours,
//         Fuel_Consumed: `${fuelConsumed} Ltrs`,
//         Production: `${production} kWh`,
//         Cost: cost,
//         CostPerUnit: costPerUnit,
//         TotalCost: cost,
//       });
//     }

//     // 🔹 Totals row
//     // reportRows.push({
//     //   Duration: 'TOTAL',
//     //   Fuel_Consumed: `${totalFuel.toFixed(2)} Ltrs`,
//     //   Production: `${totalProduction.toFixed(2)} kWh`,
//     //   Cost: totalCost.toFixed(0),
//     //   TotalCost: totalCost.toFixed(0),
//     // });

//     return reportRows;
//   }
// }

// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from 'src/trends/formulas.service';

// @Injectable()
// export class ReportsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('navy');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   private formatTimestamp(value: any): string {
//     if (!value) return '';
//     const date = new Date(value);
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const seconds = date.getSeconds().toString().padStart(2, '0');
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   }

//   private toISOStringString(dateStr: string) {
//     return new Date(dateStr).toISOString();
//   }

//   async getFuelReport(payload: {
//     startDate: string;
//     endDate: string;
//     fuelCostPerLitre: number;
//   }) {
//     const { startDate, endDate, fuelCostPerLitre } = payload;

//     if (!startDate || !endDate)
//       throw new Error('startDate and endDate are required');

//     const sampleDoc = await this.collection.findOne(
//       {},
//       { projection: { timestamp: 1 } },
//     );
//     const isTimestampString =
//       sampleDoc && typeof sampleDoc.timestamp === 'string';

//     // 🔹 Generate all dates between start and end
//     const days: string[] = [];
//     let current = new Date(startDate);
//     const end = new Date(endDate);
//     while (current <= end) {
//       days.push(current.toISOString().split('T')[0]);
//       current.setDate(current.getDate() + 1);
//     }

//     const allRows: any[] = [];

//     for (const day of days) {
//       const dayStart = new Date(`${day}T00:00:00Z`);
//       const dayEnd = new Date(`${day}T23:59:59Z`);

//       const query = isTimestampString
//         ? {
//             timestamp: {
//               $gte: dayStart.toISOString(),
//               $lte: dayEnd.toISOString(),
//             },
//           }
//         : { timestamp: { $gte: dayStart, $lte: dayEnd } };

//       const docs = await this.collection
//         .find(query, {
//           projection: {
//             timestamp: 1,
//             Fuel_Rate: 1,
//             Genset_Total_kW: 1,
//             Genset_Application_kW_Rating_PC2X: 1,
//             Genset_Run_SS: 1,
//           },
//         })
//         .sort({ timestamp: 1 })
//         .toArray();

//       if (!docs.length) continue; // skip empty days

//       const data = docs.map((d) => ({
//         ...d,
//         timestamp: this.formatTimestamp(d.timestamp),
//       }));

//       const fuelData = this.formulasService.calculateFuelConsumption(data);

//       const merged = fuelData.map((f, i) => ({
//         ...f,
//         Genset_Total_kW: data[i]?.Genset_Total_kW ?? 0,
//         Genset_Run_SS: data[i]?.Genset_Run_SS ?? 0,
//         time: data[i]?.timestamp,
//       }));

//       const dailyRows = this.processIntervals(merged, fuelCostPerLitre, day);

//       allRows.push(...dailyRows);
//     }

//     return allRows.length
//       ? allRows
//       : [{ message: 'No data found for selected dates' }];
//   }

//   // 🔹 Helper: process ON/OFF intervals and calculate results
//   private processIntervals(
//     merged: any[],
//     fuelCostPerLitre: number,
//     date: string,
//   ) {
//     const intervals: any[] = [];
//     let currentInterval: any[] = [];

//     for (const record of merged) {
//       if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
//         currentInterval.push(record);
//       } else if (currentInterval.length > 0) {
//         intervals.push(currentInterval);
//         currentInterval = [];
//       }
//     }
//     if (currentInterval.length > 0) intervals.push(currentInterval);

//     const rows: any[] = [];
//     let totalFuel = 0;
//     let totalProduction = 0;
//     let totalCost = 0;

//     for (const interval of intervals) {
//       const start = interval[0].time;
//       const end = interval[interval.length - 1].time;

//       const startDateObj = new Date(start);
//       const endDateObj = new Date(end);

//       const durationMins =
//         (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
//       const runHours = +(durationMins / 60).toFixed(2);

//       const fuelConsumed = +interval
//         .reduce((sum, r) => sum + (r.Fuel_Used ?? 0), 0)
//         .toFixed(2);

//       const avgKW =
//         interval.reduce((sum, r) => sum + (r.Genset_Total_kW ?? 0), 0) /
//         (interval.length || 1);

//       const production = +(avgKW * runHours).toFixed(2);
//       const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
//       const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//       totalFuel += fuelConsumed;
//       totalProduction += production;
//       totalCost += cost;

//       const formatTime = (d: Date) =>
//         `${d.getHours().toString().padStart(2, '0')}:${d
//           .getMinutes()
//           .toString()
//           .padStart(2, '0')}`;

//       rows.push({
//         Date: date,
//         Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
//         Run_Hours: runHours,
//         Fuel_Consumed: `${fuelConsumed} Ltrs`,
//         Production: `${production} kWh`,
//         Cost: cost,
//         CostPerUnit: costPerUnit,
//         TotalCost: cost,
//       });
//     }

//     return rows;
//   }
// }

// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
// import { FormulasService } from 'src/trends/formulas.service';

// @Injectable()
// export class ReportsService {
//   private collection;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulasService: FormulasService,
//   ) {
//     this.collection = this.db.collection('historical_navy');
//     this.collection.createIndex({ timestamp: 1 });
//   }

//   private formatTimestamp(value: any): string {
//     if (!value) return '';
//     const date = new Date(value);
//     const year = date.getFullYear();
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     const seconds = date.getSeconds().toString().padStart(2, '0');
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   }

//   private toISOStringString(dateStr: string) {
//     return new Date(dateStr).toISOString();
//   }

//   async getFuelReport(payload: {
//     startDate: string;
//     endDate: string;
//     fuelCostPerLitre: number;
//   }) {
//     const { startDate, endDate, fuelCostPerLitre } = payload;

//     if (!startDate || !endDate)
//       throw new Error('startDate and endDate are required');

//     const sampleDoc = await this.collection.findOne(
//       {},
//       { projection: { timestamp: 1 } },
//     );
//     const isTimestampString =
//       sampleDoc && typeof sampleDoc.timestamp === 'string';

//     // 🔹 Generate all dates between start and end
//     const days: string[] = [];
//     let current = new Date(startDate);
//     const end = new Date(endDate);
//     while (current <= end) {
//       days.push(current.toISOString().split('T')[0]);
//       current.setDate(current.getDate() + 1);
//     }

//     const allRows: any[] = [];

//     for (const day of days) {
//       const dayStart = new Date(`${day}T00:00:00Z`);
//       const dayEnd = new Date(`${day}T23:59:59Z`);

//       const query = isTimestampString
//         ? {
//             timestamp: {
//               $gte: dayStart.toISOString(),
//               $lte: dayEnd.toISOString(),
//             },
//           }
//         : { timestamp: { $gte: dayStart, $lte: dayEnd } };

//       const docs = await this.collection
//         .find(query, {
//           projection: {
//             timestamp: 1,
//             Fuel_Rate: 1,
//             Genset_Total_kW: 1,
//             Genset_Application_kW_Rating_PC2X: 1,
//             Genset_Run_SS: 1,
//           },
//         })
//         .sort({ timestamp: 1 })
//         .toArray();

//       if (!docs.length) continue; // skip empty days

//       const data = docs.map((d) => ({
//         ...d,
//         timestamp: this.formatTimestamp(d.timestamp),
//       }));

//       const fuelData = this.formulasService.calculateFuelConsumption(data);

//       // 🔹 Add Load_Percent here using formulasService
//       const merged = fuelData.map((f, i) => {
//         const doc = data[i];
//         const loadPercent = this.formulasService.calculateLoadPercent(doc);
//         return {
//           ...f,
//           Genset_Total_kW: doc?.Genset_Total_kW ?? 0,
//           Genset_Run_SS: doc?.Genset_Run_SS ?? 0,
//           Load_Percent: loadPercent,
//           time: doc?.timestamp,
//         };
//       });

//       const dailyRows = this.processIntervals(merged, fuelCostPerLitre, day);

//       allRows.push(...dailyRows);
//     }

//     return allRows.length
//       ? allRows
//       : [{ message: 'No data found for selected dates' }];
//   }

//   // 🔹 Helper: process ON/OFF intervals and calculate results
//   // private processIntervals(
//   //   merged: any[],
//   //   fuelCostPerLitre: number,
//   //   date: string,
//   // ) {
//   //   const intervals: any[] = [];
//   //   let currentInterval: any[] = [];

//   //   for (const record of merged) {
//   //     if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
//   //       currentInterval.push(record);
//   //     } else if (currentInterval.length > 0) {
//   //       intervals.push(currentInterval);
//   //       currentInterval = [];
//   //     }
//   //   }
//   //   if (currentInterval.length > 0) intervals.push(currentInterval);

//   //   const rows: any[] = [];

//   //   for (const interval of intervals) {
//   //     const start = interval[0].time;
//   //     const end = interval[interval.length - 1].time;

//   //     const startDateObj = new Date(start);
//   //     const endDateObj = new Date(end);

//   //     const durationMins =
//   //       (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
//   //     const runHours = +(durationMins / 60).toFixed(2);

//   //     const fuelConsumed = +interval
//   //       .reduce((sum, r) => sum + (r.Fuel_Used ?? 0), 0)
//   //       .toFixed(2);

//   //     const avgKW =
//   //       interval.reduce((sum, r) => sum + (r.Genset_Total_kW ?? 0), 0) /
//   //       (interval.length || 1);

//   //     const avgLoad =
//   //       interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
//   //       (interval.length || 1);

//   //     const production = +(avgKW * runHours).toFixed(2);
//   //     const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
//   //     const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//   //     const formatTime = (d: Date) =>
//   //       `${d.getHours().toString().padStart(2, '0')}:${d
//   //         .getMinutes()
//   //         .toString()
//   //         .padStart(2, '0')}`;

//   //     rows.push({
//   //       Date: date,
//   //       Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
//   //       Run_Hours: runHours,
//   //       Fuel_Consumed: `${fuelConsumed} Ltrs`,
//   //       Production: `${production} kWh`,
//   //       Load_Percent: +avgLoad.toFixed(2), // ✅ Added field here
//   //       Cost: cost,
//   //       CostPerUnit: costPerUnit,
//   //       TotalCost: cost,
//   //     });
//   //   }

//   //   return rows;
//   // }

//   private processIntervals(
//     merged: any[],
//     fuelCostPerLitre: number,
//     date: string,
//   ) {
//     const intervals: any[] = [];
//     let currentInterval: any[] = [];

//     for (const record of merged) {
//       if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
//         currentInterval.push(record);
//       } else if (currentInterval.length > 0) {
//         intervals.push(currentInterval);
//         currentInterval = [];
//       }
//     }

//     if (currentInterval.length > 0) {
//       intervals.push(currentInterval);
//     }

//     const rows: any[] = [];

//     for (const interval of intervals) {
//       const first = interval[0];
//       const last = interval[interval.length - 1];

//       const startDateObj = new Date(first.time);
//       const endDateObj = new Date(last.time);

//       // Run hours
//       const durationMins =
//         (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
//       const runHours = +(durationMins / 60).toFixed(2);

//       // ⭐ NEW FORMULA: Fuel = last - first from Total_Fuel_Consumption_calculated
//       const fuelConsumed = +(
//         (last.Total_Fuel_Consumption_calculated ?? 0) -
//         (first.Total_Fuel_Consumption_calculated ?? 0)
//       ).toFixed(2);

//       // ⭐ NEW FORMULA: Production = last - first from Engine_Running_Time_calculated
//       const production = +(
//         (last.Engine_Running_Time_calculated ?? 0) -
//         (first.Engine_Running_Time_calculated ?? 0)
//       ).toFixed(2);

//       // Avg Load
//       const avgLoad =
//         interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
//         (interval.length || 1);

//       // Cost
//       const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
//       const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//       const formatTime = (d: Date) =>
//         `${d.getHours().toString().padStart(2, '0')}:${d
//           .getMinutes()
//           .toString()
//           .padStart(2, '0')}`;

//       rows.push({
//         Date: date,
//         Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
//         Run_Hours: runHours,
//         Fuel_Consumed: `${fuelConsumed} Ltrs`,
//         Production: `${production} kWh`,
//         Load_Percent: +avgLoad.toFixed(2),
//         Cost: cost,
//         CostPerUnit: costPerUnit,
//         TotalCost: cost,
//       });
//     }

//     return rows;
//   }

//   // private processIntervals(
//   //   merged: any[],
//   //   fuelCostPerLitre: number,
//   //   date: string,
//   // ) {
//   //   const intervals: any[] = [];
//   //   let currentInterval: any[] = [];

//   //   // GROUP INTERVALS (GENSET RUN)
//   //   for (const record of merged) {
//   //     if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
//   //       currentInterval.push(record);
//   //     } else if (currentInterval.length > 0) {
//   //       intervals.push(currentInterval);
//   //       currentInterval = [];
//   //     }
//   //   }
//   //   if (currentInterval.length > 0) intervals.push(currentInterval);

//   //   const rows: any[] = [];

//   //   for (const interval of intervals) {
//   //     const start = interval[0].time;
//   //     const end = interval[interval.length - 1].time;

//   //     const startDateObj = new Date(start);
//   //     const endDateObj = new Date(end);

//   //     const durationMins =
//   //       (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
//   //     const runHours = +(durationMins / 60).toFixed(2);

//   //     // -------------------------
//   //     // 🔥 DEBUG ARRAYS
//   //     // -------------------------
//   //     const debugLoadPercentValues = interval.map((r) => r.Load_Percent ?? 0);
//   //     const debugFuelUsedValues = interval.map((r) => r.Fuel_Used ?? 0);
//   //     const debugKWValues = interval.map((r) => r.Genset_Total_kW ?? 0);
//   //     const debugTimestamps = interval.map((r) => r.time);
//   //     const debugRunSS = interval.map((r) => r.Genset_Run_SS ?? 0);

//   //     // -------------------------
//   //     // CALCULATIONS
//   //     // -------------------------
//   //     const fuelConsumed = +debugFuelUsedValues
//   //       .reduce((a, b) => a + b, 0)
//   //       .toFixed(2);

//   //     const avgKW =
//   //       debugKWValues.reduce((a, b) => a + b, 0) / (debugKWValues.length || 1);

//   //     const avgLoad =
//   //       debugLoadPercentValues.reduce((a, b) => a + b, 0) /
//   //       (debugLoadPercentValues.length || 1);

//   //     const production = +(avgKW * runHours).toFixed(2);
//   //     const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
//   //     const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

//   //     // -------------------------
//   //     // 🔥 COMPLETE DEBUG LOG OUTPUT
//   //     // -------------------------
//   //     console.log('======================================');
//   //     console.log('🔍 DEBUG REPORT INTERVAL');
//   //     console.log('Date:', date);
//   //     console.log('Start Time:', start);
//   //     console.log('End Time:', end);
//   //     console.log('Total Records:', interval.length);

//   //     console.log('\n-- Load Percent Debug --');
//   //     console.log('Values:', debugLoadPercentValues);
//   //     console.log('Average Load %:', avgLoad);

//   //     console.log('\n-- Fuel Used Debug --');
//   //     console.log('Values:', debugFuelUsedValues);
//   //     console.log('Total Fuel Consumed:', fuelConsumed);

//   //     console.log('\n-- KW Debug --');
//   //     console.log('Values:', debugKWValues);
//   //     console.log('Average kW:', avgKW);

//   //     console.log('\n-- Timestamp Debug --');
//   //     console.log(debugTimestamps);

//   //     console.log('\n-- Run SS Debug --');
//   //     console.log(debugRunSS);

//   //     console.log('======================================');

//   //     // -------------------------
//   //     // FINAL OUTPUT ROW
//   //     // -------------------------
//   //     const formatTime = (d: Date) =>
//   //       `${d.getHours().toString().padStart(2, '0')}:${d
//   //         .getMinutes()
//   //         .toString()
//   //         .padStart(2, '0')}`;

//   //     rows.push({
//   //       Date: date,
//   //       Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
//   //       Run_Hours: runHours,
//   //       Fuel_Consumed: `${fuelConsumed} Ltrs`,
//   //       Production: `${production} kWh`,
//   //       Load_Percent: +avgLoad.toFixed(2),
//   //       Cost: cost,
//   //       CostPerUnit: costPerUnit,
//   //       TotalCost: cost,

//   //       // -------------------------
//   //       // OPTIONAL: Debug Data in API Response
//   //       // -------------------------
//   //       Debug: {
//   //         LoadPercentValues: debugLoadPercentValues,
//   //         FuelUsedValues: debugFuelUsedValues,
//   //         KWValues: debugKWValues,
//   //         Timestamps: debugTimestamps,
//   //         RunSS: debugRunSS,
//   //       },
//   //     });
//   //   }

//   //   return rows;
//   // }
// }

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
import { FormulasService } from 'src/trends/formulas.service';

@Injectable()
export class ReportsService {
  private collection;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulasService: FormulasService,
  ) {
    this.collection = this.db.collection('navy_gen_on');
    this.collection.createIndex({ timestamp: 1 });
  }

  private formatTimestamp(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // async getFuelReport(payload: {
  //   startDate: string;
  //   endDate: string;
  //   fuelCostPerLitre: number;
  // }) {
  //   const { startDate, endDate, fuelCostPerLitre } = payload;

  //   if (!startDate || !endDate)
  //     throw new Error('startDate and endDate are required');

  //   const sampleDoc = await this.collection.findOne(
  //     {},
  //     { projection: { timestamp: 1 } },
  //   );
  //   const isTimestampString =
  //     sampleDoc && typeof sampleDoc.timestamp === 'string';

  //   // 🔹 Generate all dates between start and end
  //   const days: string[] = [];
  //   let current = new Date(startDate);
  //   const end = new Date(endDate);

  //   while (current <= end) {
  //     days.push(current.toISOString().split('T')[0]);
  //     current.setDate(current.getDate() + 1);
  //   }

  //   const allRows: any[] = [];

  //   for (const day of days) {
  //     const dayStart = new Date(`${day}T00:00:00Z`);
  //     const dayEnd = new Date(`${day}T23:59:59Z`);

  //     const query = isTimestampString
  //       ? {
  //           timestamp: {
  //             $gte: dayStart.toISOString(),
  //             $lte: dayEnd.toISOString(),
  //           },
  //         }
  //       : { timestamp: { $gte: dayStart, $lte: dayEnd } };

  //     // ⭐ Correct Projection — Required Tags Added
  //     const docs = await this.collection
  //       .find(query, {
  //         projection: {
  //           timestamp: 1,
  //           Genset_Run_SS: 1,
  //           Load_Percent: 1,

  //           // ⭐ Required fields for last – first formula
  //           Total_Fuel_Consumption_calculated: 1,
  //           Engine_Running_Time_calculated: 1,
  //           // Load % k liye
  //           Genset_Total_kW: 1,
  //           Genset_Application_kW_Rating_PC2X: 1,
  //         },
  //       })
  //       .sort({ timestamp: 1 })
  //       .toArray();

  //     if (!docs.length) continue;

  //     const data = docs.map((d) => ({
  //       ...d,
  //       timestamp: this.formatTimestamp(d.timestamp),
  //     }));

  //     // ⭐ No fuelData now — only merge load%
  //     const merged = data.map((doc) => ({
  //       ...doc,
  //       Load_Percent: this.formulasService.calculateLoadPercent(doc),
  //       time: doc.timestamp,
  //     }));

  //     const dailyRows = this.processIntervals(merged, fuelCostPerLitre, day);
  //     allRows.push(...dailyRows);
  //   }

  //   return allRows.length
  //     ? allRows
  //     : [{ message: 'No data found for selected dates' }];
  // }

  // private processIntervals(
  //   merged: any[],
  //   fuelCostPerLitre: number,
  //   date: string,
  // ) {
  //   const intervals: any[] = [];
  //   let currentInterval: any[] = [];

  //   // Interval grouping based on Genset_Run_SS
  //   for (const record of merged) {
  //     if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
  //       currentInterval.push(record);
  //     } else if (currentInterval.length > 0) {
  //       intervals.push(currentInterval);
  //       currentInterval = [];
  //     }
  //   }
  //   if (currentInterval.length > 0) intervals.push(currentInterval);

  //   const rows: any[] = [];

  //   for (const interval of intervals) {
  //     const first = interval[0];
  //     const last = interval[interval.length - 1];

  //     const startDateObj = new Date(first.time);
  //     const endDateObj = new Date(last.time);

  //     // Run Hours
  //     const durationMins =
  //       (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
  //     const runHours = +(durationMins / 60).toFixed(2);

  //     // ⭐ Fuel = last - first (Correct Tag)
  //     const fuelConsumed = +(
  //       (last.Total_Fuel_Consumption_calculated ?? 0) -
  //       (first.Total_Fuel_Consumption_calculated ?? 0)
  //     ).toFixed(2);

  //     // ⭐ Production = last - first (Correct Tag)
  //     const production = +(
  //       (last.Engine_Running_Time_calculated ?? 0) -
  //       (first.Engine_Running_Time_calculated ?? 0)
  //     ).toFixed(2);

  //     // Avg Load
  //     const avgLoad =
  //       interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
  //       (interval.length || 1);

  //     // Cost
  //     const cost = +(fuelConsumed * fuelCostPerLitre).toFixed(2);
  //     const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

  //     const formatTime = (d: Date) =>
  //       `${d.getHours().toString().padStart(2, '0')}:${d
  //         .getMinutes()
  //         .toString()
  //         .padStart(2, '0')}`;

  //     rows.push({
  //       Date: date,
  //       Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
  //       Run_Hours: runHours,
  //       Fuel_Consumed: `${fuelConsumed} Ltrs`,
  //       Production: `${production} kWh`,
  //       Load_Percent: +avgLoad.toFixed(2),
  //       Cost: cost,
  //       CostPerUnit: costPerUnit,
  //       TotalCost: cost,
  //     });
  //   }

  //   return rows;
  // }

  async getFuelReport(payload: {
    startDate: string;
    endDate: string;
    fuelCostPerLitre: number;
  }) {
    const { startDate, endDate, fuelCostPerLitre } = payload;

    if (!startDate || !endDate)
      throw new Error('startDate and endDate are required');

    const sampleDoc = await this.collection.findOne(
      {},
      { projection: { timestamp: 1 } },
    );
    const isTimestampString =
      sampleDoc && typeof sampleDoc.timestamp === 'string';

    // 🔹 Generate all dates between start and end
    const days: string[] = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const allRows: any[] = [];
    let cumulativeProduction = 0; // <-- cumulative production across days

    for (const day of days) {
      const dayStart = new Date(`${day}T00:00:00Z`);
      const dayEnd = new Date(`${day}T23:59:59Z`);

      const query = isTimestampString
        ? {
            timestamp: {
              $gte: dayStart.toISOString(),
              $lte: dayEnd.toISOString(),
            },
          }
        : { timestamp: { $gte: dayStart, $lte: dayEnd } };

      const docs = await this.collection
        .find(query, {
          projection: {
            timestamp: 1,
            Genset_Run_SS: 1,
            Load_Percent: 1,
            Total_Fuel_Consumption_calculated: 1,
            Engine_Running_Time_calculated: 1,
            Genset_Total_kW: 1,
            Genset_Application_kW_Rating_PC2X: 1,
          },
        })
        .sort({ timestamp: 1 })
        .toArray();

      if (!docs.length) continue;

      const data = docs.map((d) => ({
        ...d,
        timestamp: this.formatTimestamp(d.timestamp),
      }));

      const merged = data.map((doc) => ({
        ...doc,
        Load_Percent: this.formulasService.calculateLoadPercent(doc),
        time: doc.timestamp,
      }));

      const dailyRows = this.processIntervals(merged, fuelCostPerLitre, day);

      // Update cumulative production for each interval
      dailyRows.forEach((row) => {
        cumulativeProduction += parseFloat(row.Production);
        row.CumulativeProduction = cumulativeProduction.toFixed(2);
      });

      allRows.push(...dailyRows);
    }

    return allRows.length
      ? allRows
      : [{ message: 'No data found for selected dates' }];
  }

  // private processIntervals(
  //   merged: any[],
  //   fuelCostPerLitre: number,
  //   date: string,
  // ) {
  //   const intervals: any[] = [];
  //   let currentInterval: any[] = [];

  //   // Group intervals based on Genset_Run_SS
  //   for (const record of merged) {
  //     if (record.Genset_Run_SS >= 1 && record.Genset_Run_SS <= 6) {
  //       currentInterval.push(record);
  //     } else if (currentInterval.length > 0) {
  //       intervals.push(currentInterval);
  //       currentInterval = [];
  //     }
  //   }
  //   if (currentInterval.length > 0) intervals.push(currentInterval);

  //   const rows: any[] = [];

  //   for (const interval of intervals) {
  //     const first = interval[0];
  //     const last = interval[interval.length - 1];

  //     const startDateObj = new Date(first.time);
  //     const endDateObj = new Date(last.time);

  //     // Run Hours
  //     const durationMins =
  //       (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60);
  //     const runHours = +(durationMins / 60).toFixed(2);

  //     // Fuel consumed in liters
  //     const fuelConsumedLiters = +(
  //       ((last.Total_Fuel_Consumption_calculated ?? 0) -
  //         (first.Total_Fuel_Consumption_calculated ?? 0)) *
  //       3.7854
  //     ).toFixed(2);

  //     // Production using Genset_Total_kW * 0.000833 per record
  //     const production = interval.reduce((sum, r) => {
  //       const energyKWH = (r.Genset_Total_kW ?? 0) * 0.000833;
  //       return sum + energyKWH;
  //     }, 0);

  //     // Average Load %
  //     const avgLoad =
  //       interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
  //       (interval.length || 1);

  //     // Cost
  //     const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);
  //     const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

  //     const formatTime = (d: Date) =>
  //       `${d.getHours().toString().padStart(2, '0')}:${d
  //         .getMinutes()
  //         .toString()
  //         .padStart(2, '0')}`;

  //     rows.push({
  //       Date: date,
  //       Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
  //       Run_Hours: runHours,
  //       Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
  //       Production: `${production.toFixed(2)} kWh`,
  //       Load_Percent: +avgLoad.toFixed(2),
  //       Cost: cost,
  //       CostPerUnit: costPerUnit,
  //       TotalCost: cost,
  //     });
  //   }

  //   return rows;
  // }

  private processIntervals(
    merged: any[],
    fuelCostPerLitre: number,
    date: string,
  ) {
    const intervals: any[] = [];
    let currentInterval: any[] = [];

    // Group intervals based on Genset_Run_SS
    for (const record of merged) {
      if (record.Genset_Run_SS > 0) {
        currentInterval.push(record);
      } else if (currentInterval.length > 0) {
        intervals.push(currentInterval);
        currentInterval = [];
      }
    }
    if (currentInterval.length > 0) intervals.push(currentInterval);

    const rows: any[] = [];

    for (const interval of intervals) {
      const first = interval[0];
      const last = interval[interval.length - 1];

      const startDateObj = new Date(first.time);
      const endDateObj = new Date(last.time);

      // ✅ UPDATED: Dashboard service jaisa running hours calculation
      const runHours = this.calculateRunningHoursFromEngineTime(interval);

      // Fuel consumed in liters
      const fuelConsumedLiters = +(
        ((last.Total_Fuel_Consumption_calculated ?? 0) -
          (first.Total_Fuel_Consumption_calculated ?? 0)) *
        3.7854
      ).toFixed(2);

      // Production using Genset_Total_kW * 0.000833 per record
      const production = interval.reduce((sum, r) => {
        const energyKWH = (r.Genset_Total_kW ?? 0) * 0.000833;
        return sum + energyKWH;
      }, 0);

      // Average Load %
      const avgLoad =
        interval.reduce((sum, r) => sum + (r.Load_Percent ?? 0), 0) /
        (interval.length || 1);

      // Cost
      const cost = +(fuelConsumedLiters * fuelCostPerLitre).toFixed(2);
      const costPerUnit = production ? +(cost / production).toFixed(2) : 0;

      const formatTime = (d: Date) =>
        `${d.getHours().toString().padStart(2, '0')}:${d
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

      rows.push({
        Date: date,
        Duration: `${formatTime(startDateObj)}–${formatTime(endDateObj)}`,
        Run_Hours: runHours,
        Fuel_Consumed: `${fuelConsumedLiters} Ltrs`,
        Production: `${production.toFixed(2)} kWh`,
        Load_Percent: +avgLoad.toFixed(2),
        Cost: cost,
        CostPerUnit: costPerUnit,
        TotalCost: cost,
      });
    }

    return rows;
  }

  /** -------------------
   * NEW: Dashboard service jaisa running hours calculation
   * ------------------- */
  private calculateRunningHoursFromEngineTime(data: any[]): number {
    if (data.length === 0) return 0;

    console.log(
      '=== DEBUG: Running Hours Calculation (Engine_Running_Time) ===',
    );

    const runningHoursField = 'Engine_Running_Time_calculated';

    // Check if field exists
    if (!(runningHoursField in data[0])) {
      console.log(`❌ ${runningHoursField} not found in data`);
      return 0;
    }

    const runningHoursValues = data
      .map((d) => d[runningHoursField])
      .filter(
        (val) => val !== undefined && val !== null && !isNaN(val) && val >= 0,
      );

    console.log(`Valid ${runningHoursField} values:`, runningHoursValues);

    if (runningHoursValues.length >= 2) {
      const maxRunningHours = Math.max(...runningHoursValues);
      const minRunningHours = Math.min(...runningHoursValues);
      const calculatedRunningHours = maxRunningHours - minRunningHours;

      console.log(
        `Running hours: MAX=${maxRunningHours}, MIN=${minRunningHours}, DIFF=${calculatedRunningHours}`,
      );
      return +calculatedRunningHours.toFixed(2);
    }

    if (runningHoursValues.length === 1) {
      return +runningHoursValues[0].toFixed(2);
    }

    return 0;
  }
}
