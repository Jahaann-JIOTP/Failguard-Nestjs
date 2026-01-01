// // // // // // /* eslint-disable @typescript-eslint/no-unsafe-argument */
// // // // // // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // // // // // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // // // // // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // // // // // /* eslint-disable @typescript-eslint/no-unsafe-assignment */

// // // // // // import { Injectable, Inject } from '@nestjs/common';
// // // // // // import { Db, ObjectId } from 'mongodb';
// // // // // // import { FormulasService } from 'src/trends/formulas.service';

// // // // // // @Injectable()
// // // // // // export class AianomlyService {
// // // // // //   private electrical;
// // // // // //   private eng;
// // // // // //   private navy;

// // // // // //   constructor(
// // // // // //     @Inject('MONGO_CLIENT') private readonly db: Db,
// // // // // //     private readonly formulas: FormulasService,
// // // // // //   ) {
// // // // // //     this.electrical = this.db.collection('ai_anomly_electrical');
// // // // // //     this.eng = this.db.collection('ai_anomly_Eng');
// // // // // //     this.navy = this.db.collection('navy_12s');
// // // // // //   }

// // // // // //   // -------------------------------------------------------
// // // // // //   // API 1 → Chart listing only (FAST, live/historic)
// // // // // //   // -------------------------------------------------------
// // // // // //   async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
// // // // // //     const { mode, start, end } = payload;

// // // // // //     let query: any = {};
// // // // // //     let sortOrder = 1; // default ascending for historic
// // // // // //     let limit: number | undefined = undefined;

// // // // // //     if (mode === 'historic' && start && end) {
// // // // // //       query = { timestamp: { $gte: new Date(start), $lte: new Date(end) } };
// // // // // //     } else if (mode === 'live') {
// // // // // //       // Live mode: fetch only latest record
// // // // // //       sortOrder = -1;
// // // // // //       limit = 1;
// // // // // //     }

// // // // // //     const projection = {
// // // // // //       timestamp: 1,
// // // // // //       Fused_Fisher_Score: 1,
// // // // // //       quantile_95: 1,
// // // // // //       quantile_99: 1,
// // // // // //       s_threshold_EVT: 1,
// // // // // //     };

// // // // // //     const [genRaw, engRaw] = await Promise.all([
// // // // // //       this.electrical
// // // // // //         .find(query)
// // // // // //         .project(projection)
// // // // // //         .sort({ timestamp: sortOrder })
// // // // // //         .limit(limit ?? 0)
// // // // // //         .toArray(),
// // // // // //       this.eng
// // // // // //         .find(query)
// // // // // //         .project(projection)
// // // // // //         .sort({ timestamp: sortOrder })
// // // // // //         .limit(limit ?? 0)
// // // // // //         .toArray(),
// // // // // //     ]);

// // // // // //     // Reverse live data so frontend sees chronological order
// // // // // //     const gen = mode === 'live' ? genRaw.reverse() : genRaw;
// // // // // //     const eng = mode === 'live' ? engRaw.reverse() : engRaw;

// // // // // //     return {
// // // // // //       gen: gen.map((r) => this.makeStatus(r)),
// // // // // //       eng: eng.map((r) => this.makeStatus(r)),
// // // // // //     };
// // // // // //   }

// // // // // //   // -------------------------------------------------------
// // // // // //   // Format timestamp
// // // // // //   // -------------------------------------------------------
// // // // // //   private formatTimestamp(ts: string | Date): string {
// // // // // //     const date = new Date(ts); // UTC timestamp from DB

// // // // // //     const monthNames = [
// // // // // //       'Jan',
// // // // // //       'Feb',
// // // // // //       'Mar',
// // // // // //       'Apr',
// // // // // //       'May',
// // // // // //       'Jun',
// // // // // //       'Jul',
// // // // // //       'Aug',
// // // // // //       'Sep',
// // // // // //       'Oct',
// // // // // //       'Nov',
// // // // // //       'Dec',
// // // // // //     ];

// // // // // //     const month = monthNames[date.getUTCMonth()];
// // // // // //     const day = date.getUTCDate();
// // // // // //     const hours = date.getUTCHours().toString().padStart(2, '0'); // <-- UTC hours
// // // // // //     const minutes = date.getUTCMinutes().toString().padStart(2, '0');
// // // // // //     const seconds = date.getUTCSeconds().toString().padStart(2, '0');

// // // // // //     return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
// // // // // //   }

// // // // // //   // -------------------------------------------------------
// // // // // //   // Status calculator
// // // // // //   // -------------------------------------------------------
// // // // // //   private makeStatus(r: any) {
// // // // // //     const score = r.Fused_Fisher_Score;
// // // // // //     let status = 'Healthy';
// // // // // //     if (score > r.s_threshold_EVT) status = 'Critical';
// // // // // //     else if (score > r.quantile_99) status = 'Threat';
// // // // // //     else if (score > r.quantile_95) status = 'Warning';

// // // // // //     return {
// // // // // //       _id: r._id,
// // // // // //       timestamp: this.formatTimestamp(r.timestamp),
// // // // // //       score,
// // // // // //       status,
// // // // // //     };
// // // // // //   }

// // // // // //   // -------------------------------------------------------
// // // // // //   // API 2 → Feature details + last 100 (FAST, status-based features)
// // // // // //   // -------------------------------------------------------
// // // // // //   async getAnomalyDetails(id: string) {
// // // // // //     const _id = new ObjectId(id);

// // // // // //     // Lookup in parallel
// // // // // //     const [eRec, engRec] = await Promise.all([
// // // // // //       this.electrical.findOne({ _id }),
// // // // // //       this.eng.findOne({ _id }),
// // // // // //     ]);

// // // // // //     const record = eRec || engRec;
// // // // // //     if (!record) return { error: 'Record not found' };

// // // // // //     // Determine status & pick feature field
// // // // // //     const score = record.Fused_Fisher_Score;
// // // // // //     let status = 'Healthy';
// // // // // //     let featureString: string | undefined;

// // // // // //     if (score > record.s_threshold_EVT) {
// // // // // //       status = 'Critical';
// // // // // //       featureString = record.top_features_evt_metric;
// // // // // //     } else if (score > record.quantile_99) {
// // // // // //       status = 'Threat';
// // // // // //       featureString = record.top_features_99th_metric;
// // // // // //     } else if (score > record.quantile_95) {
// // // // // //       status = 'Warning';
// // // // // //       featureString = record.top_features_95th_metric;
// // // // // //     } else {
// // // // // //       featureString = record.top_features_95th_metric; // default
// // // // // //     }

// // // // // //     // Extract features from the chosen field
// // // // // //     let featureList: string[] = [];
// // // // // //     if (featureString) {
// // // // // //       featureList = featureString
// // // // // //         .split(',')
// // // // // //         .map((f) => f.trim().replace('_RE', ''));
// // // // // //     }

// // // // // //     // Last 100 values
// // // // // //     const last100Values = await this.loadLast100(featureList);

// // // // // //     // Random contributions (placeholder)
// // // // // //     const contributions: Record<string, number> = {};
// // // // // //     featureList.forEach(
// // // // // //       (f) => (contributions[f] = parseFloat((Math.random() * 100).toFixed(2))),
// // // // // //     );

// // // // // //     return {
// // // // // //       timestamp: this.formatTimestamp(record.timestamp),
// // // // // //       status,
// // // // // //       features: featureList,
// // // // // //       contribution: contributions,
// // // // // //       last_100_values: last100Values,
// // // // // //     };
// // // // // //   }

// // // // // //   // -------------------------------------------------------
// // // // // //   // Load last 100 values FAST (optimized)
// // // // // //   // -------------------------------------------------------
// // // // // //   private async loadLast100(
// // // // // //     features: string[],
// // // // // //   ): Promise<Record<string, (number | null)[]>> {
// // // // // //     const result: Record<string, (number | null)[]> = {};
// // // // // //     if (!features?.length) return result;

// // // // // //     const calculated = new Set([
// // // // // //       'Voltage_Imbalance_%',
// // // // // //       'Current_Imbalance_%',
// // // // // //       'Electrical_Stress_RMS',
// // // // // //       'Neutral_Current',
// // // // // //       'Load_Percent',
// // // // // //       'Power_Loss_Index',
// // // // // //       'RPM_stability_index',
// // // // // //     ]);

// // // // // //     const rawFeatures = features.filter((f) => !calculated.has(f));
// // // // // //     const calcFeatures = features.filter((f) => calculated.has(f));

// // // // // //     // RAW FIELDS — optimized
// // // // // //     if (rawFeatures.length > 0) {
// // // // // //       const facetStages = rawFeatures.reduce(
// // // // // //         (acc, field) => {
// // // // // //           acc[field] = [
// // // // // //             {
// // // // // //               $match: { [field]: { $exists: true }, Genset_Run_SS: { $gt: 0 } },
// // // // // //             },
// // // // // //             { $sort: { timestamp: -1 } },
// // // // // //             { $limit: 100 },
// // // // // //             { $project: { value: `$${field}`, _id: 0 } },
// // // // // //           ];
// // // // // //           return acc;
// // // // // //         },
// // // // // //         {} as Record<string, any[]>,
// // // // // //       );

