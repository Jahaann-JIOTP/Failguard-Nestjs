// // // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // // /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // // import { Injectable, Inject } from '@nestjs/common';
// // // import { Db } from 'mongodb';

// // // @Injectable()
// // // export class AianomlyService {
// // //   private electrical;
// // //   private eng;
// // //   private navy;

// // //   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
// // //     this.electrical = this.db.collection('ai_anomly_electrical');
// // //     this.eng = this.db.collection('ai_anomly_Eng');
// // //     this.navy = this.db.collection('navy_12s');
// // //   }

// // //   async getChartData(payload) {
// // //     const { mode, start, end } = payload;

// // //     const electricalData = await this.fetchData(
// // //       this.electrical,
// // //       mode,
// // //       start,
// // //       end,
// // //     );
// // //     const engData = await this.fetchData(this.eng, mode, start, end);

// // //     return {
// // //       electrical: electricalData,
// // //       eng: engData,
// // //     };
// // //   }

// // //   async fetchData(collection, mode, start?, end?) {
// // //     let records;

// // //     if (mode === 'historic') {
// // //       records = await collection
// // //         .find({
// // //           timestamp: {
// // //             $gte: new Date(start),
// // //             $lte: new Date(end),
// // //           },
// // //         })
// // //         .sort({ timestamp: 1 })
// // //         .toArray();
// // //     } else {
// // //       // LIVE MODE — latest 1 record
// // //       records = await collection
// // //         .find({})
// // //         .sort({ timestamp: -1 })
// // //         .limit(1)
// // //         .toArray();
// // //     }

// // //     return records.map((r) => this.classifyRecord(r));
// // //   }

// // //   classifyRecord(r) {
// // //     const score = r.Fused_Fisher_Score;

// // //     let status = 'Healthy';
// // //     let features = null;

// // //     if (score > r.s_threshold_EVT) {
// // //       status = 'Critical';
// // //       features = r.top_features_evt_metric;
// // //     } else if (score > r.quantile_99) {
// // //       status = 'Threat';
// // //       features = r.top_features_99th_metric;
// // //     } else if (score > r.quantile_95) {
// // //       status = 'Warning';
// // //       features = r.top_features_95th_metric;
// // //     } else {
// // //       status = 'Healthy';
// // //       features = null;
// // //     }

// // //     return {
// // //       timestamp: r.timestamp,
// // //       score,
// // //       status,
// // //       features,
// // //     };
// // //   }

// // //   async getFeatureValues(features: string[]): Promise<Record<string, any[]>> {
// // //     if (!features || features.length === 0) {
// // //       //   console.log('[DEBUG] features array is empty');
// // //       return {};
// // //     }

// // //     const result: Record<string, any[]> = {};

// // //     for (const f of features) {
// // //       //   console.log('[DEBUG] querying feature:', f);

// // //       const pipeline = [
// // //         { $match: { [f]: { $exists: true }, Genset_Run_SS: { $gt: 0 } } },
// // //         { $sort: { timestamp: -1 } }, // string ISO timestamp is fine
// // //         { $limit: 100 },
// // //         { $project: { value: `$${f}`, _id: 0 } },
// // //       ];

// // //       const points = await this.navy.aggregate(pipeline).toArray();
// // //       //   console.log(`[DEBUG] points for ${f}:`, points);

// // //       result[f] = points.map((p) => p.value ?? null);
// // //     }

// // //     // console.log('[DEBUG] final result:', result);
// // //     return result;
// // //   }
// // // }

// // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // import { Injectable, Inject } from '@nestjs/common';
// // import { Db } from 'mongodb';

// // @Injectable()
// // export class AianomlyService {
// //   private electrical;
// //   private eng;
// //   private navy;

// //   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
// //     this.electrical = this.db.collection('ai_anomly_electrical');
// //     this.eng = this.db.collection('ai_anomly_Eng');
// //     this.navy = this.db.collection('navy_12s');
// //   }

// //   // ------------------------------------------------------------------
// //   // Combined API: chart + features
// //   // ------------------------------------------------------------------
// //   async getChartAndFeatures(payload) {
// //     const { mode, start, end } = payload;

