// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { Injectable, Inject } from '@nestjs/common';
// import { Db } from 'mongodb';

// @Injectable()
// export class GeneratorService {
//   private sourceCollection;
//   private historyCollection;

//   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
//     this.sourceCollection = this.db.collection('navy_12S');
//     this.historyCollection = this.db.collection('generator_service_logs');

//     this.sourceCollection.createIndex({ timestamp: 1 });
//   }

//   /* Helper: date + time -> ISO */
//   private toISOString(dateStr: string, timeStr: string): string {
//     const [h, m] = timeStr.split(':');
//     const date = new Date(dateStr);
//     date.setHours(parseInt(h), 10);
//     date.setMinutes(parseInt(m, 10));
//     date.setSeconds(0);
//     date.setMilliseconds(0);
//     return date.toISOString();
//   }

//   private parseTimestamp(ts: string): Date {
//     return new Date(ts);
//   }

//   /* POST HANDLER */
//   async handleService(body: {
//     startDate: string;
//     startTime?: string;
//     projectedDate?: string;
//     projectedTime?: string;
//     targetHours?: number;
//   }) {
//     const { startDate, startTime = '00:00' } = body;
//     const startISO = this.toISOString(startDate, startTime);

//     // 1. Runtime since last service
//     const runtime = await this.calculateRuntime(startISO);
//     const runtimeMinutes = runtime.hours * 60 + runtime.minutes;

//     let projectedTotalMinutes = 0;

//     // Case A: projected date/time
//     // if (body.projectedDate && body.projectedTime) {
//     //   const projectedISO = this.toISOString(
//     //     body.projectedDate,
//     //     body.projectedTime,
//     //   );
//     //   projectedTotalMinutes =
//     //     (new Date(projectedISO).getTime() - new Date(startISO).getTime()) /
//     //     (1000 * 60);
//     // }

//     // Case A: projected date (projectedTime is OPTIONAL)
//     if (body.projectedDate) {
//       // agar projectedTime na ho to startTime use kar lo
//       const projectedTime = body.projectedTime || startTime;

//       const projectedISO = this.toISOString(body.projectedDate, projectedTime);

//       projectedTotalMinutes =
//         (new Date(projectedISO).getTime() - new Date(startISO).getTime()) /
//         (1000 * 60);
//     }

//     // Case B: target hours
//     if (body.targetHours) {
//       projectedTotalMinutes = body.targetHours * 60;
//     }

//     // Remaining time
//     const remainingMinutes = Math.max(
//       projectedTotalMinutes - runtimeMinutes,
//       0,
//     );

//     const result = {
//       runtime: `${runtime.hours}:${runtime.minutes.toString().padStart(2, '0')}`,
//       remaining: `${Math.floor(remainingMinutes / 60)}:${Math.floor(
//         remainingMinutes % 60,
//       )
//         .toString()
//         .padStart(2, '0')}`,
//       startDate,
//       startTime,
//       projectedDate: body.projectedDate || null,
//       projectedTime: body.projectedTime || null,
//       targetHours: body.targetHours || null,
//       createdAt: new Date(),
//     };

//     // Save in new collection
//     await this.historyCollection.insertOne({
//       input: body,
//       result,
//       createdAt: new Date(),
//     });

//     return result;
//   }

//   /* FAST RUNTIME CALCULATION */
//   private async calculateRuntime(startISO: string) {
//     const cursor = this.sourceCollection.find(
//       {
//         timestamp: { $gte: startISO },
//         Genset_Run_SS: { $gte: 1, $lte: 6 },
//       },
//       { projection: { timestamp: 1 } },
//     );

//     let totalMinutes = 0;
//     let intervalStart: Date | null = null;
//     let lastTime: Date | null = null;

//     for await (const rec of cursor) {
//       const current = this.parseTimestamp(rec.timestamp);

//       if (!intervalStart) intervalStart = current;

//       if (lastTime) {
//         const gap = current.getTime() - lastTime.getTime();
//         if (gap > 5 * 60 * 1000) {
//           totalMinutes +=
//             (lastTime.getTime() - intervalStart.getTime()) / (1000 * 60);
//           intervalStart = current;
//         }
//       }

