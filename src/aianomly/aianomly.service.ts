/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

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
    this.electrical = this.db.collection('ai_anomly_electrical');
    this.eng = this.db.collection('ai_anomly_Eng');
    this.navy = this.db.collection('navy_12s');
  }

  // -------------------------------------------------------
  // API 1 → Chart listing only (FAST)
  // -------------------------------------------------------

  async getChartOnly(payload: { mode: string; start?: string; end?: string }) {
    const { mode, start, end } = payload;

    const query =
      mode === 'historic' && start && end
        ? { timestamp: { $gte: new Date(start), $lte: new Date(end) } }
        : {};

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
        .sort({ timestamp: 1 })
        .toArray(),

      this.eng.find(query).project(projection).sort({ timestamp: 1 }).toArray(),
    ]);

    return {
      gen: genRaw.map((r) => this.makeStatus(r)),
      eng: engRaw.map((r) => this.makeStatus(r)),
    };
  }

  private formatTimestamp(ts: string | Date): string {
    const date = new Date(ts);

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
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
  }

  // Status calculator (fast + reused)
  private makeStatus(r: any) {
    const score = r.Fused_Fisher_Score;
    let status = 'Healthy';

    if (score > r.s_threshold_EVT) status = 'Critical';
    else if (score > r.quantile_99) status = 'Threat';
    else if (score > r.quantile_95) status = 'Warning';

    return {
      _id: r._id,
      timestamp: this.formatTimestamp(r.timestamp), // <-- FORMAT HERE
      score,
      status,
    };
  }

  // -------------------------------------------------------
  // API 2 → Feature details + last 100 (FAST)
  // -------------------------------------------------------

  // async getAnomalyDetails(id: string) {
  //   const _id = new ObjectId(id);

  //   // 🚀 Lookup in parallel
  //   const [eRec, engRec] = await Promise.all([
  //     this.electrical.findOne({ _id }),
  //     this.eng.findOne({ _id }),
  //   ]);

  //   const record = eRec || engRec;
  //   if (!record) return { error: 'Record not found' };

  //   // Extract features
  //   let featureList: string[] = [];
  //   const featureString =
  //     record.top_features_evt_metric ||
  //     record.top_features_99th_metric ||
  //     record.top_features_95th_metric;

  //   if (featureString) {
  //     featureList = featureString
  //       .split(',')
  //       .map((f) => f.trim().replace('_RE', ''));
  //   }

  //   // 🚀 Get last 100 values (optimized)
  //   const last100Values = await this.loadLast100(featureList);

  //   return {
  //     timestamp: record.timestamp,
  //     features: featureList,
  //     last_100_values: last100Values,
  //   };
  // }

  async getAnomalyDetails(id: string) {
    const _id = new ObjectId(id);

    // 🚀 Lookup in parallel
    const [eRec, engRec] = await Promise.all([
      this.electrical.findOne({ _id }),
      this.eng.findOne({ _id }),
    ]);

    const record = eRec || engRec;
    if (!record) return { error: 'Record not found' };

    // Extract features
    let featureList: string[] = [];
    const featureString =
      record.top_features_evt_metric ||
      record.top_features_99th_metric ||
      record.top_features_95th_metric;

    if (featureString) {
      featureList = featureString
        .split(',')
        .map((f) => f.trim().replace('_RE', ''));
    }

    // 🚀 Get last 100 values (optimized)
    const last100Values = await this.loadLast100(featureList);

    // ------------------------------------------------
    // Add random contribution for now
    // ------------------------------------------------
    const contributions: Record<string, number> = {};
    featureList.forEach((f) => {
      contributions[f] = parseFloat((Math.random() * 100).toFixed(2));
    });

    return {
      timestamp: record.timestamp,
      features: featureList,
      contribution: contributions, // <-- NEW FIELD
      last_100_values: last100Values,
    };
  }

  // -------------------------------------------------------
  // Load last 100 values FAST (optimized)
  // -------------------------------------------------------

  private async loadLast100(
    features: string[],
  ): Promise<Record<string, (number | null)[]>> {
    const result: Record<string, (number | null)[]> = {};
    if (!features?.length) return result;

    const calculated = new Set([
      'Voltage_Imbalance_%',
      'Current_Imbalance_%',
      'Electrical_Stress_RMS',
      'Neutral_Current',
      'Load_Percent',
      'Power_Loss_Index',
      'RPM_stability_index',
    ]);

    const rawFeatures = features.filter((f) => !calculated.has(f));
    const calcFeatures = features.filter((f) => calculated.has(f));

    // ---------------------------------------------------
    // RAW FIELDS — Optimized facet pipeline
    // ---------------------------------------------------

    if (rawFeatures.length > 0) {
      const facetStages = rawFeatures.reduce((acc, field) => {
        acc[field] = [
          { $match: { [field]: { $exists: true }, Genset_Run_SS: { $gt: 0 } } },
          { $sort: { timestamp: -1 } },
          { $limit: 100 },
          { $project: { value: `$${field}`, _id: 0 } },
        ];
        return acc;
      }, {});

      const aggregated = (
        await this.navy.aggregate([{ $facet: facetStages }]).toArray()
      )[0];

      rawFeatures.forEach((f) => {
        result[f] = aggregated[f]?.map((x) => x.value ?? null) ?? [];
      });
    }

    // ---------------------------------------------------
    // CALCULATED FIELDS — faster batch read
    // ---------------------------------------------------

    if (calcFeatures.length > 0) {
      // Read 300 docs once (FAST)
      const docs = await this.navy
        .find({})
        .sort({ timestamp: -1 })
        .limit(300)
        .toArray();

      for (const f of calcFeatures) {
        const values: (number | null)[] = [];

        for (const doc of docs) {
          if (values.length >= 100) break;

          let val: number | null = null;

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