// // // // // //       const aggregated = (
// // // // // //         await this.navy.aggregate([{ $facet: facetStages }]).toArray()
// // // // // //       )[0];
// // // // // //       rawFeatures.forEach((f) => {
// // // // // //         result[f] = aggregated[f]?.map((x) => x.value ?? null) ?? [];
// // // // // //       });
// // // // // //     }

// // // // // //     // CALCULATED FIELDS — optimized batch read
// // // // // //     if (calcFeatures.length > 0) {
// // // // // //       const docs = await this.navy
// // // // // //         .find({})
// // // // // //         .sort({ timestamp: -1 })
// // // // // //         .limit(300)
// // // // // //         .toArray();

// // // // // //       for (const f of calcFeatures) {
// // // // // //         const values: (number | null)[] = [];
// // // // // //         for (const doc of docs) {
// // // // // //           if (values.length >= 100) break;
// // // // // //           let val: number | null = null;
// // // // // //           switch (f) {
// // // // // //             case 'Voltage_Imbalance_%':
// // // // // //               val = this.formulas.calculateVoltageImbalance(doc);
// // // // // //               break;
// // // // // //             case 'Current_Imbalance_%':
// // // // // //               val = this.formulas.calculateCurrentImbalance(doc);
// // // // // //               break;
// // // // // //             case 'Electrical_Stress_RMS':
// // // // // //               val = this.formulas.calculateElectricalStress(doc);
// // // // // //               break;
// // // // // //             case 'Neutral_Current':
// // // // // //               val = this.formulas.calculateNeutralCurrent(doc);
// // // // // //               break;
// // // // // //             case 'Load_Percent':
// // // // // //               val = this.formulas.calculateLoadPercent(doc);
// // // // // //               break;
// // // // // //             case 'Power_Loss_Index':
// // // // // //               val = this.formulas.calculatePowerLossFactor(doc);
// // // // // //               break;
// // // // // //             case 'RPM_stability_index':
// // // // // //               val =
// // // // // //                 this.formulas.calculateRPMStabilityWithLoad([doc])[0]
// // // // // //                   ?.RPM_Stability_Index ?? null;
// // // // // //               break;
// // // // // //           }
// // // // // //           values.push(val);
// // // // // //         }
// // // // // //         result[f] = values.reverse();
// // // // // //       }
// // // // // //     }

// // // // // //     return result;
// // // // // //   }
// // // // // // }

// // // // // /* eslint-disable @typescript-eslint/no-unsafe-argument */
// // // // // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // // // // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // // // // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // // // // /* eslint-disable @typescript-eslint/no-unsafe-assignment */

// // // // // import { Injectable, Inject } from '@nestjs/common';
// // // // // import { Db, ObjectId } from 'mongodb';
// // // // // import { FormulasService } from 'src/trends/formulas.service';

// // // // // @Injectable()
// // // // // export class AianomlyService {
// // // // //   private electrical;
// // // // //   private eng;
// // // // //   private navy;

// // // // //   constructor(
// // // // //     @Inject('MONGO_CLIENT') private readonly db: Db,
// // // // //     private readonly formulas: FormulasService,
// // // // //   ) {
// // // // //     this.electrical = this.db.collection('ae_elc_prediction_3s');
// // // // //     this.eng = this.db.collection('ae_eng_prediction_3s');
// // // // //     this.navy = this.db.collection('navy_12s');
// // // // //   }

// // // // //   // -------------------------------------------------------
// // // // //   // API 1 → Chart listing only (live / historic)
// // // // //   // -------------------------------------------------------
// // // // //   // async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
// // // // //   //   const { mode, start, end } = payload;

// // // // //   //   let query: any = {};
// // // // //   //   let sortOrder = 1;
// // // // //   //   let limit: number | undefined = undefined;

// // // // //   //   if (mode === 'historic' && start && end) {
// // // // //   //     query = { timestamp: { $gte: new Date(start), $lte: new Date(end) } };
// // // // //   //   } else if (mode === 'live') {
// // // // //   //     sortOrder = -1;
// // // // //   //     limit = 1;
// // // // //   //   }

// // // // //   //   const projection = {
// // // // //   //     timestamp: 1,
// // // // //   //     Fused_Fisher_Score: 1,
// // // // //   //     quantile_95: 1,
// // // // //   //     quantile_99: 1,
// // // // //   //     s_threshold_EVT: 1,
// // // // //   //   };

// // // // //   //   const [genRaw, engRaw] = await Promise.all([
// // // // //   //     this.electrical
// // // // //   //       .find(query)
// // // // //   //       .project(projection)
// // // // //   //       .sort({ timestamp: sortOrder })
// // // // //   //       .limit(limit ?? 0)
// // // // //   //       .toArray(),
// // // // //   //     this.eng
// // // // //   //       .find(query)
// // // // //   //       .project(projection)
// // // // //   //       .sort({ timestamp: sortOrder })
// // // // //   //       .limit(limit ?? 0)
// // // // //   //       .toArray(),
// // // // //   //   ]);

// // // // //   //   const gen = mode === 'live' ? genRaw.reverse() : genRaw;
// // // // //   //   const eng = mode === 'live' ? engRaw.reverse() : engRaw;

// // // // //   //   return {
// // // // //   //     gen: gen.map((r) => this.makeStatus(r)),
// // // // //   //     eng: eng.map((r) => this.makeStatus(r)),
// // // // //   //   };
// // // // //   // }

// // // // //   // -------------------------------------------------------
// // // // //   // API 1 → Chart listing only (live / historic)
// // // // //   // -------------------------------------------------------
// // // // //   async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
// // // // //     const { mode, start, end } = payload;

// // // // //     let query: any = {};
// // // // //     let sortOrder = 1;
// // // // //     let limit: number | undefined = undefined;

// // // // //     if (mode === 'historic' && start && end) {
// // // // //       query = { timestamp: { $gte: new Date(start), $lte: new Date(end) } };
// // // // //     } else if (mode === 'live') {
// // // // //       sortOrder = -1;
// // // // //       limit = 50; // <-- fetch last 100 for live mode
// // // // //     }

// // // // //     const projection = {
// // // // //       timestamp: 1,
// // // // //       Fused_Fisher_Score: 1,
// // // // //       quantile_95: 1,
// // // // //       quantile_99: 1,
// // // // //       s_threshold_EVT: 1,
// // // // //     };

// // // // //     const [genRaw, engRaw] = await Promise.all([
// // // // //       this.electrical
// // // // //         .find(query)
// // // // //         .project(projection)
// // // // //         .sort({ timestamp: sortOrder })
// // // // //         .limit(limit ?? 0)
// // // // //         .toArray(),
// // // // //       this.eng
// // // // //         .find(query)
// // // // //         .project(projection)
// // // // //         .sort({ timestamp: sortOrder })
// // // // //         .limit(limit ?? 0)
// // // // //         .toArray(),
// // // // //     ]);

// // // // //     // Reverse so frontend sees chronological order
// // // // //     const gen = genRaw.reverse();
// // // // //     const eng = engRaw.reverse();

// // // // //     return {
// // // // //       gen: gen.map((r) => this.makeStatus(r)),
// // // // //       eng: eng.map((r) => this.makeStatus(r)),
// // // // //     };
// // // // //   }

// // // // //   // -------------------------------------------------------
// // // // //   // Timestamp formatter (no timezone conversion — EXACT DB)
// // // // //   // -------------------------------------------------------
// // // // //   private formatTimestamp(ts: string | Date): string {
// // // // //     const date = new Date(ts);

// // // // //     const monthNames = [
// // // // //       'Jan',
// // // // //       'Feb',
// // // // //       'Mar',
// // // // //       'Apr',
// // // // //       'May',
// // // // //       'Jun',
// // // // //       'Jul',
// // // // //       'Aug',
// // // // //       'Sep',
// // // // //       'Oct',
// // // // //       'Nov',
// // // // //       'Dec',
// // // // //     ];

// // // // //     const month = monthNames[date.getUTCMonth()];
// // // // //     const day = date.getUTCDate();
// // // // //     const hours = date.getUTCHours().toString().padStart(2, '0');
// // // // //     const minutes = date.getUTCMinutes().toString().padStart(2, '0');
// // // // //     const seconds = date.getUTCSeconds().toString().padStart(2, '0');

// // // // //     return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
// // // // //   }

// // // // //   // -------------------------------------------------------
// // // // //   // Status + mapping builder
// // // // //   // -------------------------------------------------------
// // // // //   private makeStatus(r: any) {
// // // // //     const score = r.Fused_Fisher_Score;
// // // // //     let status = 'Healthy';

// // // // //     if (score > r.s_threshold_EVT) status = 'Critical';
// // // // //     else if (score > r.quantile_99) status = 'Threat';
// // // // //     else if (score > r.quantile_95) status = 'Warning';

