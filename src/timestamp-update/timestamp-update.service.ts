/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class TimestampUpdateService {
  private readonly logger = new Logger(TimestampUpdateService.name);
  private collection;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.collection = this.db.collection('navy');
  }

  /**
   * ✅ Add a separate "timestamp" field (as ISO string)
   */
  async addTimestampsToAllDocuments(
    startDate: string,
    onlyMissing = true,
    intervalSeconds = 3,
  ): Promise<string> {
    const start = new Date(startDate);
    const interval = intervalSeconds * 1000;

    const filter = onlyMissing
      ? {
          $or: [
            { timestamp: { $exists: false } },
            { timestamp: null },
            { timestamp: '' },
          ],
        }
      : {};

    const docs = await this.collection.find(filter).sort({ _id: 1 }).toArray();
    this.logger.log(
      `Found ${docs.length} documents. Adding timestamp (as string)...`,
    );

    const chunkSize = 1000;
    let totalUpdated = 0;

    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);

      const bulkOps = chunk.map((doc, idx) => {
        const ts = new Date(
          start.getTime() + (i + idx) * interval,
        ).toISOString(); // ✅ string format
        return {
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { timestamp: ts } },
          },
        };
      });

      if (bulkOps.length > 0) {
        await this.collection.bulkWrite(bulkOps);
        totalUpdated += bulkOps.length;
        this.logger.log(
          `✅ Updated ${totalUpdated}/${docs.length} documents...`,
        );
      }
    }

    this.logger.log(
      `🎯 Done. Added timestamp (as string) to ${totalUpdated} documents.`,
    );
    return `Timestamps added to ${totalUpdated} documents.`;
  }
}