// //     const electricalData = await this.fetchData(
// //       this.electrical,
// //       mode,
// //       start,
// //       end,
// //     );
// //     const engData = await this.fetchData(this.eng, mode, start, end);

// //     // Extract unique features from all anomalies
// //     const featureSet = new Set<string>();
// //     [...electricalData, ...engData].forEach((r) => {
// //       if (r.features) {
// //         r.features
// //           .split(',')
// //           .map((f) => f.trim().replace('_RE', ''))
// //           .forEach((f) => featureSet.add(f));
// //       }
// //     });
// //     const featureArray = Array.from(featureSet);

// //     // Fetch last 100 points per feature from navy_12s
// //     const feature_values = await this.getLast100FeatureValues(featureArray);

// //     return {
// //       electrical: electricalData,
// //       eng: engData,
// //       feature_values,
// //     };
// //   }

// //   // ------------------------------------------------------------------
// //   // Fetch chart data
// //   // ------------------------------------------------------------------
// //   async fetchData(collection, mode, start?, end?) {
// //     let records;
// //     if (mode === 'historic') {
// //       records = await collection
// //         .find({
// //           timestamp: { $gte: new Date(start), $lte: new Date(end) },
// //         })
// //         .sort({ timestamp: 1 })
// //         .toArray();
// //     } else {
// //       records = await collection
// //         .find({})
// //         .sort({ timestamp: -1 })
// //         .limit(1)
// //         .toArray();
// //     }
// //     return records.map((r) => this.classifyRecord(r));
// //   }

// //   // ------------------------------------------------------------------
// //   // Classify anomaly record
// //   // ------------------------------------------------------------------
// //   classifyRecord(r) {
// //     const score = r.Fused_Fisher_Score;
// //     let status = 'Healthy';
// //     let features: string | null = null;

// //     if (score > r.s_threshold_EVT) {
// //       status = 'Critical';
// //       features = r.top_features_evt_metric;
// //     } else if (score > r.quantile_99) {
// //       status = 'Threat';
// //       features = r.top_features_99th_metric;
// //     } else if (score > r.quantile_95) {
// //       status = 'Warning';
// //       features = r.top_features_95th_metric;
// //     }

// //     return {
// //       timestamp: r.timestamp,
// //       score,
// //       status,
// //       features, // comma-separated string
// //     };
// //   }

// //   // ------------------------------------------------------------------
// //   // Get last 100 points per feature from navy_12s
// //   // ------------------------------------------------------------------
// //   async getLast100FeatureValues(
// //     features: string[],
// //   ): Promise<Record<string, any[]>> {
// //     const result: Record<string, any[]> = {};
// //     if (!features || features.length === 0) return result;

// //     for (const f of features) {
// //       const pipeline = [
// //         { $match: { [f]: { $exists: true }, Genset_Run_SS: { $gt: 0 } } },
// //         { $sort: { timestamp: -1 } }, // string timestamp is fine
// //         { $limit: 100 },
// //         { $project: { value: `$${f}`, _id: 0 } },
// //       ];
// //       const points = await this.navy.aggregate(pipeline).toArray();
// //       result[f] = points.map((p) => p.value ?? null);
// //     }

// //     return result;
// //   }
// // }

// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';
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
//     this.electrical = this.db.collection('ai_anomly_electrical');
//     this.eng = this.db.collection('ai_anomly_Eng');
//     this.navy = this.db.collection('navy_12s');
//   }

//   // ------------------------------------------------------------------
//   // Optimized combined API: chart + features
//   // ------------------------------------------------------------------
//   async getChartAndFeatures(payload: {
//     mode: string;
//     start?: string;
//     end?: string;
//     maxPoints?: number;
//   }) {
//     const { mode, start, end, maxPoints = 500 } = payload;

//     const electricalData = await this.fetchData(
//       this.electrical,
//       mode,
//       start,
//       end,
//       maxPoints,
//     );
//     const engData = await this.fetchData(this.eng, mode, start, end, maxPoints);

//     // Extract unique features from all anomalies
//     const featureSet = new Set<string>();
//     [...electricalData, ...engData].forEach((r) => {
//       if (r.features) {
//         r.features
//           .split(',')
//           .map((f) => f.trim().replace('_RE', ''))
//           .forEach((f) => featureSet.add(f));
//       }
//     });
//     const featureArray = Array.from(featureSet);