// // // // //     return {
// // // // //       _id: r._id,
// // // // //       timestamp: this.formatTimestamp(r.timestamp),
// // // // //       score,
// // // // //       status,
// // // // //     };
// // // // //   }

// // // // //   // -------------------------------------------------------
// // // // //   // API 2 → Anomaly details (updated to accept object)
// // // // //   // -------------------------------------------------------
// // // // //   async getAnomalyDetails(params: {
// // // // //     id: string;
// // // // //     mode?: string;
// // // // //     start?: string;
// // // // //     end?: string;
// // // // //   }) {
// // // // //     const { id, mode, start, end } = params;

// // // // //     const _id = new ObjectId(id);

// // // // //     const [eRec, engRec] = await Promise.all([
// // // // //       this.electrical.findOne({ _id }),
// // // // //       this.eng.findOne({ _id }),
// // // // //     ]);

// // // // //     const record = eRec || engRec;
// // // // //     if (!record) return { error: 'Record not found' };

// // // // //     const score = record.Fused_Fisher_Score;

// // // // //     let status = 'Healthy';
// // // // //     let featureString = '';

// // // // //     if (score > record.s_threshold_EVT) {
// // // // //       status = 'Critical';
// // // // //       featureString = record.top_features_evt_metric;
// // // // //     } else if (score > record.quantile_99) {
// // // // //       status = 'Threat';
// // // // //       featureString = record.top_features_99th_metric;
// // // // //     } else if (score > record.quantile_95) {
// // // // //       status = 'Warning';
// // // // //       featureString = record.top_features_95th_metric;
// // // // //     } else {
// // // // //       featureString = record.top_features_95th_metric;
// // // // //     }

// // // // //     const featureList =
// // // // //       featureString
// // // // //         ?.split(',')
// // // // //         .map((f: string) => f.trim().replace('_RE', '')) ?? [];

// // // // //     // Load last 100 values (previous + next when historic)
// // // // //     const last100Values = await this.loadLast100(
// // // // //       featureList,
// // // // //       mode as any,
// // // // //       start,
// // // // //       end,
// // // // //     );

// // // // //     // TEMP contributions
// // // // //     const contributions: Record<string, number> = {};
// // // // //     featureList.forEach(
// // // // //       (f) => (contributions[f] = parseFloat((Math.random() * 100).toFixed(2))),
// // // // //     );

// // // // //     return {
// // // // //       timestamp: this.formatTimestamp(record.timestamp),
// // // // //       status,
// // // // //       features: featureList,
// // // // //       contribution: contributions,
// // // // //       last_100_values: last100Values,
// // // // //     };
// // // // //   }

// // // // //   // -------------------------------------------------------
// // // // //   // Load last 100 (supports historic prev+next)
// // // // //   // -------------------------------------------------------
// // // // //   private async loadLast100(
// // // // //     features: string[],
// // // // //     mode?: 'live' | 'historic',
// // // // //     start?: string,
// // // // //     end?: string,
// // // // //   ): Promise<Record<string, (number | null)[]>> {
// // // // //     const result: Record<string, (number | null)[]> = {};
// // // // //     if (!features?.length) return result;

// // // // //     const calculated = new Set([
// // // // //       'Voltage_Imbalance_%',
// // // // //       'Current_Imbalance_%',
// // // // //       'Electrical_Stress_RMS',
// // // // //       'Neutral_Current',
// // // // //       'Load_Percent',
// // // // //       'Power_Loss_Index',
// // // // //       'RPM_stability_index',
// // // // //     ]);

// // // // //     const rawFeatures = features.filter((f) => !calculated.has(f));
// // // // //     const calcFeatures = features.filter((f) => calculated.has(f));

// // // // //     // RAW FEATURES (with prev + next)
// // // // //     if (rawFeatures.length > 0) {
// // // // //       const facetStages = rawFeatures.reduce(
// // // // //         (acc, field) => {
// // // // //           let matchStage: any = {
// // // // //             [field]: { $exists: true },
// // // // //             Genset_Run_SS: { $gt: 0 },
// // // // //           };

// // // // //           if (mode === 'historic' && start && end) {
// // // // //             const startDate = new Date(start);
// // // // //             const endDate = new Date(end);

// // // // //             acc[`${field}_prev`] = [
// // // // //               { $match: { ...matchStage, timestamp: { $lt: startDate } } },
// // // // //               { $sort: { timestamp: -1 } },
// // // // //               { $limit: 100 },
// // // // //               { $project: { value: `$${field}`, _id: 0 } },
// // // // //             ];

// // // // //             acc[`${field}_next`] = [
// // // // //               { $match: { ...matchStage, timestamp: { $gt: endDate } } },
// // // // //               { $sort: { timestamp: 1 } },
// // // // //               { $limit: 100 },
// // // // //               { $project: { value: `$${field}`, _id: 0 } },
// // // // //             ];
// // // // //           } else {
// // // // //             acc[field] = [
// // // // //               { $match: matchStage },
// // // // //               { $sort: { timestamp: -1 } },
// // // // //               { $limit: 100 },
// // // // //               { $project: { value: `$${field}`, _id: 0 } },
// // // // //             ];
// // // // //           }

// // // // //           return acc;
// // // // //         },
// // // // //         {} as Record<string, any[]>,
// // // // //       );

// // // // //       const aggregated = (
// // // // //         await this.navy.aggregate([{ $facet: facetStages }]).toArray()
// // // // //       )[0];

// // // // //       rawFeatures.forEach((f) => {
// // // // //         if (mode === 'historic' && start && end) {
// // // // //           const prev =
// // // // //             aggregated[`${f}_prev`]
// // // // //               ?.map((x: any) => x.value ?? null)
// // // // //               .reverse() ?? [];
// // // // //           const next =
// // // // //             aggregated[`${f}_next`]?.map((x: any) => x.value ?? null) ?? [];

// // // // //           result[f] = [...prev, ...next];
// // // // //         } else {
// // // // //           result[f] = aggregated[f]?.map((x: any) => x.value ?? null) ?? [];
// // // // //         }
// // // // //       });
// // // // //     }

// // // // //     // CALCULATED FEATURES
// // // // //     if (calcFeatures.length > 0) {
// // // // //       let docsQuery: any[] = [];

// // // // //       if (mode === 'historic' && start && end) {
// // // // //         const startDate = new Date(start);
// // // // //         const endDate = new Date(end);

// // // // //         const prevDocs = await this.navy
// // // // //           .find({ timestamp: { $lt: startDate } })
// // // // //           .sort({ timestamp: -1 })
// // // // //           .limit(100)
// // // // //           .toArray();

// // // // //         const nextDocs = await this.navy
// // // // //           .find({ timestamp: { $gt: endDate } })
// // // // //           .sort({ timestamp: 1 })
// // // // //           .limit(100)
// // // // //           .toArray();

// // // // //         docsQuery = [...prevDocs.reverse(), ...nextDocs];
// // // // //       } else {
// // // // //         docsQuery = await this.navy
// // // // //           .find({})
// // // // //           .sort({ timestamp: -1 })
// // // // //           .limit(300)
// // // // //           .toArray();
// // // // //       }

// // // // //       calcFeatures.forEach((f) => {
// // // // //         const values: (number | null)[] = [];

// // // // //         for (const doc of docsQuery) {
// // // // //           if (values.length >= 100) break;

// // // // //           let val: number | null = null;

// // // // //           switch (f) {
// // // // //             case 'Voltage_Imbalance_%':
// // // // //               val = this.formulas.calculateVoltageImbalance(doc);
// // // // //               break;
// // // // //             case 'Current_Imbalance_%':
// // // // //               val = this.formulas.calculateCurrentImbalance(doc);
// // // // //               break;
// // // // //             case 'Electrical_Stress_RMS':
// // // // //               val = this.formulas.calculateElectricalStress(doc);
// // // // //               break;
// // // // //             case 'Neutral_Current':
// // // // //               val = this.formulas.calculateNeutralCurrent(doc);
// // // // //               break;
// // // // //             case 'Load_Percent':
// // // // //               val = this.formulas.calculateLoadPercent(doc);
// // // // //               break;
// // // // //             case 'Power_Loss_Index':
// // // // //               val = this.formulas.calculatePowerLossFactor(doc);
// // // // //               break;
// // // // //             case 'RPM_stability_index':
// // // // //               val =
// // // // //                 this.formulas.calculateRPMStabilityWithLoad([doc])[0]
// // // // //                   ?.RPM_Stability_Index ?? null;
// // // // //               break;
// // // // //           }

// // // // //           values.push(val);
// // // // //         }

// // // // //         result[f] = values.reverse();
// // // // //       });
// // // // //     }

// // // // //     return result;
// // // // //   }
// // // // // }

// // // // /* eslint-disable @typescript-eslint/no-unsafe-argument */
// // // // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // // // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // // // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // // // /* eslint-disable @typescript-eslint/no-unsafe-assignment */

// // // // import { Injectable, Inject } from '@nestjs/common';
// // // // import { Db, ObjectId } from 'mongodb';
// // // // import { FormulasService } from 'src/trends/formulas.service';