//       lastTime = current;
//     }

//     if (intervalStart && lastTime) {
//       totalMinutes +=
//         (lastTime.getTime() - intervalStart.getTime()) / (1000 * 60);
//     }

//     return {
//       hours: Math.floor(totalMinutes / 60),
//       minutes: Math.floor(totalMinutes % 60),
//     };
//   }

//   /* GET LATEST FLAT */
//   async getLatestHistory() {
//     const latestDoc = await this.historyCollection
//       .find({})
//       .sort({ createdAt: -1 })
//       .limit(1)
//       .toArray();

//     if (!latestDoc.length) return null;

//     const doc = latestDoc[0].result;

//     return doc; // flat format with runtime & remaining
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class GeneratorService {
  private sourceCollection;
  private historyCollection;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.sourceCollection = this.db.collection('navy_12S');
    this.historyCollection = this.db.collection('generator_service_logs');

    this.sourceCollection.createIndex({ timestamp: 1 });
  }

  /** Convert date + time -> ISO string with +05:00 */
  private toISOString(dateStr: string, timeStr = '00:00'): string {
    const [h, m] = timeStr.split(':');
    const iso = `${dateStr}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000+05:00`;
    return iso;
  }

  private parseTimestamp(ts: string): Date {
    return new Date(ts);
  }

  /** Handle both runtime and projected calculation */
  async handleService(body: {
    startDate: string;
    startTime?: string;
    projectedDate?: string;
    targetHours?: number;
  }) {
    const { startDate, startTime = '00:00' } = body;
    const startISO = this.toISOString(startDate, startTime);

    // 1. Calculate runtime since last service
    const runtime = await this.calculateRuntime(startISO);
    const runtimeMinutes = runtime.hours * 60 + runtime.minutes;

    let projectedTotalMinutes = 0;

    // Use projectedDate if given, otherwise targetHours
    if (body.projectedDate) {
      const projectedISO = this.toISOString(body.projectedDate, startTime);
      projectedTotalMinutes =
        (new Date(projectedISO).getTime() - new Date(startISO).getTime()) /
        (1000 * 60);
    } else if (body.targetHours) {
      projectedTotalMinutes = body.targetHours * 60;
    }

    const remainingMinutes = Math.max(
      projectedTotalMinutes - runtimeMinutes,
      0,
    );

    const result = {
      runtime: `${runtime.hours}:${runtime.minutes.toString().padStart(2, '0')}`,
      remaining: `${Math.floor(remainingMinutes / 60)}:${(remainingMinutes % 60)
        .toString()
        .padStart(2, '0')}`,
      startDate,
      startTime,
      projectedDate: body.projectedDate || null,
      targetHours: body.targetHours || null,
      createdAt: new Date(),
    };

    // Save in DB
    await this.historyCollection.insertOne({
      input: body,
      result,
      createdAt: new Date(),
    });

    return result;
  }

  /** Fast runtime calculation */
  private async calculateRuntime(startISO: string) {
    const cursor = this.sourceCollection.find(
      {
        timestamp: { $gte: startISO },
        Genset_Run_SS: { $gte: 1, $lte: 6 },
      },
      { projection: { timestamp: 1 } },
    );

    let totalMinutes = 0;
    let intervalStart: Date | null = null;
    let lastTime: Date | null = null;

    for await (const rec of cursor) {
      const current = this.parseTimestamp(rec.timestamp);

      if (!intervalStart) intervalStart = current;

      if (lastTime) {
        const gap = current.getTime() - lastTime.getTime();
        if (gap > 5 * 60 * 1000) {
          totalMinutes +=
            (lastTime.getTime() - intervalStart.getTime()) / (1000 * 60);
          intervalStart = current;
        }
      }

      lastTime = current;
    }

    if (intervalStart && lastTime) {
      totalMinutes +=
        (lastTime.getTime() - intervalStart.getTime()) / (1000 * 60);
    }

    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: Math.floor(totalMinutes % 60),
    };
  }

  /** Get latest flat history */
  async getLatestHistory() {
    const latestDoc = await this.historyCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (!latestDoc.length) return null;

    return latestDoc[0].result;
  }
}