//     // Fetch last 100 points for all features in a single aggregation
//     const feature_values = await this.getLast100FeatureValues(featureArray);

//     return {
//       electrical: electricalData,
//       eng: engData,
//       feature_values,
//     };
//   }

//   // ------------------------------------------------------------------
//   // Fetch chart data (with optional maxPoints)
//   // ------------------------------------------------------------------
//   async fetchData(collection, mode, start?, end?, maxPoints = 500) {
//     let records;

//     if (mode === 'historic') {
//       records = await collection
//         .find({
//           timestamp: {
//             $gte: new Date(start),
//             $lte: new Date(end),
//           },
//         })
//         .sort({ timestamp: 1 })
//         .limit(maxPoints)
//         .toArray();
//     } else {
//       // LIVE MODE — latest 1 record
//       records = await collection
//         .find({})
//         .sort({ timestamp: -1 })
//         .limit(1)
//         .toArray();
//     }

//     return records.map((r) => this.classifyRecord(r));
//   }

//   // ------------------------------------------------------------------
//   // Classify anomaly record
//   // ------------------------------------------------------------------
//   classifyRecord(r) {
//     const score = r.Fused_Fisher_Score;
//     let status = 'Healthy';
//     let features: string | null = null;

//     if (score > r.s_threshold_EVT) {
//       status = 'Critical';
//       features = r.top_features_evt_metric;
//     } else if (score > r.quantile_99) {
//       status = 'Threat';
//       features = r.top_features_99th_metric;
//     } else if (score > r.quantile_95) {
//       status = 'Warning';
//       features = r.top_features_95th_metric;
//     }

//     return {
//       timestamp: r.timestamp,
//       score,
//       status,
//       features,
//     };
//   }

//   // ------------------------------------------------------------------
//   // Optimized: Fetch last 100 points for all features using $facet
//   // ------------------------------------------------------------------
//   // async getLast100FeatureValues(
//   //   features: string[],
//   // ): Promise<Record<string, any[]>> {
//   //   const result: Record<string, any[]> = {};
//   //   if (!features || features.length === 0) return result;

//   //   // Construct facets for all features
//   //   const facets = features.reduce((acc, f) => {
//   //     acc[f] = [
//   //       { $match: { [f]: { $exists: true }, Genset_Run_SS: { $gt: 0 } } },
//   //       { $sort: { timestamp: -1 } },
//   //       { $limit: 100 },
//   //       { $project: { value: `$${f}`, _id: 0 } },
//   //     ];
//   //     return acc;
//   //   }, {});

//   //   // Run single aggregation with $facet
//   //   const pipeline = [{ $facet: facets }];
//   //   const pointsArray = await this.navy.aggregate(pipeline).toArray();

//   //   // Map results to object
//   //   if (pointsArray.length > 0) {
//   //     const data = pointsArray[0];
//   //     for (const f of features) {
//   //       result[f] = data[f]?.map((p) => p.value ?? null) ?? [];
//   //     }
//   //   }

//   //   return result;
//   // }

//   async getLast100FeatureValuesForChart(
//     featureArray: string[],
//     electricalData: any[],
//     engData: any[],
//   ): Promise<Record<string, any[]>> {
//     await Promise.resolve(); // satisfies ESLint

//     const combinedData = [...electricalData, ...engData];
//     const result: Record<string, any[]> = {};
//     if (!featureArray || featureArray.length === 0) return result;

//     for (const f of featureArray) {
//       const values: any[] = [];
//       for (
//         let i = combinedData.length - 1;
//         i >= 0 && values.length < 100;
//         i--
//       ) {
//         const doc = combinedData[i];
//         let val: any = null;
//         switch (f) {
//           case 'Voltage_Imbalance_%':
//             val = this.formulas.calculateVoltageImbalance(doc);
//             break;
//           case 'Current_Imbalance_%':
//             val = this.formulas.calculateCurrentImbalance(doc);
//             break;
//           case 'Electrical_Stress_RMS':
//             val = this.formulas.calculateElectricalStress(doc);
//             break;
//           case 'Neutral_Current':
//             val = this.formulas.calculateNeutralCurrent(doc);
//             break;
//           case 'Load_Percent':
//             val = this.formulas.calculateLoadPercent(doc);
//             break;
//           case 'Power_Loss_Index':
//             val = this.formulas.calculatePowerLossFactor(doc);
//             break;
//           case 'RPM_stability_index':
//             val = this.formulas.calculateRPMStabilityWithLoad([doc])[0]
//               ?.RPM_Stability_Index;
//             break;
//           default:
//             val = doc[f] ?? null;
//         }
//         values.push(val);
//       }
//       result[f] = values.reverse();
//     }