// // // // @Injectable()
// // // // export class AianomlyService {
// // // //   private electrical;
// // // //   private eng;

// // // //   constructor(
// // // //     @Inject('MONGO_CLIENT') private readonly db: Db,
// // // //     private readonly formulas: FormulasService,
// // // //   ) {
// // // //     this.electrical = this.db.collection('ae_elc_prediction_12s');
// // // //     this.eng = this.db.collection('ae_eng_prediction_12s');
// // // //   }

// // // //   // -------------------------------------------------------
// // // //   // API 1 → Chart listing only (live / historic)
// // // //   // -------------------------------------------------------
// // // //   async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
// // // //     const { mode, start, end } = payload;

// // // //     let query: any = {};
// // // //     let sortOrder = 1;
// // // //     let limit: number | undefined = undefined;

// // // //     if (mode === 'historic' && start && end) {
// // // //       query = { timestamp: { $gte: new Date(start), $lte: new Date(end) } };
// // // //     } else if (mode === 'live') {
// // // //       sortOrder = -1;
// // // //       limit = 50;
// // // //     }

// // // //     const projection = {
// // // //       timestamp: 1,
// // // //       Fused_Fisher_Score: 1,
// // // //       quantile_95: 1,
// // // //       quantile_99: 1,
// // // //       s_threshold_EVT: 1,
// // // //     };

// // // //     const [genRaw, engRaw] = await Promise.all([
// // // //       this.electrical
// // // //         .find(query)
// // // //         .project(projection)
// // // //         .sort({ timestamp: sortOrder })
// // // //         .limit(limit ?? 0)
// // // //         .toArray(),
// // // //       this.eng
// // // //         .find(query)
// // // //         .project(projection)
// // // //         .sort({ timestamp: sortOrder })
// // // //         .limit(limit ?? 0)
// // // //         .toArray(),
// // // //     ]);

// // // //     const gen = genRaw.reverse();
// // // //     const eng = engRaw.reverse();

// // // //     return {
// // // //       gen: gen.map((r) => this.makeStatus(r)),
// // // //       eng: eng.map((r) => this.makeStatus(r)),
// // // //     };
// // // //   }

// // // //   // -------------------------------------------------------
// // // //   // Timestamp formatter
// // // //   // -------------------------------------------------------
// // // //   private formatTimestamp(ts: string | Date): string {
// // // //     const date = new Date(ts);
// // // //     const monthNames = [
// // // //       'Jan',
// // // //       'Feb',
// // // //       'Mar',
// // // //       'Apr',
// // // //       'May',
// // // //       'Jun',
// // // //       'Jul',
// // // //       'Aug',
// // // //       'Sep',
// // // //       'Oct',
// // // //       'Nov',
// // // //       'Dec',
// // // //     ];
// // // //     const month = monthNames[date.getUTCMonth()];
// // // //     const day = date.getUTCDate();
// // // //     const hours = date.getUTCHours().toString().padStart(2, '0');
// // // //     const minutes = date.getUTCMinutes().toString().padStart(2, '0');
// // // //     const seconds = date.getUTCSeconds().toString().padStart(2, '0');
// // // //     return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
// // // //   }

// // // //   // -------------------------------------------------------
// // // //   // Status builder
// // // //   // -------------------------------------------------------
// // // //   private makeStatus(r: any) {
// // // //     const score = r.Fused_Fisher_Score;
// // // //     let status = 'Healthy';
// // // //     if (score > r.s_threshold_EVT) status = 'Critical';
// // // //     else if (score > r.quantile_99) status = 'Threat';
// // // //     else if (score > r.quantile_95) status = 'Warning';

// // // //     return {
// // // //       _id: r._id,
// // // //       timestamp: this.formatTimestamp(r.timestamp),
// // // //       score,
// // // //       status,
// // // //     };
// // // //   }

// // // //   // -------------------------------------------------------
// // // //   // API 2 → Anomaly details
// // // //   // -------------------------------------------------------
// // // //   // async getAnomalyDetails(params: {
// // // //   //   id: string;
// // // //   //   mode?: string;
// // // //   //   start?: string;
// // // //   //   end?: string;
// // // //   // }) {
// // // //   //   const { id, mode, start, end } = params;
// // // //   //   const _id = new ObjectId(id);

// // // //   //   const [eRec, engRec] = await Promise.all([
// // // //   //     this.electrical.findOne({ _id }),
// // // //   //     this.eng.findOne({ _id }),
// // // //   //   ]);

// // // //   //   const record = eRec || engRec;
// // // //   //   if (!record) return { error: 'Record not found' };

// // // //   //   const score = record.Fused_Fisher_Score;
// // // //   //   let status = 'Healthy';
// // // //   //   let featureString = '';

// // // //   //   if (score > record.s_threshold_EVT)
// // // //   //     featureString = record.top_features_evt_metric;
// // // //   //   else if (score > record.quantile_99)
// // // //   //     featureString = record.top_features_99th_metric;
// // // //   //   else if (score > record.quantile_95)
// // // //   //     featureString = record.top_features_95th_metric;
// // // //   //   else featureString = record.top_features_95th_metric;

// // // //   //   const featureList =
// // // //   //     featureString?.split(',').map((f) => f.trim().replace('_RE', '')) ?? [];

// // // //   //   // Contributions logic
// // // //   //   const contributions: Record<string, number> = {};
// // // //   //   featureList.forEach((f) => {
// // // //   //     const match = f.match(/-?\d+(\.\d+)?$/);
// // // //   //     contributions[f] = match ? parseFloat(match[0]) : 0;
// // // //   //   });

// // // //   //   // Load last 100 values
// // // //   //   const last100Values = await this.loadLast100Safe(
// // // //   //     featureList,
// // // //   //     mode as any,
// // // //   //     start,
// // // //   //     end,
// // // //   //   );

// // // //   //   return {
// // // //   //     timestamp: this.formatTimestamp(record.timestamp),
// // // //   //     status,
// // // //   //     features: featureList,
// // // //   //     contribution: contributions,
// // // //   //     last_100_values: last100Values,
// // // //   //   };
// // // //   // }

// // // //   async getAnomalyDetails(params: {
// // // //     id: string;
// // // //     mode?: 'live' | 'historic';
// // // //     start?: string;
// // // //     end?: string;
// // // //   }) {
// // // //     const { id, mode, start, end } = params;
// // // //     const _id = new ObjectId(id);

// // // //     // 🔹 Find record from both collections
// // // //     const [elcRec, engRec] = await Promise.all([
// // // //       this.electrical.findOne({ _id }),
// // // //       this.eng.findOne({ _id }),
// // // //     ]);

// // // //     const record = elcRec || engRec;
// // // //     if (!record) return { error: 'Record not found' };

// // // //     // 🔹 Decide source collection
// // // //     const sourceCollection = elcRec ? this.electrical : this.eng;

// // // //     const score = record.Fused_Fisher_Score;
// // // //     let status = 'Healthy';
// // // //     let featureString = '';

// // // //     if (score > record.s_threshold_EVT) {
// // // //       status = 'Critical';
// // // //       featureString = record.top_features_evt_metric;
// // // //     } else if (score > record.quantile_99) {
// // // //       status = 'Threat';
// // // //       featureString = record.top_features_99th_metric;
// // // //     } else if (score > record.quantile_95) {
// // // //       status = 'Warning';
// // // //       featureString = record.top_features_95th_metric;
// // // //     } else {
// // // //       featureString = record.top_features_95th_metric;
// // // //     }

// // // //     // 🔹 Feature list
// // // //     const features =
// // // //       featureString
// // // //         ?.split(',')
// // // //         .map((f: string) => f.trim().replace('_RE', '')) ?? [];

// // // //     // 🔹 Last 100 values (FROM SAME COLLECTION)
// // // //     const last100Values = await this.loadLast100FromSource(
// // // //       features,
// // // //       sourceCollection,
// // // //       mode,
// // // //       start,
// // // //       end,
// // // //     );

// // // //     // 🔹 Contribution from feature name (number at end)
// // // //     const contribution: Record<string, number> = {};
// // // //     features.forEach((f) => {
// // // //       const match = f.match(/-?\d+(\.\d+)?$/);
// // // //       contribution[f] = match ? parseFloat(match[0]) : 0;
// // // //     });

// // // //     return {
// // // //       timestamp: this.formatTimestamp(record.timestamp),
// // // //       status,
// // // //       features,
// // // //       contribution,
// // // //       last_100_values: last100Values,
// // // //     };
// // // //   }

// // // //   // -------------------------------------------------------
// // // //   // Load last 100 values with DB mapping
// // // //   // -------------------------------------------------------
// // // //   // private async loadLast100Safe(
// // // //   //   features: string[],
// // // //   //   mode?: 'live' | 'historic',
// // // //   //   start?: string,
// // // //   //   end?: string,
// // // //   // ): Promise<Record<string, (number | null)[]>> {
// // // //   //   const result: Record<string, (number | null)[]> = {};
// // // //   //   if (!features?.length) return result;

