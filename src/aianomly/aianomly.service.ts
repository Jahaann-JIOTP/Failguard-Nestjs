// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';

// @Injectable()
// export class AianomlyService {
//   private electrical;
//   private eng;
//   private navy;

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.electrical = this.db.collection('ai_anomly_electrical');
//     this.eng = this.db.collection('ai_anomly_Eng');
//     this.navy = this.db.collection('navy_12s');
//   }

//   async getChartData(payload) {
//     const { mode, start, end } = payload;

//     const electricalData = await this.fetchData(
//       this.electrical,
//       mode,
//       start,
//       end,
//     );
//     const engData = await this.fetchData(this.eng, mode, start, end);

//     return {
//       electrical: electricalData,
//       eng: engData,
//     };
//   }

//   async fetchData(collection, mode, start?, end?) {
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

//   classifyRecord(r) {
//     const score = r.Fused_Fisher_Score;

//     let status = 'Healthy';
//     let features = null;

//     if (score > r.s_threshold_EVT) {
//       status = 'Critical';
//       features = r.top_features_evt_metric;
//     } else if (score > r.quantile_99) {
//       status = 'Threat';
//       features = r.top_features_99th_metric;
//     } else if (score > r.quantile_95) {
//       status = 'Warning';
//       features = r.top_features_95th_metric;
//     } else {
//       status = 'Healthy';
//       features = null;
//     }

//     return {
//       timestamp: r.timestamp,
//       score,
//       status,
//       features,
//     };
//   }

//   async getFeatureValues(features: string[]): Promise<Record<string, any[]>> {
//     if (!features || features.length === 0) {
//       //   console.log('[DEBUG] features array is empty');
//       return {};
//     }

//     const result: Record<string, any[]> = {};

//     for (const f of features) {
//       //   console.log('[DEBUG] querying feature:', f);

//       const pipeline = [
//         { $match: { [f]: { $exists: true }, Genset_Run_SS: { $gt: 0 } } },
//         { $sort: { timestamp: -1 } }, // string ISO timestamp is fine
//         { $limit: 100 },
//         { $project: { value: `$${f}`, _id: 0 } },
//       ];

//       const points = await this.navy.aggregate(pipeline).toArray();
//       //   console.log(`[DEBUG] points for ${f}:`, points);

//       result[f] = points.map((p) => p.value ?? null);
//     }

//     // console.log('[DEBUG] final result:', result);
//     return result;
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class AianomlyService {
  private electrical;
  private eng;
  private navy;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.electrical = this.db.collection('ai_anomly_electrical');
    this.eng = this.db.collection('ai_anomly_Eng');
    this.navy = this.db.collection('navy_12s');
  }

  // ------------------------------------------------------------------
  // Combined API: chart + features
  // ------------------------------------------------------------------
  async getChartAndFeatures(payload) {
    const { mode, start, end } = payload;

    const electricalData = await this.fetchData(
      this.electrical,
      mode,
      start,
      end,
    );
    const engData = await this.fetchData(this.eng, mode, start, end);

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

    // Fetch last 100 points per feature from navy_12s
    const feature_values = await this.getLast100FeatureValues(featureArray);

    return {
      electrical: electricalData,
      eng: engData,
      feature_values,
    };
  }

  // ------------------------------------------------------------------
  // Fetch chart data
  // ------------------------------------------------------------------
  async fetchData(collection, mode, start?, end?) {
    let records;
    if (mode === 'historic') {
      records = await collection
        .find({
          timestamp: { $gte: new Date(start), $lte: new Date(end) },
        })
        .sort({ timestamp: 1 })
        .toArray();
    } else {
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
      features, // comma-separated string
    };
  }

  // ------------------------------------------------------------------
  // Get last 100 points per feature from navy_12s
  // ------------------------------------------------------------------
  async getLast100FeatureValues(
    features: string[],
  ): Promise<Record<string, any[]>> {
    const result: Record<string, any[]> = {};
    if (!features || features.length === 0) return result;

    for (const f of features) {
      const pipeline = [
        { $match: { [f]: { $exists: true }, Genset_Run_SS: { $gt: 0 } } },
        { $sort: { timestamp: -1 } }, // string timestamp is fine
        { $limit: 100 },
        { $project: { value: `$${f}`, _id: 0 } },
      ];
      const points = await this.navy.aggregate(pipeline).toArray();
      result[f] = points.map((p) => p.value ?? null);
    }

    return result;
  }
}
