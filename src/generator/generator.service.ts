// // /* eslint-disable @typescript-eslint/no-unsafe-return */
// // /* eslint-disable @typescript-eslint/no-unsafe-call */
// // /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// // /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// // import { Injectable, Inject } from '@nestjs/common';
// // import { Db } from 'mongodb';

// // @Injectable()
// // export class GeneratorService {
// //   private sourceCollection;
// //   private historyCollection;

// //   constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
// //     this.sourceCollection = this.db.collection('navy_12s');
// //     this.historyCollection = this.db.collection('generator_service_logs');

// //     this.sourceCollection.createIndex({ timestamp: 1 });
// //   }

// //   /** Convert date + time -> ISO string with +05:00 */
// //   private toISOString(dateStr: string, timeStr = '00:00'): string {
// //     const [h, m] = timeStr.split(':');
// //     const iso = `${dateStr}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000+05:00`;
// //     return iso;
// //   }

// //   private parseTimestamp(ts: string): Date {
// //     return new Date(ts);
// //   }

// //   /** Handle both runtime and projected calculation */
// //   async handleService(body: {
// //     startDate: string;
// //     startTime?: string;
// //     projectedDate?: string;
// //     targetHours?: number;
// //   }) {
// //     const { startDate, startTime = '00:00' } = body;
// //     const startISO = this.toISOString(startDate, startTime);

// //     // 1. Calculate runtime since last service
// //     const runtime = await this.calculateRuntime(startISO);
// //     const runtimeMinutes = runtime.hours * 60 + runtime.minutes;

// //     let projectedTotalMinutes = 0;

// //     // Use projectedDate if given, otherwise targetHours
// //     if (body.projectedDate) {
// //       const projectedISO = this.toISOString(body.projectedDate, startTime);
// //       projectedTotalMinutes =
// //         (new Date(projectedISO).getTime() - new Date(startISO).getTime()) /
// //         (1000 * 60);
// //     } else if (body.targetHours) {
// //       projectedTotalMinutes = body.targetHours * 60;
// //     }

// //     const remainingMinutes = Math.max(
// //       projectedTotalMinutes - runtimeMinutes,
// //       0,
// //     );

// //     const result = {
// //       runtime: `${runtime.hours}:${runtime.minutes.toString().padStart(2, '0')}`,
// //       remaining: `${Math.floor(remainingMinutes / 60)}:${(remainingMinutes % 60)
// //         .toString()
// //         .padStart(2, '0')}`,
// //       startDate,
// //       startTime,
// //       projectedDate: body.projectedDate || null,
// //       targetHours: body.targetHours || null,
// //       createdAt: new Date(),
// //     };

// //     // Save in DB
// //     await this.historyCollection.insertOne({
// //       input: body,
// //       result,
// //       createdAt: new Date(),
// //     });

// //     return result;
// //   }

// //   /** Fast runtime calculation */
// //   private async calculateRuntime(startISO: string) {
// //     const cursor = this.sourceCollection.find(
// //       {
// //         timestamp: { $gte: startISO },
// //         Genset_Run_SS: { $gte: 1 },
// //       },
// //       { projection: { timestamp: 1 } },
// //     );

// //     let totalMinutes = 0;
// //     let intervalStart: Date | null = null;
// //     let lastTime: Date | null = null;

// //     for await (const rec of cursor) {
// //       const current = this.parseTimestamp(rec.timestamp);

// //       if (!intervalStart) intervalStart = current;

// //       if (lastTime) {
// //         const gap = current.getTime() - lastTime.getTime();
// //         if (gap > 5 * 60 * 1000) {
// //           totalMinutes +=
// //             (lastTime.getTime() - intervalStart.getTime()) / (1000 * 60);
// //           intervalStart = current;
// //         }
// //       }

// //       lastTime = current;
// //     }

// //     if (intervalStart && lastTime) {
// //       totalMinutes +=
// //         (lastTime.getTime() - intervalStart.getTime()) / (1000 * 60);
// //     }

// //     return {
// //       hours: Math.floor(totalMinutes / 60),
// //       minutes: Math.floor(totalMinutes % 60),
// //     };
// //   }

// //   /** Get latest flat history */
// //   async getLatestHistory() {
// //     const latestDoc = await this.historyCollection
// //       .find({})
// //       .sort({ createdAt: -1 })
// //       .limit(1)
// //       .toArray();

// //     if (!latestDoc.length) return null;

// //     return latestDoc[0].result;
// //   }
// // }

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
//     this.sourceCollection = this.db.collection('navy_12s');
//     this.historyCollection = this.db.collection('generator_service_logs');
//     this.sourceCollection.createIndex({ timestamp: 1 });
//   }

//   private toISOString(dateStr: string, timeStr = '00:00'): string {
//     const [h, m] = timeStr.split(':');
//     return `${dateStr}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000+05:00`;
//   }

//   private parseTimestamp(ts: string): Date {
//     return new Date(ts);
//   }

//   // ================== MAIN SERVICE ==================
//   async handleService(body: {
//     startDate: string;
//     startTime?: string;
//     projectedDate?: string;
//     targetHours?: number;
//   }) {
//     const { startDate, startTime = '00:00', projectedDate, targetHours } = body;