// // // //   //   const calculated = new Set([
// // // //   //     'Voltage_Imbalance_%',
// // // //   //     'Current_Imbalance_%',
// // // //   //     'Electrical_Stress_RMS',
// // // //   //     'Neutral_Current',
// // // //   //     'Load_Percent',
// // // //   //     'Power_Loss_Index',
// // // //   //     'RPM_stability_index',
// // // //   //   ]);

// // // //   //   const rawFeatures = features.filter((f) => !calculated.has(f));
// // // //   //   const calcFeatures = features.filter((f) => calculated.has(f));

// // // //   //   // Map frontend key to DB field
// // // //   //   const dbFieldMap: Record<string, string> = {};
// // // //   //   rawFeatures.forEach((f) => {
// // // //   //     dbFieldMap[f] = f.replace(/_Q[-]?\d+(\.\d+)?$/, ''); // e.g. Fuel_Rate_Q_17.09 -> Fuel_Rate
// // // //   //   });

// // // //   //   // RAW features
// // // //   //   if (rawFeatures.length > 0) {
// // // //   //     const facetStages = rawFeatures.reduce(
// // // //   //       (acc, f) => {
// // // //   //         const dbField = dbFieldMap[f];
// // // //   //         const safeKey = dbField
// // // //   //           .replace(/\./g, '_')
// // // //   //           .replace(/[^a-zA-Z0-9_]/g, '_');
// // // //   //         const matchStage: any = {
// // // //   //           [dbField]: { $exists: true },
// // // //   //           Genset_Run_SS: { $gt: 0 },
// // // //   //         };

// // // //   //         if (mode === 'historic' && start && end) {
// // // //   //           const startDate = new Date(start);
// // // //   //           const endDate = new Date(end);
// // // //   //           acc[`${safeKey}_prev`] = [
// // // //   //             { $match: { ...matchStage, timestamp: { $lt: startDate } } },
// // // //   //             { $sort: { timestamp: -1 } },
// // // //   //             { $limit: 100 },
// // // //   //             { $project: { value: `$${dbField}`, _id: 0 } },
// // // //   //           ];
// // // //   //           acc[`${safeKey}_next`] = [
// // // //   //             { $match: { ...matchStage, timestamp: { $gt: endDate } } },
// // // //   //             { $sort: { timestamp: 1 } },
// // // //   //             { $limit: 100 },
// // // //   //             { $project: { value: `$${dbField}`, _id: 0 } },
// // // //   //           ];
// // // //   //         } else {
// // // //   //           acc[safeKey] = [
// // // //   //             { $match: matchStage },
// // // //   //             { $sort: { timestamp: -1 } },
// // // //   //             { $limit: 100 },
// // // //   //             { $project: { value: `$${dbField}`, _id: 0 } },
// // // //   //           ];
// // // //   //         }
// // // //   //         return acc;
// // // //   //       },
// // // //   //       {} as Record<string, any[]>,
// // // //   //     );

// // // //   //     const aggregated = (
// // // //   //       await this.navy.aggregate([{ $facet: facetStages }]).toArray()
// // // //   //     )[0];

// // // //   //     rawFeatures.forEach((f) => {
// // // //   //       const dbField = dbFieldMap[f];
// // // //   //       const safeKey = dbField
// // // //   //         .replace(/\./g, '_')
// // // //   //         .replace(/[^a-zA-Z0-9_]/g, '_');
// // // //   //       if (mode === 'historic' && start && end) {
// // // //   //         const prev =
// // // //   //           aggregated[`${safeKey}_prev`]
// // // //   //             ?.map((x: any) => x.value ?? null)
// // // //   //             .reverse() ?? [];
// // // //   //         const next =
// // // //   //           aggregated[`${safeKey}_next`]?.map((x: any) => x.value ?? null) ??
// // // //   //           [];
// // // //   //         result[f] = [...prev, ...next];
// // // //   //       } else {
// // // //   //         result[f] =
// // // //   //           aggregated[safeKey]?.map((x: any) => x.value ?? null) ?? [];
// // // //   //       }
// // // //   //     });
// // // //   //   }

// // // //   //   // Calculated features
// // // //   //   if (calcFeatures.length > 0) {
// // // //   //     let docsQuery: any[] = [];
// // // //   //     if (mode === 'historic' && start && end) {
// // // //   //       const startDate = new Date(start);
// // // //   //       const endDate = new Date(end);
// // // //   //       const prevDocs = await this.navy
// // // //   //         .find({ timestamp: { $lt: startDate } })
// // // //   //         .sort({ timestamp: -1 })
// // // //   //         .limit(100)
// // // //   //         .toArray();
// // // //   //       const nextDocs = await this.navy
// // // //   //         .find({ timestamp: { $gt: endDate } })
// // // //   //         .sort({ timestamp: 1 })
// // // //   //         .limit(100)
// // // //   //         .toArray();
// // // //   //       docsQuery = [...prevDocs.reverse(), ...nextDocs];
// // // //   //     } else {
// // // //   //       docsQuery = await this.navy
// // // //   //         .find({})
// // // //   //         .sort({ timestamp: -1 })
// // // //   //         .limit(300)
// // // //   //         .toArray();
// // // //   //     }

// // // //   //     calcFeatures.forEach((f) => {
// // // //   //       const values: (number | null)[] = [];
// // // //   //       for (const doc of docsQuery) {
// // // //   //         if (values.length >= 100) break;
// // // //   //         let val: number | null = null;
// // // //   //         switch (f) {
// // // //   //           case 'Voltage_Imbalance_%':
// // // //   //             val = this.formulas.calculateVoltageImbalance(doc);
// // // //   //             break;
// // // //   //           case 'Current_Imbalance_%':
// // // //   //             val = this.formulas.calculateCurrentImbalance(doc);
// // // //   //             break;
// // // //   //           case 'Electrical_Stress_RMS':
// // // //   //             val = this.formulas.calculateElectricalStress(doc);
// // // //   //             break;
// // // //   //           case 'Neutral_Current':
// // // //   //             val = this.formulas.calculateNeutralCurrent(doc);
// // // //   //             break;
// // // //   //           case 'Load_Percent':
// // // //   //             val = this.formulas.calculateLoadPercent(doc);
// // // //   //             break;
// // // //   //           case 'Power_Loss_Index':
// // // //   //             val = this.formulas.calculatePowerLossFactor(doc);
// // // //   //             break;
// // // //   //           case 'RPM_stability_index':
// // // //   //             val =
// // // //   //               this.formulas.calculateRPMStabilityWithLoad([doc])[0]
// // // //   //                 ?.RPM_Stability_Index ?? null;
// // // //   //             break;
// // // //   //         }
// // // //   //         values.push(val);
// // // //   //       }
// // // //   //       result[f] = values.reverse();
// // // //   //     });
// // // //   //   }

// // // //   //   return result;
// // // //   // }

// // // //   private async loadLast100FromSource(
// // // //     features: string[],
// // // //     collection,
// // // //     mode?: 'live' | 'historic',
// // // //     start?: string,
// // // //     end?: string,
// // // //   ): Promise<Record<string, (number | null)[]>> {
// // // //     const result: Record<string, (number | null)[]> = {};
// // // //     if (!features?.length) return result;

// // // //     // 🔹 Remove _Q_ / _T2_ numeric suffix
// // // //     const cleanField = (f: string) => f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, '');

// // // //     for (const feature of features) {
// // // //       const field = cleanField(feature);

// // // //       if (mode === 'historic' && start && end) {
// // // //         const startDate = new Date(start);
// // // //         const endDate = new Date(end);

// // // //         const prev = await collection
// // // //           .find({ [field]: { $exists: true }, timestamp: { $lt: startDate } })
// // // //           .sort({ timestamp: -1 })
// // // //           .limit(50)
// // // //           .toArray();

// // // //         const next = await collection
// // // //           .find({ [field]: { $exists: true }, timestamp: { $gt: endDate } })
// // // //           .sort({ timestamp: 1 })
// // // //           .limit(50)
// // // //           .toArray();

// // // //         result[feature] = [
// // // //           ...prev.reverse().map((d) => d[field] ?? null),
// // // //           ...next.map((d) => d[field] ?? null),
// // // //         ];
// // // //       } else {
// // // //         const docs = await collection
// // // //           .find({ [field]: { $exists: true } })
// // // //           .sort({ timestamp: -1 })
// // // //           .limit(100)
// // // //           .toArray();

// // // //         result[feature] = docs.reverse().map((d) => d[field] ?? null);
// // // //       }
// // // //     }

// // // //     return result;
// // // //   }
// // // // }

// // // /* eslint-disable @typescript-eslint/no-unsafe-argument */
// // // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // // /* eslint-disable @typescript-eslint/no-unsafe-assignment */

// // // import { Injectable, Inject } from '@nestjs/common';
// // // import { Db, ObjectId } from 'mongodb';
// // // import { FormulasService } from 'src/trends/formulas.service';

