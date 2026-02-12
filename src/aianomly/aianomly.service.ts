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
  private liveElc;
  private liveEng;
  private navy;

  private liveClients: Record<string, string | undefined> = {}; // clientId -> ISO timestamp

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly formulas: FormulasService,
  ) {
    this.electrical = this.db.collection('ae_elc_prediction_12s_2');
    this.eng = this.db.collection('ae_eng_prediction_12s_2');
    // this.navy = this.db.collection('navy_12s');
    this.liveElc = this.db.collection('ae_elc_prediction_temp_12s_2');
    this.liveEng = this.db.collection('ae_eng_prediction_temp_12s_2');
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
      .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;
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

  private generateClientId() {
    return new ObjectId().toString();
  }

  async getChartOnly(payload: {
    mode: string;
    clientId?: string;
    start?: string;
    end?: string;
  }) {
    const { mode, clientId, start, end } = payload;

    // -------------------------------
    // Historic mode → original logic
    // -------------------------------
    if (mode === 'historic') {
      let query: any = {};
      let sortOrder = 1;
      let limit: number | undefined;

      if (start && end) {
        query.timestamp = {
          $gte: this.toISOStringSafe(start),
          $lte: this.toISOStringSafe(end),
        };
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

    // -------------------------------
    // Live mode → new logic
    // -------------------------------
    // if (mode === 'live') {
    //   let currentClientId = clientId;

    //   // First time live request → backend khud clientId generate kare
    //   if (!currentClientId) {
    //     currentClientId = this.generateClientId();
    //     this.liveClients[currentClientId] = undefined;
    //   }

    //   const lastTs = this.liveClients[currentClientId];

    //   const queryElc: any = lastTs
    //     ? { timestamp: { $gt: new Date(lastTs) } }
    //     : {};
    //   const queryEng: any = lastTs
    //     ? { timestamp: { $gt: new Date(lastTs) } }
    //     : {};

    //   const projection = {
    //     timestamp: 1,
    //     Fused_Fisher_Score: 1,
    //     quantile_95: 1,
    //     quantile_99: 1,
    //     s_threshold_EVT: 1,
    //   };

    //   const [elcDocs, engDocs] = await Promise.all([
    //     this.liveElc
    //       .find(queryElc)
    //       .project(projection)
    //       .sort({ timestamp: 1 })
    //       .toArray(),
    //     this.liveEng
    //       .find(queryEng)
    //       .project(projection)
    //       .sort({ timestamp: 1 })
    //       .toArray(),
    //   ]);

    //   const allDocs = [...elcDocs, ...engDocs];
    //   if (allDocs.length) {
    //     const newest = allDocs.reduce(
    //       (max, d) => (d.timestamp > max ? d.timestamp : max),
    //       allDocs[0].timestamp,
    //     );
    //     this.liveClients[currentClientId] = new Date(newest).toISOString();
    //   }

    //   return {
    //     clientId: currentClientId, // frontend ko yahan se mile ga
    //     elc: elcDocs.map((r) => this.makeStatus(r)),
    //     eng: engDocs.map((r) => this.makeStatus(r)),
    //   };
    // }

    // if (mode === 'live') {
    //   let currentClientId = clientId;

    //   if (!currentClientId) {
    //     currentClientId = this.generateClientId();
    //     this.liveClients[currentClientId] = undefined;
    //   }

    //   const lastTs = this.liveClients[currentClientId];

    //   // ✅ IMPORTANT → convert to ISO string
    //   const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    //   const queryElc: any = lastTs
    //     ? { timestamp: { $gt: lastTs } }
    //     : { timestamp: { $gte: oneHourAgo } };

    //   const queryEng: any = lastTs
    //     ? { timestamp: { $gt: lastTs } }
    //     : { timestamp: { $gte: oneHourAgo } };

    //   const projection = {
    //     timestamp: 1,
    //     Fused_Fisher_Score: 1,
    //     quantile_95: 1,
    //     quantile_99: 1,
    //     s_threshold_EVT: 1,
    //   };

    //   const [elcDocs, engDocs] = await Promise.all([
    //     this.liveElc
    //       .find(queryElc)
    //       .project(projection)
    //       .sort({ timestamp: 1 })
    //       .toArray(),
    //     this.liveEng
    //       .find(queryEng)
    //       .project(projection)
    //       .sort({ timestamp: 1 })
    //       .toArray(),
    //   ]);

    //   const allDocs = [...elcDocs, ...engDocs];

    //   if (allDocs.length) {
    //     const newest = allDocs.reduce(
    //       (max, d) => (d.timestamp > max ? d.timestamp : max),
    //       allDocs[0].timestamp,
    //     );

    //     // ✅ DO NOT convert again
    //     this.liveClients[currentClientId] = newest;
    //   }

    //   return {
    //     clientId: currentClientId,
    //     elc: elcDocs.map((r) => this.makeStatus(r)),
    //     eng: engDocs.map((r) => this.makeStatus(r)),
    //   };
    // }

    if (mode === 'live') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const projection = {
        timestamp: 1,
        Fused_Fisher_Score: 1,
        quantile_95: 1,
        quantile_99: 1,
        s_threshold_EVT: 1,
      };

      const [elcDocs, engDocs] = await Promise.all([
        this.liveElc
          .find({ timestamp: { $gte: oneHourAgo } })
          .project(projection)
          .sort({ timestamp: 1 })
          .toArray(),

        this.liveEng
          .find({ timestamp: { $gte: oneHourAgo } })
          .project(projection)
          .sort({ timestamp: 1 })
          .toArray(),
      ]);

      return {
        gen: elcDocs.map((r) => this.makeStatus(r)),
        eng: engDocs.map((r) => this.makeStatus(r)),
      };
    }

    throw new Error('Invalid mode');
  }

  // async getAnomalyDetails(params: {
  //   id: string;
  //   mode?: 'live' | 'historic';
  //   start?: string;
  //   end?: string;
  // }) {
  //   const { id } = params;
  //   const _id = new ObjectId(id);

  //   const [elcRec, engRec] = await Promise.all([
  //     this.electrical.findOne({ _id }),
  //     this.eng.findOne({ _id }),
  //   ]);

  //   const record = elcRec || engRec;
  //   if (!record) return { error: 'Record not found' };

  //   const sourceCollection = elcRec ? this.electrical : this.eng;
  //   const score = record.Fused_Fisher_Score;

  //   let status = 'Healthy';
  //   let featureString = '';

  //   // if (score > record.s_threshold_EVT) {
  //   //   status = 'Critical';
  //   //   featureString = record.top_features_evt_metric;
  //   // } else if (score > record.quantile_99) {
  //   //   status = 'Threat';
  //   //   featureString = record.top_features_99th_metric;
  //   // } else if (score > record.quantile_95) {
  //   //   status = 'Warning';
  //   //   featureString = record.top_features_95th_metric;
  //   // }

  //   // change fields

  //   if (score > record.s_threshold_EVT) {
  //     status = 'Critical';
  //     featureString = record.top_problematic_features_evt;
  //   } else if (score > record.quantile_99) {
  //     status = 'Threat';
  //     featureString = record.top_problematic_features_99th;
  //   } else if (score > record.quantile_95) {
  //     status = 'Warning';
  //     featureString = record.top_problematic_features_95th;
  //   }

  //   // Clean feature names and generate contribution
  //   const features: string[] = [];
  //   const contribution: Record<string, number> = {};

  //   featureString?.split(',').forEach((f) => {
  //     const trimmed = f.trim();
  //     const match = trimmed.match(
  //       /(.+?)_(Q\+T2|Qf|T2f|Q|T2)_([-]?\d+(\.\d+)?)/,
  //     );
  //     if (match) {
  //       const featureName = match[1]; // the clean feature key without suffix
  //       const value = parseFloat(match[3]); // numeric contribution
  //       features.push(featureName);
  //       contribution[featureName] = value;
  //     } else {
  //       features.push(trimmed.replace('_RE', ''));
  //     }
  //   });

  //   // ------------------------------------------------------
  //   // Always show historic style around last record
  //   // ------------------------------------------------------
  //   const values = await this.loadCenteredWindow(
  //     features,
  //     sourceCollection,
  //     record.timestamp,
  //     params.start,
  //     params.end,
  //   );

  //   /*
  //   // Temporarily commenting out live mode
  //   const values =
  //     params.mode === 'historic'
  //       ? await this.loadCenteredWindow(
  //           features,
  //           sourceCollection,
  //           record.timestamp,
  //           params.start,
  //           params.end,
  //         )
  //       : await this.loadLast100Batch(features, sourceCollection);
  //   */

  //   return {
  //     timestamp: this.formatTimestamp(record.timestamp),
  //     status,
  //     features,
  //     contribution,
  //     last_100_values: values,
  //   };
  // }

  async getAnomalyDetails(params: { id: string }) {
    const { id } = params;

    // ✅ Safe ObjectId handling
    let _id: ObjectId | string;
    if (ObjectId.isValid(id)) {
      _id = new ObjectId(id);
    } else {
      _id = id;
    }

    // ✅ Search in ALL collections (historic + live)
    const [elcRec, engRec, liveElcRec, liveEngRec] = await Promise.all([
      this.electrical.findOne({ _id }),
      this.eng.findOne({ _id }),
      this.liveElc.findOne({ _id }),
      this.liveEng.findOne({ _id }),
    ]);

    const record = elcRec || engRec || liveElcRec || liveEngRec;

    if (!record) {
      return { error: 'Record not found' };
    }

    // ✅ Detect correct source collection
    let sourceCollection;
    if (elcRec) sourceCollection = this.electrical;
    else if (engRec) sourceCollection = this.eng;
    else if (liveElcRec) sourceCollection = this.liveElc;
    else sourceCollection = this.liveEng;

    const score = record.Fused_Fisher_Score;

    // --------------------------
    // Determine status
    // --------------------------
    let status = 'Healthy';
    let featureString = '';

    if (score > record.s_threshold_EVT) {
      status = 'Critical';
      featureString = record.top_problematic_features_evt;
    } else if (score > record.quantile_99) {
      status = 'Threat';
      featureString = record.top_problematic_features_99th;
    } else if (score > record.quantile_95) {
      status = 'Warning';
      featureString = record.top_problematic_features_95th;
    }

    // --------------------------
    // Safe Feature Parsing
    // --------------------------
    const features: string[] = [];
    const contribution: Record<string, number> = {};

    if (featureString && featureString.trim() !== '') {
      featureString.split(',').forEach((f) => {
        const trimmed = f.trim();
        if (!trimmed) return;

        const match = trimmed.match(
          /(.+?)_(Q\+T2|Qf|T2f|Q|T2)_([-]?\d+(\.\d+)?)/,
        );

        if (match) {
          const featureName = match[1];
          const value = parseFloat(match[3]);
          features.push(featureName);
          contribution[featureName] = value;
        } else {
          features.push(trimmed.replace('_RE', ''));
        }
      });
    }

    // --------------------------
    // Load centered window safely
    // --------------------------
    let values = {};

    if (features.length > 0) {
      values = await this.loadCenteredWindow(
        features,
        sourceCollection,
        record.timestamp,
      );
    }

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

    // const fields = features.map((f) =>
    //   f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, ''),
    // );

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

  // private async loadCenteredWindow(
  //   features: string[],
  //   collection,
  //   anomalyTs: string,
  //   fromDate?: string,
  //   toDate?: string,
  // ): Promise<Record<string, { value: number | null; timestamp: string }[]>> {
  //   const fields = features.map((f) =>
  //     f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, ''),
  //   );

  //   const projection = {
  //     timestamp: 1,
  //     ...Object.fromEntries(fields.map((f) => [f, 1])),
  //   };

  //   const start = fromDate ? new Date(fromDate + 'T00:00:00.000Z') : undefined;
  //   const end = toDate ? new Date(toDate + 'T23:59:59.999Z') : undefined;

  //   const prevQuery: any = { timestamp: { $lt: anomalyTs } };
  //   const nextQuery: any = { timestamp: { $gte: anomalyTs } };

  //   if (start) {
  //     prevQuery.timestamp.$gte = start;
  //     nextQuery.timestamp.$gte = start;
  //   }
  //   if (end) {
  //     prevQuery.timestamp.$lte = end;
  //     nextQuery.timestamp.$lte = end;
  //   }

  //   // Fetch previous and next docs
  //   const [prevDocs, nextDocs] = await Promise.all([
  //     collection
  //       .find(prevQuery, { projection })
  //       .sort({ timestamp: -1 })
  //       .limit(100)
  //       .toArray(),
  //     collection
  //       .find(nextQuery, { projection })
  //       .sort({ timestamp: 1 })
  //       .limit(100)
  //       .toArray(),
  //   ]);

  //   // Combine and sort everything in ascending order
  //   const allDocs = [...prevDocs.reverse(), ...nextDocs];

  //   // Format output
  //   const result: Record<
  //     string,
  //     { value: number | null; timestamp: string }[]
  //   > = {};
  //   fields.forEach((f, i) => {
  //     result[features[i]] = allDocs.map((d) => ({
  //       value: f in d ? d[f] : null,
  //       timestamp: this.formatTimestamp(d.timestamp),
  //     }));
  //   });

  //   return result;
  // }

  private async loadCenteredWindow(
    features: string[],
    collection,
    anomalyTs: string,
  ): Promise<Record<string, { value: number | null; timestamp: string }[]>> {
    // 1️⃣ Clean feature field names safely
    const fields = features
      .map((f) => f.replace(/_(Q\+T2|Qf|T2f|Q|T2)_[-]?\d+(\.\d+)?$/, ''))
      .map((f) => f.trim())
      .filter((f) => f.length > 0); // ❗ prevent empty field error

    if (!fields.length) return {};

    // 2️⃣ Build projection safely
    const projection: any = { timestamp: 1 };
    fields.forEach((f) => {
      projection[f] = 1;
    });

    // 3️⃣ String comparison (NO Date conversion)
    const prevQuery = { timestamp: { $lt: anomalyTs } };
    const nextQuery = { timestamp: { $gte: anomalyTs } };

    // 4️⃣ Fetch previous + next 100
    const [prevDocs, nextDocs] = await Promise.all([
      collection
        .find(prevQuery, { projection })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray(),

      collection
        .find(nextQuery, { projection })
        .sort({ timestamp: 1 })
        .limit(100)
        .toArray(),
    ]);

    const allDocs = [...prevDocs.reverse(), ...nextDocs];

    // 5️⃣ Format output
    const result: Record<
      string,
      { value: number | null; timestamp: string }[]
    > = {};

    fields.forEach((field, index) => {
      result[features[index]] = allDocs.map((doc) => ({
        value: field in doc ? doc[field] : null,
        timestamp: this.formatTimestamp(doc.timestamp),
      }));
    });

    return result;
  }
}
