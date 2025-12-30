import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class NavyDataService {
  private navyCollection;
  private tmuaibnCollection;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.navyCollection = this.db.collection('basic_ml_predicted_12s');
    this.navyCollection.createIndex({ timestamp: 1 });

    this.tmuaibnCollection = this.db.collection('navy');
    this.tmuaibnCollection.createIndex({ timestamp: 1 });
  }

  async getCombinedData(
    mode: 'historic' | 'live',
    startDate?: string,
    endDate?: string,
  ) {
    let start: string;
    let end: string;

    /** ============================
     * Set Start/End Dates
     * ============================
     */
    if (mode === 'historic') {
      if (!startDate || !endDate) {
        throw new Error('start and end dates are required for historic mode');
      }
      start = startDate;
      end = endDate;
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');

      start = `${yyyy}-${mm}-${dd}T00:00:00+05:00`;
      end = `${yyyy}-${mm}-${dd}T23:59:59+05:00`;
    }

    /** ============================
     * Build Aggregation Pipeline
     * ============================
     */
    const pipeline = [
      {
        $match: {
          timestamp: { $gte: start, $lte: end },
        },
      },

      /** Merge 12S_predicted + navy_12s by timestamp */
      {
        $lookup: {
          from: 'navy',
          localField: 'timestamp',
          foreignField: 'timestamp',
          as: 'tmuaibn',
        },
      },
      { $unwind: { path: '$tmuaibn', preserveNullAndEmptyArrays: true } },

      /** Format timestamp inside MongoDB */
      {
        $addFields: {
          formattedTimestamp: {
            $dateToString: {
              date: { $toDate: '$timestamp' },
              format: '%b %d, %H:%M:%S',
              timezone: 'Asia/Karachi',
            },
          },
        },
      },

      /** Final fields */
      {
        $project: {
          _id: 0,
          timestamp: '$formattedTimestamp',

          Predicted_Genset_Total_kW: 1,
          Predicted_Fuel_Rate: 1,

          Genset_Total_kW_tmuaibn: '$tmuaibn.Genset_Total_kW',
          Fuel_Rate_tmuaibn: '$tmuaibn.Fuel_Rate',
        },
      },

      { $sort: { timestamp: 1 } },
    ];

    /** ============================
     * RUN PIPELINE
     * ============================
     */
    const result = await this.navyCollection.aggregate(pipeline).toArray();

    return result;
  }
}