// // // @Injectable()
// // // export class AianomlyService {
// // //   private electrical;
// // //   private eng;
// // //   private navy;

// // //   constructor(
// // //     @Inject('MONGO_CLIENT') private readonly db: Db,
// // //     private readonly formulas: FormulasService,
// // //   ) {
// // //     this.electrical = this.db.collection('ae_elc_prediction_12s');
// // //     this.eng = this.db.collection('ae_eng_prediction_12s');
// // //     this.navy = this.db.collection('navy_12s');
// // //   }

// // //   // -------------------------------
// // //   // Helper → string-safe ISO timestamp
// // //   // -------------------------------
// // //   private toISOStringSafe(value?: string | Date) {
// // //     if (!value) return null;
// // //     if (value instanceof Date) return value.toISOString();
// // //     return new Date(value).toISOString();
// // //   }

// // //   // -------------------------------
// // //   // API 1 → Chart listing only
// // //   // -------------------------------
// // //   async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
// // //     const { mode, start, end } = payload;

// // //     let query: any = {};
// // //     let sortOrder = 1;
// // //     let limit: number | undefined = undefined;

// // //     if (mode === 'historic' && start && end) {
// // //       const s = this.toISOStringSafe(start);
// // //       const e = this.toISOStringSafe(end);
// // //       query = { timestamp: { $gte: s, $lte: e } };
// // //     } else if (mode === 'live') {
// // //       sortOrder = -1;
// // //       limit = 50; // fetch last 50 for live
// // //     }

// // //     const projection = {
// // //       timestamp: 1,
// // //       Fused_Fisher_Score: 1,
// // //       quantile_95: 1,
// // //       quantile_99: 1,
// // //       s_threshold_EVT: 1,
// // //     };

// // //     const [genRaw, engRaw] = await Promise.all([
// // //       this.electrical
// // //         .find(query)
// // //         .project(projection)
// // //         .sort({ timestamp: sortOrder })
// // //         .limit(limit ?? 0)
// // //         .toArray(),
// // //       this.eng
// // //         .find(query)
// // //         .project(projection)
// // //         .sort({ timestamp: sortOrder })
// // //         .limit(limit ?? 0)
// // //         .toArray(),
// // //     ]);

// // //     return {
// // //       gen: genRaw.reverse().map((r) => this.makeStatus(r)),
// // //       eng: engRaw.reverse().map((r) => this.makeStatus(r)),
// // //     };
// // //   }

// // //   // -------------------------------
// // //   // Timestamp formatter (string-safe)
// // //   // -------------------------------
// // //   private formatTimestamp(ts: string | Date): string {
// // //     const date = typeof ts === 'string' ? new Date(ts) : ts;
// // //     const monthNames = [
// // //       'Jan',
// // //       'Feb',
// // //       'Mar',
// // //       'Apr',
// // //       'May',
// // //       'Jun',
// // //       'Jul',
// // //       'Aug',
// // //       'Sep',
// // //       'Oct',
// // //       'Nov',
// // //       'Dec',
// // //     ];
// // //     const month = monthNames[date.getUTCMonth()];
// // //     const day = date.getUTCDate();
// // //     const hours = date.getUTCHours().toString().padStart(2, '0');
// // //     const minutes = date.getUTCMinutes().toString().padStart(2, '0');
// // //     const seconds = date.getUTCSeconds().toString().padStart(2, '0');
// // //     return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
// // //   }

// // //   // -------------------------------
// // //   // Status builder
// // //   // -------------------------------
// // //   private makeStatus(r: any) {
// // //     const score = r.Fused_Fisher_Score;
// // //     let status = 'Healthy';
// // //     if (score > r.s_threshold_EVT) status = 'Critical';
// // //     else if (score > r.quantile_99) status = 'Threat';
// // //     else if (score > r.quantile_95) status = 'Warning';

// // //     return {
// // //       _id: r._id,
// // //       timestamp: this.formatTimestamp(r.timestamp),
// // //       score,
// // //       status,
// // //     };
// // //   }

// // //   // -------------------------------
// // //   // API 2 → Anomaly details
// // //   // -------------------------------
// // //   async getAnomalyDetails(params: {
// // //     id: string;
// // //     mode?: 'live' | 'historic';
// // //     start?: string;
// // //     end?: string;
// // //   }) {
// // //     const { id, mode, start, end } = params;
// // //     const _id = new ObjectId(id);

// // //     const [elcRec, engRec] = await Promise.all([
// // //       this.electrical.findOne({ _id }),
// // //       this.eng.findOne({ _id }),
// // //     ]);

// // //     const record = elcRec || engRec;
// // //     if (!record) return { error: 'Record not found' };

// // //     const sourceCollection = elcRec ? this.electrical : this.eng;

// // //     const score = record.Fused_Fisher_Score;
// // //     let status = 'Healthy';
// // //     let featureString = '';

// // //     if (score > record.s_threshold_EVT) {
// // //       status = 'Critical';
// // //       featureString = record.top_features_evt_metric;
// // //     } else if (score > record.quantile_99) {
// // //       status = 'Threat';
// // //       featureString = record.top_features_99th_metric;
// // //     } else if (score > record.quantile_95) {
// // //       status = 'Warning';
// // //       featureString = record.top_features_95th_metric;
// // //     } else {
// // //       featureString = record.top_features_95th_metric;
// // //     }

// // //     const features =
// // //       featureString?.split(',').map((f) => f.trim().replace('_RE', '')) ?? [];

// // //     const last100Values = await this.loadLast100FromSource(
// // //       features,
// // //       sourceCollection,
// // //       mode,
// // //       start,
// // //       end,
// // //     );

// // //     const contribution: Record<string, number> = {};
// // //     features.forEach((f) => {
// // //       const match = f.match(/-?\d+(\.\d+)?$/);
// // //       contribution[f] = match ? parseFloat(match[0]) : 0;
// // //     });

// // //     return {
// // //       timestamp: this.formatTimestamp(record.timestamp),
// // //       status,
// // //       features,
// // //       contribution,
// // //       last_100_values: last100Values,
// // //     };
// // //   }

// // //   // -------------------------------
// // //   // Load last 100 values → string timestamp safe
// // //   // -------------------------------
// // //   private async loadLast100FromSource(
// // //     features: string[],
// // //     collection,
// // //     mode?: 'live' | 'historic',
// // //     start?: string,
// // //     end?: string,
// // //   ): Promise<Record<string, (number | null)[]>> {
// // //     const result: Record<string, (number | null)[]> = {};
// // //     if (!features?.length) return result;

// // //     const cleanField = (f: string) => f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, '');

// // //     for (const feature of features) {
// // //       const field = cleanField(feature);

// // //       if (mode === 'historic' && start && end) {
// // //         const startISO = this.toISOStringSafe(start);
// // //         const endISO = this.toISOStringSafe(end);

// // //         const prev = await collection
// // //           .find({ [field]: { $exists: true }, timestamp: { $lt: startISO } })
// // //           .sort({ timestamp: -1 })
// // //           .limit(50)
// // //           .toArray();

// // //         const next = await collection
// // //           .find({ [field]: { $exists: true }, timestamp: { $gt: endISO } })
// // //           .sort({ timestamp: 1 })
// // //           .limit(50)
// // //           .toArray();

// // //         result[feature] = [
// // //           ...prev.reverse().map((d) => d[field] ?? null),
// // //           ...next.map((d) => d[field] ?? null),
// // //         ];
// // //       } else {
// // //         const docs = await collection
// // //           .find({ [field]: { $exists: true } })
// // //           .sort({ timestamp: -1 })
// // //           .limit(100)
// // //           .toArray();

// // //         result[feature] = docs.reverse().map((d) => d[field] ?? null);
// // //       }
// // //     }

// // //     return result;
// // //   }
// // // }

// // /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // /* eslint-disable @typescript-eslint/no-unsafe-return */

// // import { Injectable, Inject } from '@nestjs/common';
// // import { Db, ObjectId } from 'mongodb';
// // import { FormulasService } from 'src/trends/formulas.service';

// // @Injectable()
// // export class AianomlyService {
// //   private electrical;
// //   private eng;
// //   private navy;

// //   constructor(
// //     @Inject('MONGO_CLIENT') private readonly db: Db,
// //     private readonly formulas: FormulasService,
// //   ) {
// //     this.electrical = this.db.collection('ae_elc_prediction_12s');
// //     this.eng = this.db.collection('ae_eng_prediction_12s');
// //     this.navy = this.db.collection('navy_12s');
// //   }

// //   private toISOStringSafe(value?: string | Date) {
// //     if (!value) return null;
// //     if (value instanceof Date) return value.toISOString();
// //     return new Date(value).toISOString();
// //   }