//     return result;
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';
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
    this.electrical = this.db.collection('ai_anomly_electrical');
    this.eng = this.db.collection('ai_anomly_Eng');
    this.navy = this.db.collection('navy_12s');
  }

  // ------------------------------------------------------------------
  // Optimized combined API: chart + features
  // ------------------------------------------------------------------
  async getChartAndFeatures(payload: {
    mode: string;
    start?: string;
    end?: string;
    maxPoints?: number;
  }) {
    const { mode, start, end, maxPoints = 500 } = payload;

    const electricalData = await this.fetchData(
      this.electrical,
      mode,
      start,
      end,
      maxPoints,
    );
    const engData = await this.fetchData(this.eng, mode, start, end, maxPoints);

    // Extract unique features from all anomalies
    const featureSet = new Set<string>();
    [...electricalData, ...engData].forEach((r) => {
      if (r.features) {
        r.features
          .split(',')
          .map((f) => f.trim().replace('_RE', ''))
          .forEach((f) => featureSet.add(f));
      }
    });
    const featureArray = Array.from(featureSet);

    // Fetch last 100 points for all features in a single aggregation
    const feature_values = await this.getLast100FeatureValues(
      featureArray,
      electricalData,
      engData,
    );

    return {
      electrical: electricalData,
      eng: engData,
      feature_values,
    };
  }

  // ------------------------------------------------------------------
  // Fetch chart data (with optional maxPoints)
  // ------------------------------------------------------------------
  async fetchData(collection, mode, start?, end?, maxPoints = 500) {
    let records;

    if (mode === 'historic') {
      records = await collection
        .find({
          timestamp: {
            $gte: new Date(start),
            $lte: new Date(end),
          },
        })
        .sort({ timestamp: 1 })
        .limit(maxPoints)
        .toArray();
    } else {
      // LIVE MODE — latest 1 record
      records = await collection
        .find({})
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();
    }

    return records.map((r) => this.classifyRecord(r));
  }

  // ------------------------------------------------------------------
  // Classify anomaly record
  // ------------------------------------------------------------------
  classifyRecord(r) {
    const score = r.Fused_Fisher_Score;
    let status = 'Healthy';
    let features: string | null = null;

    if (score > r.s_threshold_EVT) {
      status = 'Critical';
      features = r.top_features_evt_metric;
    } else if (score > r.quantile_99) {
      status = 'Threat';
      features = r.top_features_99th_metric;
    } else if (score > r.quantile_95) {
      status = 'Warning';
      features = r.top_features_95th_metric;
    }

    return {
      timestamp: r.timestamp,
      score,
      status,
      features,
    };
  }

  // ------------------------------------------------------------------
  // Fetch last 100 points for all features using combined electrical & eng data
  // ------------------------------------------------------------------
  // async getLast100FeatureValues(
  //   featureArray: string[],
  //   electricalData: any[] = [],
  //   engData: any[] = [],
  // ): Promise<Record<string, any[]>> {
  //   // ESLint ke liye await
  //   await Promise.resolve();

  //   // Combine electrical and eng data
  //   const combinedData = [...electricalData, ...engData];

  //   const result: Record<string, any[]> = {};

  //   if (!featureArray || featureArray.length === 0) return result;

  //   for (const f of featureArray) {
  //     const values: any[] = [];

  //     // Loop last 100 points from combined data
  //     for (
  //       let i = combinedData.length - 1;
  //       i >= 0 && values.length < 100;
  //       i--
  //     ) {
  //       const doc = combinedData[i];
  //       let val: any = null;

  //       switch (f) {
  //         case 'Voltage_Imbalance_%':
  //           val = this.formulas.calculateVoltageImbalance(doc);
  //           break;
  //         case 'Current_Imbalance_%':
  //           val = this.formulas.calculateCurrentImbalance(doc);
  //           break;
  //         case 'Electrical_Stress_RMS':
  //           val = this.formulas.calculateElectricalStress(doc);
  //           break;
  //         case 'Neutral_Current':
  //           val = this.formulas.calculateNeutralCurrent(doc);
  //           break;
  //         case 'Load_Percent':
  //           val = this.formulas.calculateLoadPercent(doc);
  //           break;
  //         case 'Power_Loss_Index':
  //           val = this.formulas.calculatePowerLossFactor(doc);
  //           break;
  //         case 'RPM_stability_index':
  //           val =
  //             this.formulas.calculateRPMStabilityWithLoad([doc])[0]
  //               ?.RPM_Stability_Index ?? null;
  //           break;
  //         default:
  //           val = doc[f] ?? null;
  //       }

  //       values.push(val);
  //     }

  //     // Reverse to ascending timestamp order
  //     result[f] = values.reverse();
  //   }

  //   return result;
  // }

  async getLast100FeatureValues(
    featureArray: string[],
    electricalData: any[] = [],
    engData: any[] = [],
  ): Promise<Record<string, any[]>> {
    await Promise.resolve(); // ESLint ke liye

    const result: Record<string, any[]> = {};
    if (!featureArray || featureArray.length === 0) return result;

    // --------------------------------------------------------
    // Step 1: Identify raw DB fields vs calculated fields
    // --------------------------------------------------------
    const calculatedFields = new Set([
      'Voltage_Imbalance_%',
      'Current_Imbalance_%',
      'Electrical_Stress_RMS',
      'Neutral_Current',
      'Load_Percent',
      'Power_Loss_Index',
      'RPM_stability_index',
    ]);

    const rawFields = featureArray.filter((f) => !calculatedFields.has(f));
    const calcFields = featureArray.filter((f) => calculatedFields.has(f));

    // --------------------------------------------------------
    // Step 2: Fetch raw fields from navy collection using $facet
    // --------------------------------------------------------
    if (rawFields.length > 0) {
      const facets = rawFields.reduce(
        (acc, f) => {
          acc[f] = [
            { $match: { [f]: { $exists: true }, Genset_Run_SS: { $gt: 0 } } },
            { $sort: { timestamp: -1 } },
            { $limit: 100 },
            { $project: { value: `$${f}`, _id: 0 } },
          ];
          return acc;
        },
        {} as Record<string, any[]>,
      );

      const pipeline = [{ $facet: facets }];
      const rawPointsArray = await this.navy.aggregate(pipeline).toArray();

      if (rawPointsArray.length > 0) {
        const data = rawPointsArray[0];
        for (const f of rawFields) {
          result[f] = data[f]?.map((p) => p.value ?? null) ?? [];
        }
      }
    }

    // --------------------------------------------------------
    // Step 3: Compute calculated features from electrical/eng data
    // --------------------------------------------------------
    if (calcFields.length > 0) {
      const combinedData = [...electricalData, ...engData];

      for (const f of calcFields) {
        const values: any[] = [];

        for (
          let i = combinedData.length - 1;
          i >= 0 && values.length < 100;
          i--
        ) {
          const doc = combinedData[i];
          let val: any = null;

          switch (f) {
            case 'Voltage_Imbalance_%':
              val = this.formulas.calculateVoltageImbalance(doc);
              break;
            case 'Current_Imbalance_%':
              val = this.formulas.calculateCurrentImbalance(doc);
              break;
            case 'Electrical_Stress_RMS':
              val = this.formulas.calculateElectricalStress(doc);
              break;
            case 'Neutral_Current':
              val = this.formulas.calculateNeutralCurrent(doc);
              break;
            case 'Load_Percent':
              val = this.formulas.calculateLoadPercent(doc);
              break;
            case 'Power_Loss_Index':
              val = this.formulas.calculatePowerLossFactor(doc);
              break;
            case 'RPM_stability_index':
              val =
                this.formulas.calculateRPMStabilityWithLoad([doc])[0]
                  ?.RPM_Stability_Index ?? null;
              break;
          }

          values.push(val);
        }

        result[f] = values.reverse();
      }
    }

    return result;
  }
}
