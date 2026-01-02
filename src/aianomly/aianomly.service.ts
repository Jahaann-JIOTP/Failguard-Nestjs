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
    const { id } = params;
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

    // Clean feature names and generate contribution
    const features: string[] = [];
    const contribution: Record<string, number> = {};

    featureString?.split(',').forEach((f) => {
      const trimmed = f.trim();
      const match = trimmed.match(/(.+)_Q_(\d+(\.\d+)?)/);
      if (match) {
        const cleanKey = match[1];
        const value = parseFloat(match[2]);
        features.push(cleanKey);
        contribution[cleanKey] = value;
      } else {
        features.push(trimmed.replace('_RE', ''));
      }
    });

    // ------------------------------------------------------
    // Always show historic style around last record
    // ------------------------------------------------------
    const values = await this.loadCenteredWindow(
      features,
      sourceCollection,
      record.timestamp,
      params.start,
      params.end,
    );

    /*
    // Temporarily commenting out live mode
    const values =
      params.mode === 'historic'
        ? await this.loadCenteredWindow(
            features,
            sourceCollection,
            record.timestamp,
            params.start,
            params.end,
          )
        : await this.loadLast100Batch(features, sourceCollection);
    */

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
    fromDate?: string,
    toDate?: string,
  ): Promise<Record<string, { value: number | null; timestamp: string }[]>> {
    const fields = features.map((f) =>
      f.replace(/_(Q|T2)_[-]?\d+(\.\d+)?$/, ''),
    );

    const projection = {
      timestamp: 1,
      ...Object.fromEntries(fields.map((f) => [f, 1])),
    };

    const start = fromDate ? new Date(fromDate + 'T00:00:00.000Z') : undefined;
    const end = toDate ? new Date(toDate + 'T23:59:59.999Z') : undefined;

    const prevQuery: any = { timestamp: { $lt: anomalyTs } };
    const nextQuery: any = { timestamp: { $gte: anomalyTs } };

    if (start) {
      prevQuery.timestamp.$gte = start;
      nextQuery.timestamp.$gte = start;
    }
    if (end) {
      prevQuery.timestamp.$lte = end;
      nextQuery.timestamp.$lte = end;
    }

    // Fetch previous and next docs
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

    // Combine and sort everything in ascending order
    const allDocs = [...prevDocs.reverse(), ...nextDocs];

    // Format output
    const result: Record<
      string,
      { value: number | null; timestamp: string }[]
    > = {};
    fields.forEach((f, i) => {
      result[features[i]] = allDocs.map((d) => ({
        value: f in d ? d[f] : null,
        timestamp: this.formatTimestamp(d.timestamp),
      }));
    });

    return result;
  }
}