// //   private formatTimestamp(ts: string | Date): string {
// //     const date = typeof ts === 'string' ? new Date(ts) : ts;
// //     const monthNames = [
// //       'Jan',
// //       'Feb',
// //       'Mar',
// //       'Apr',
// //       'May',
// //       'Jun',
// //       'Jul',
// //       'Aug',
// //       'Sep',
// //       'Oct',
// //       'Nov',
// //       'Dec',
// //     ];
// //     const month = monthNames[date.getUTCMonth()];
// //     const day = date.getUTCDate();
// //     const hours = date.getUTCHours().toString().padStart(2, '0');
// //     const minutes = date.getUTCMinutes().toString().padStart(2, '0');
// //     const seconds = date.getUTCSeconds().toString().padStart(2, '0');
// //     return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
// //   }

// //   private makeStatus(r: any) {
// //     const score = r.Fused_Fisher_Score;
// //     let status = 'Healthy';
// //     if (score > r.s_threshold_EVT) status = 'Critical';
// //     else if (score > r.quantile_99) status = 'Threat';
// //     else if (score > r.quantile_95) status = 'Warning';

// //     return {
// //       _id: r._id,
// //       timestamp: this.formatTimestamp(r.timestamp),
// //       score,
// //       status,
// //     };
// //   }

// //   async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
// //     const { mode, start, end } = payload;

// //     let query: any = {};
// //     let sortOrder = 1;
// //     let limit: number | undefined = undefined;

// //     if (mode === 'historic' && start && end) {
// //       const s = this.toISOStringSafe(start);
// //       const e = this.toISOStringSafe(end);
// //       query = { timestamp: { $gte: s, $lte: e } };
// //     } else if (mode === 'live') {
// //       sortOrder = -1;
// //       limit = 50;
// //     }

// //     const projection = {
// //       timestamp: 1,
// //       Fused_Fisher_Score: 1,
// //       quantile_95: 1,
// //       quantile_99: 1,
// //       s_threshold_EVT: 1,
// //     };

// //     const [genRaw, engRaw] = await Promise.all([
// //       this.electrical
// //         .find(query)
// //         .project(projection)
// //         .sort({ timestamp: sortOrder })
// //         .limit(limit ?? 0)
// //         .toArray(),
// //       this.eng
// //         .find(query)
// //         .project(projection)
// //         .sort({ timestamp: sortOrder })
// //         .limit(limit ?? 0)
// //         .toArray(),
// //     ]);

// //     return {
// //       gen: genRaw.reverse().map((r) => this.makeStatus(r)),
// //       eng: engRaw.reverse().map((r) => this.makeStatus(r)),
// //     };
// //   }

// //   async getAnomalyDetails(params: {
// //     id: string;
// //     mode?: 'live' | 'historic';
// //     start?: string;
// //     end?: string;
// //   }) {
// //     const { id, mode, start, end } = params;
// //     const _id = new ObjectId(id);

// //     const [elcRec, engRec] = await Promise.all([
// //       this.electrical.findOne({ _id }),
// //       this.eng.findOne({ _id }),
// //     ]);

// //     const record = elcRec || engRec;
// //     if (!record) return { error: 'Record not found' };

// //     const sourceCollection = elcRec ? this.electrical : this.eng;

// //     const score = record.Fused_Fisher_Score;
// //     let status = 'Healthy';
// //     let featureString = '';

// //     if (score > record.s_threshold_EVT) {
// //       status = 'Critical';
// //       featureString = record.top_features_evt_metric;
// //     } else if (score > record.quantile_99) {
// //       status = 'Threat';
// //       featureString = record.top_features_99th_metric;
// //     } else if (score > record.quantile_95) {
// //       status = 'Warning';
// //       featureString = record.top_features_95th_metric;
// //     } else {
// //       featureString = record.top_features_95th_metric;
// //     }

// //     const features =
// //       featureString?.split(',').map((f) => f.trim().replace('_RE', '')) ?? [];

// //     const last100Values = await this.loadLast100Batch(
// //       features,
// //       sourceCollection,
// //       mode,
// //       start,
// //       end,
// //     );

// //     const contribution: Record<string, number> = {};
// //     features.forEach((f) => {
// //       const match = f.match(/-?\d+(\.\d+)?$/);
// //       contribution[f] = match ? parseFloat(match[0]) : 0;
// //     });

// //     return {
// //       timestamp: this.formatTimestamp(record.timestamp),
// //       status,
// //       features,
// //       contribution,
// //       last_100_values: last100Values,
// //     };
// //   }

// //   // -------------------------------
// //   // Optimized batch fetch for last 100 values
// //   // -------------------------------
// //   private async loadLast100Batch(
// //     features: string[],
// //     collection,
// //     mode?: 'live' | 'historic',
// //     start?: string,
// //     end?: string,
// //   ): Promise<Record<string, (number | null)[]>> {
// //     const result: Record<string, (number | null)[]> = {};
// //     if (!features?.length) return result;

// //     const fields = features.map((f) =>
// //       f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, ''),
// //     );
// //     const query: any = { $or: fields.map((f) => ({ [f]: { $exists: true } })) };

// //     if (mode === 'historic' && start && end) {
// //       const s = this.toISOStringSafe(start);
// //       const e = this.toISOStringSafe(end);
// //       query.timestamp = { $gte: s, $lte: e };
// //     }

// //     const docs = await collection
// //       .find(query)
// //       .sort({ timestamp: -1 })
// //       .limit(100)
// //       .toArray();

// //     fields.forEach((f, i) => {
// //       result[features[i]] = docs.reverse().map((d) => (f in d ? d[f] : null));
// //     });

// //     return result;
// //   }
// // }

// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-return */

// import { Injectable, Inject } from '@nestjs/common';
// import { Db, ObjectId } from 'mongodb';
// import { FormulasService } from 'src/trends/formulas.service';

// @Injectable()
// export class AianomlyService {
//   private electrical;
//   private eng;
//   private navy;

//   constructor(
//     @Inject('MONGO_CLIENT') private readonly db: Db,
//     private readonly formulas: FormulasService,
//   ) {
//     this.electrical = this.db.collection('ae_elc_prediction_12s');
//     this.eng = this.db.collection('ae_eng_prediction_12s');
//     this.navy = this.db.collection('navy_12s');
//   }

//   private toISOStringSafe(value?: string | Date) {
//     if (!value) return null;
//     if (value instanceof Date) return value.toISOString();
//     return new Date(value).toISOString();
//   }

//   // Karachi timezone formatter (NO UTC shift)
//   private formatTimestamp(ts: string | Date): string {
//     const date = typeof ts === 'string' ? new Date(ts) : ts;
//     const monthNames = [
//       'Jan',
//       'Feb',
//       'Mar',
//       'Apr',
//       'May',
//       'Jun',
//       'Jul',
//       'Aug',
//       'Sep',
//       'Oct',
//       'Nov',
//       'Dec',
//     ];
//     return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date
//       .getHours()
//       .toString()
//       .padStart(
//         2,
//         '0',
//       )}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
//   }

//   private makeStatus(r: any) {
//     const score = r.Fused_Fisher_Score;
//     let status = 'Healthy';
//     if (score > r.s_threshold_EVT) status = 'Critical';
//     else if (score > r.quantile_99) status = 'Threat';
//     else if (score > r.quantile_95) status = 'Warning';

//     return {
//       _id: r._id,
//       timestamp: this.formatTimestamp(r.timestamp),
//       score,
//       status,
//     };
//   }

//   async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
//     const { mode, start, end } = payload;
//     let query: any = {};
//     let sortOrder = 1;
//     let limit: number | undefined;

//     if (mode === 'historic' && start && end) {
//       query.timestamp = {
//         $gte: this.toISOStringSafe(start),
//         $lte: this.toISOStringSafe(end),
//       };
//     } else if (mode === 'live') {
//       sortOrder = -1;
//       limit = 50;
//     }

//     const projection = {
//       timestamp: 1,
//       Fused_Fisher_Score: 1,
//       quantile_95: 1,
//       quantile_99: 1,
//       s_threshold_EVT: 1,
//     };

//     const [genRaw, engRaw] = await Promise.all([
//       this.electrical
//         .find(query)
//         .project(projection)
//         .sort({ timestamp: sortOrder })
//         .limit(limit ?? 0)
//         .toArray(),
//       this.eng
//         .find(query)
//         .project(projection)
//         .sort({ timestamp: sortOrder })
//         .limit(limit ?? 0)
//         .toArray(),
//     ]);

//     return {
//       gen: genRaw.reverse().map((r) => this.makeStatus(r)),
//       eng: engRaw.reverse().map((r) => this.makeStatus(r)),
//     };
//   }

//   async getAnomalyDetails(params: {
//     id: string;
//     mode?: 'live' | 'historic';
//     start?: string;
//     end?: string;
//   }) {
//     const { id, mode } = params;
//     const _id = new ObjectId(id);

//     const [elcRec, engRec] = await Promise.all([
//       this.electrical.findOne({ _id }),
//       this.eng.findOne({ _id }),
//     ]);

//     const record = elcRec || engRec;
//     if (!record) return { error: 'Record not found' };

//     const sourceCollection = elcRec ? this.electrical : this.eng;
//     const score = record.Fused_Fisher_Score;

//     let status = 'Healthy';
//     let featureString = '';