//     const startISO = this.toISOString(startDate, startTime);
//     const projectedISO = projectedDate
//       ? this.toISOString(projectedDate, startTime)
//       : null;

//     // Only runtime calculate here
//     const runtime = await this.calculateRuntime(startISO);

//     await this.historyCollection.insertOne({
//       input: { startISO, projectedISO, targetHours: targetHours || null },
//       createdAt: new Date(),
//     });

//     return {
//       message: 'Service saved successfully',
//       runtime: `${runtime.hours}:${runtime.minutes.toString().padStart(2, '0')}`,
//     };
//   }

//   // ================== REAL TIME DASHBOARD ==================
//   async getLatestHistory() {
//     const latest = await this.historyCollection
//       .find({})
//       .sort({ createdAt: -1 })
//       .limit(1)
//       .toArray();

//     if (!latest.length) return null;

//     const { startISO, projectedISO, targetHours } = latest[0].input;

//     const runtime = await this.calculateRuntime(startISO);
//     const runtimeMinutes = runtime.hours * 60 + runtime.minutes;

//     let remainingMinutes = 0;
//     const now = new Date();

//     if (projectedISO) {
//       remainingMinutes =
//         (new Date(projectedISO).getTime() - now.getTime()) / (1000 * 60);
//     } else if (targetHours) {
//       remainingMinutes = targetHours * 60 - runtimeMinutes;
//     }

//     remainingMinutes = Math.max(Math.floor(remainingMinutes), 0);

//     return {
//       runtime: `${runtime.hours}:${runtime.minutes.toString().padStart(2, '0')}`,
//       remaining: `${Math.floor(remainingMinutes / 60)}:${(remainingMinutes % 60)
//         .toString()
//         .padStart(2, '0')}`,
//     };
//   }

//   // ================== RUNTIME CALCULATOR ==================
//   private async calculateRuntime(startISO: string) {
//     const cursor = this.sourceCollection.find(
//       {
//         timestamp: { $gte: startISO },
//         Genset_Run_SS: { $gte: 1 },
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
    this.sourceCollection = this.db.collection('navy_12s');
    this.historyCollection = this.db.collection('generator_service_logs');
    this.sourceCollection.createIndex({ timestamp: 1 });
  }

  private toISOString(dateStr: string, timeStr = '00:00'): string {
    const [h, m] = timeStr.split(':');
    return `${dateStr}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00.000+05:00`;
  }

  private parseTimestamp(ts: string): Date {
    return new Date(ts);
  }

  // ================= SAVE SERVICE =================
  async handleService(body: {
    startDate: string;
    startTime?: string;
    projectedDate?: string;
    targetHours?: number;
  }) {
    const { startDate, startTime = '00:00', projectedDate, targetHours } = body;

    const startISO = this.toISOString(startDate, startTime);
    const projectedISO = projectedDate
      ? this.toISOString(projectedDate, startTime)
      : null;

    const runtime = await this.calculateRuntime(startISO);

    await this.historyCollection.insertOne({
      input: {
        startISO,
        projectedISO,
        targetHours: targetHours || null,
        startDate,
        startTime,
      },
      createdAt: new Date(),
    });

    return {
      message: 'Service saved successfully',
      runtime: `${runtime.hours}:${runtime.minutes.toString().padStart(2, '0')}`,
    };
  }

  // ================= REAL TIME DASHBOARD =================
  async getLatestHistory() {
    const latest = await this.historyCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    if (!latest.length) return null;

    const { startISO, projectedISO, targetHours, startDate, startTime } =
      latest[0].input;

    const runtime = await this.calculateRuntime(startISO);
    const runtimeMinutes = runtime.hours * 60 + runtime.minutes;

    let remainingMinutes = 0;
    const now = new Date();

    if (projectedISO) {
      remainingMinutes =
        (new Date(projectedISO).getTime() - now.getTime()) / (1000 * 60);
    } else if (targetHours) {
      remainingMinutes = targetHours * 60 - runtimeMinutes;
    }

    remainingMinutes = Math.floor(remainingMinutes);

    const sign = remainingMinutes < 0 ? '-' : '';
    const abs = Math.abs(remainingMinutes);
    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;

    return {
      // runtime: `${runtime.hours}:${runtime.minutes.toString().padStart(2, '0')}`,
      // remaining: `${sign}${hours}:${minutes.toString().padStart(2, '0')}`,
      // startDate,
      // startTime,
      // nextService: projectedISO,

      runtime: `${runtime.hours}:${runtime.minutes.toString().padStart(2, '0')}`,
      remaining: `${sign}${hours}:${minutes.toString().padStart(2, '0')}`,
      startDate,
      startTime,
      projectedDate: projectedISO ? projectedISO.split('T')[0] : null,
      createdAt: latest[0].createdAt,
    };
  }

  // ================= RUNTIME CALCULATOR =================
  private async calculateRuntime(startISO: string) {
    const cursor = this.sourceCollection.find(
      {
        timestamp: { $gte: startISO },
        Genset_Run_SS: { $gte: 1 },
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
}