//     if (score > record.s_threshold_EVT) {
//       status = 'Critical';
//       featureString = record.top_features_evt_metric;
//     } else if (score > record.quantile_99) {
//       status = 'Threat';
//       featureString = record.top_features_99th_metric;
//     } else if (score > record.quantile_95) {
//       status = 'Warning';
//       featureString = record.top_features_95th_metric;
//     }

//     // ✅ Remove _RE and _Q_XX.XX from feature names
//     const features =
//       featureString?.split(',').map((f) =>
//         f
//           .trim()
//           .replace('_RE', '')
//           .replace(/_Q_\d+(\.\d+)?$/, ''),
//       ) ?? [];

//     const values =
//       mode === 'historic'
//         ? await this.loadCenteredWindow(
//             features,
//             sourceCollection,
//             record.timestamp,
//           )
//         : await this.loadLast100Batch(features, sourceCollection);

//     return {
//       timestamp: this.formatTimestamp(record.timestamp),
//       status,
//       features,
//       last_100_values: values,
//     };
//   }

//   private async loadLast100Batch(
//     features: string[],
//     collection,
//   ): Promise<Record<string, { value: number | null; timestamp: string }[]>> {
//     const result: Record<
//       string,
//       { value: number | null; timestamp: string }[]
//     > = {};
//     if (!features.length) return result;

//     const fields = features.map((f) =>
//       f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, ''),
//     );

//     const projection = {
//       timestamp: 1,
//       ...Object.fromEntries(fields.map((f) => [f, 1])),
//     };

//     const docs = await collection
//       .find({}, { projection })
//       .sort({ timestamp: -1 })
//       .limit(100)
//       .toArray();

//     fields.forEach((f, i) => {
//       result[features[i]] = docs.reverse().map((d) => ({
//         value: f in d ? d[f] : null,
//         timestamp: this.formatTimestamp(d.timestamp),
//       }));
//     });

//     return result;
//   }

//   private async loadCenteredWindow(
//     features: string[],
//     collection,
//     anomalyTs: string,
//   ): Promise<{ previous: Record<string, any[]>; next: Record<string, any[]> }> {
//     const fields = features.map((f) =>
//       f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, ''),
//     );

//     const projection = {
//       timestamp: 1,
//       ...Object.fromEntries(fields.map((f) => [f, 1])),
//     };

//     const prevDocs = await collection
//       .find({ timestamp: { $lt: anomalyTs } }, { projection })
//       .sort({ timestamp: -1 })
//       .limit(100)
//       .toArray();
//     const nextDocs = await collection
//       .find({ timestamp: { $gt: anomalyTs } }, { projection })
//       .sort({ timestamp: 1 })
//       .limit(100)
//       .toArray();

//     const format = (docs) => {
//       const block = {};
//       fields.forEach((f, i) => {
//         block[features[i]] = docs.map((d) => ({
//           value: f in d ? d[f] : null,
//           timestamp: this.formatTimestamp(d.timestamp),
//         }));
//       });
//       return block;
//     };

//     return {
//       previous: format(prevDocs.reverse()),
//       next: format(nextDocs),
//     };
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable, Inject } from '@nestjs/common';
import { Db, ObjectId } from 'mongodb';
import { FormulasService } from 'src/trends/formulas.service';

@Injectable()
export class AianomlyService {
  private electrical;
  private eng;
  private navy;

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulas: FormulasService,
  ) {
    this.electrical = this.db.collection('ae_elc_prediction_12s');
    this.eng = this.db.collection('ae_eng_prediction_12s');
    this.navy = this.db.collection('navy_12s');
  }

  private toISOStringSafe(value?: string | Date) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    return new Date(value).toISOString();
  }

  private formatTimestamp(ts: string | Date): string {
    const date = typeof ts === 'string' ? new Date(ts) : ts;
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
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date
      .getHours()
      .toString()
      .padStart(
        2,
        '0',
      )}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  }

  private makeStatus(r: any) {
    const score = r.Fused_Fisher_Score;
    let status = 'Healthy';
    if (score > r.s_threshold_EVT) status = 'Critical';
    else if (score > r.quantile_99) status = 'Threat';
    else if (score > r.quantile_95) status = 'Warning';

    return {
      _id: r._id,
      timestamp: this.formatTimestamp(r.timestamp),
      score,
      status,
    };
  }

  async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
    const { mode, start, end } = payload;
    let query: any = {};
    let sortOrder = 1;
    let limit: number | undefined;

    if (mode === 'historic' && start && end) {
      query.timestamp = {
        $gte: this.toISOStringSafe(start),
        $lte: this.toISOStringSafe(end),
      };
    } else if (mode === 'live') {
      sortOrder = -1;
      limit = 50;
    }

    const projection = {
      timestamp: 1,
      Fused_Fisher_Score: 1,
      quantile_95: 1,
      quantile_99: 1,
      s_threshold_EVT: 1,
    };

    const [genRaw, engRaw] = await Promise.all([
      this.electrical
        .find(query)
        .project(projection)
        .sort({ timestamp: sortOrder })
        .limit(limit ?? 0)
        .toArray(),
      this.eng
        .find(query)
        .project(projection)
        .sort({ timestamp: sortOrder })
        .limit(limit ?? 0)
        .toArray(),
    ]);

    return {
      gen: genRaw.reverse().map((r) => this.makeStatus(r)),
      eng: engRaw.reverse().map((r) => this.makeStatus(r)),
    };
  }

  async getAnomalyDetails(params: {
    id: string;
    mode?: 'live' | 'historic';
    start?: string;
    end?: string;
  }) {
    const { id, mode } = params;
    const _id = new ObjectId(id);

    const [elcRec, engRec] = await Promise.all([
      this.electrical.findOne({ _id }),
      this.eng.findOne({ _id }),
    ]);

    const record = elcRec || engRec;
    if (!record) return { error: 'Record not found' };

    const sourceCollection = elcRec ? this.electrical : this.eng;
    const score = record.Fused_Fisher_Score;

    let status = 'Healthy';
    let featureString = '';

    if (score > record.s_threshold_EVT) {
      status = 'Critical';
      featureString = record.top_features_evt_metric;
    } else if (score > record.quantile_99) {
      status = 'Threat';
      featureString = record.top_features_99th_metric;
    } else if (score > record.quantile_95) {
      status = 'Warning';
      featureString = record.top_features_95th_metric;
    }

    // ✅ Clean feature names and generate contribution from _Q_XX.XX
    const features: string[] = [];
    const contribution: Record<string, number> = {};

    featureString?.split(',').forEach((f) => {
      const trimmed = f.trim();
      const match = trimmed.match(/(.+)_Q_(\d+(\.\d+)?)/);
      if (match) {
        const cleanKey = match[1]; // feature name without _Q_XX.XX
        const value = parseFloat(match[2]); // numeric score
        features.push(cleanKey);
        contribution[cleanKey] = value;
      } else {
        // fallback if no _Q_XX.XX present
        features.push(trimmed.replace('_RE', ''));
      }
    });

    const values =
      mode === 'historic'
        ? await this.loadCenteredWindow(
            features,
            sourceCollection,
            record.timestamp,
          )
        : await this.loadLast100Batch(features, sourceCollection);

    return {
      timestamp: this.formatTimestamp(record.timestamp),
      status,
      features,
      contribution,
      last_100_values: values,
    };
  }

  private async loadLast100Batch(
    features: string[],
    collection,
  ): Promise<Record<string, { value: number | null; timestamp: string }[]>> {
    const result: Record<
      string,
      { value: number | null; timestamp: string }[]
    > = {};
    if (!features.length) return result;

    const fields = features.map((f) =>
      f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, ''),
    );

    const projection = {
      timestamp: 1,
      ...Object.fromEntries(fields.map((f) => [f, 1])),
    };

    const docs = await collection
      .find({}, { projection })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    fields.forEach((f, i) => {
      result[features[i]] = docs.reverse().map((d) => ({
        value: f in d ? d[f] : null,
        timestamp: this.formatTimestamp(d.timestamp),
      }));
    });

    return result;
  }

  private async loadCenteredWindow(
    features: string[],
    collection,
    anomalyTs: string,
  ): Promise<{ previous: Record<string, any[]>; next: Record<string, any[]> }> {
    const fields = features.map((f) =>
      f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, ''),
    );

    const projection = {
      timestamp: 1,
      ...Object.fromEntries(fields.map((f) => [f, 1])),
    };

    const prevDocs = await collection
      .find({ timestamp: { $lt: anomalyTs } }, { projection })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    const nextDocs = await collection
      .find({ timestamp: { $gt: anomalyTs } }, { projection })
      .sort({ timestamp: 1 })
      .limit(100)
      .toArray();

    const format = (docs) => {
      const block = {};
      fields.forEach((f, i) => {
        block[features[i]] = docs.map((d) => ({
          value: f in d ? d[f] : null,
          timestamp: this.formatTimestamp(d.timestamp),
        }));
      });
      return block;
    };

    return {
      previous: format(prevDocs.reverse()),
      next: format(nextDocs),
    };
  }
}
