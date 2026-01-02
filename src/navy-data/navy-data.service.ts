/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class NavyDataService {
  private navyCollection;
  private tmuaibnCollection;
  private liveClients: Record<string, string> = {}; // clientId -> lastTimestamp
  private livePredictionCollection;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.navyCollection = this.db.collection('rf_eng_prediction_12s');
    this.navyCollection.createIndex({ timestamp: 1 });

    this.tmuaibnCollection = this.db.collection('navy');
    this.tmuaibnCollection.createIndex({ timestamp: 1 });

    this.livePredictionCollection = this.db.collection(
      'rf_eng_prediction_temp_12s',
    );
    this.livePredictionCollection.createIndex({ timestamp: 1 });
  }

  private generateClientId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // async getCombinedData(
  //   mode: 'historic' | 'live',
  //   startDate?: string,
  //   endDate?: string,
  // ) {
  //   let start: string;
  //   let end: string;

  //   /** ============================
  //    * Set Start/End Dates
  //    * ============================
  //    */
  //   if (mode === 'historic') {
  //     if (!startDate || !endDate) {
  //       throw new Error('start and end dates are required for historic mode');
  //     }
  //     start = startDate;
  //     end = endDate;
  //   } else {
  //     const today = new Date();
  //     const yyyy = today.getFullYear();
  //     const mm = String(today.getMonth() + 1).padStart(2, '0');
  //     const dd = String(today.getDate()).padStart(2, '0');

  //     start = `${yyyy}-${mm}-${dd}T00:00:00+05:00`;
  //     end = `${yyyy}-${mm}-${dd}T23:59:59+05:00`;
  //   }

  //   /** ============================
  //    * Build Aggregation Pipeline
  //    * ============================
  //    */
  //   const pipeline = [
  //     {
  //       $match: {
  //         timestamp: { $gte: start, $lte: end },
  //       },
  //     },

  //     /** Merge 12S_predicted + navy_12s by timestamp */
  //     {
  //       $lookup: {
  //         from: 'navy',
  //         localField: 'timestamp',
  //         foreignField: 'timestamp',
  //         as: 'tmuaibn',
  //       },
  //     },
  //     { $unwind: { path: '$tmuaibn', preserveNullAndEmptyArrays: true } },

  //     /** Format timestamp inside MongoDB */
  //     {
  //       $addFields: {
  //         formattedTimestamp: {
  //           $dateToString: {
  //             date: { $toDate: '$timestamp' },
  //             format: '%b %d, %H:%M:%S',
  //             timezone: 'Asia/Karachi',
  //           },
  //         },
  //       },
  //     },

  //     /** Final fields */
  //     {
  //       $project: {
  //         _id: 0,
  //         timestamp: '$formattedTimestamp',

  //         Predicted_Genset_Total_kW: 1,
  //         Predicted_Fuel_Rate: 1,

  //         Genset_Total_kW_tmuaibn: '$tmuaibn.Genset_Total_kW',
  //         Fuel_Rate_tmuaibn: '$tmuaibn.Fuel_Rate',
  //       },
  //     },

  //     { $sort: { timestamp: 1 } },
  //   ];

  //   /** ============================
  //    * RUN PIPELINE
  //    * ============================
  //    */
  //   const result = await this.navyCollection.aggregate(pipeline).toArray();

  //   return result;
  // }

  async getCombinedData(
    mode: 'historic' | 'live',
    startDate?: string,
    endDate?: string,
    clientId?: string,
  ) {
    // --------------------------
    // Historic → unchanged
    // --------------------------
    if (mode === 'historic') {
      if (!startDate || !endDate) {
        throw new Error('start and end dates are required for historic mode');
      }

      const pipeline = [
        { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
        {
          $lookup: {
            from: 'navy',
            localField: 'timestamp',
            foreignField: 'timestamp',
            as: 'tmuaibn',
          },
        },
        { $unwind: { path: '$tmuaibn', preserveNullAndEmptyArrays: true } },
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

      return this.navyCollection.aggregate(pipeline).toArray();
    }

    // --------------------------
    // LIVE MODE
    // --------------------------
    let cid = clientId;

    if (!cid) {
      cid = this.generateClientId();
      this.liveClients[cid] = '';
    }

    const lastTs = this.liveClients[cid];
    const match: any = lastTs ? { timestamp: { $gt: lastTs } } : {};

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'navy',
          localField: 'timestamp',
          foreignField: 'timestamp',
          as: 'tmuaibn',
        },
      },
      { $unwind: { path: '$tmuaibn', preserveNullAndEmptyArrays: true } },
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
      {
        $project: {
          _id: 0,
          timestamp: '$formattedTimestamp',
          rawTimestamp: '$timestamp',
          Predicted_Genset_Total_kW: 1,
          Predicted_Fuel_Rate: 1,
          Genset_Total_kW_tmuaibn: '$tmuaibn.Genset_Total_kW',
          Fuel_Rate_tmuaibn: '$tmuaibn.Fuel_Rate',
        },
      },
      { $sort: { rawTimestamp: 1 } },
      { $limit: 50 },
    ];

    const data = await this.livePredictionCollection
      .aggregate(pipeline)
      .toArray();

    if (data.length) {
      this.liveClients[cid] = data[data.length - 1].rawTimestamp;
    }

    // ⚠ frontend ko sirf ARRAY mile ga
    return data.map(({ rawTimestamp, ...rest }) => rest);
  }

  // async getCombinedData(
  //   mode: 'historic' | 'live',
  //   startDate?: string,
  //   endDate?: string,
  //   clientId?: string,
  // ) {
  //   // --------------------------
  //   // Historic → unchanged
  //   // --------------------------
  //   if (mode === 'historic') {
  //     if (!startDate || !endDate) {
  //       throw new Error('start and end dates are required for historic mode');
  //     }

  //     const pipeline = [
  //       { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
  //       {
  //         $lookup: {
  //           from: 'navy',
  //           localField: 'timestamp',
  //           foreignField: 'timestamp',
  //           as: 'tmuaibn',
  //         },
  //       },
  //       { $unwind: { path: '$tmuaibn', preserveNullAndEmptyArrays: true } },
  //       {
  //         $addFields: {
  //           formattedTimestamp: {
  //             $dateToString: {
  //               date: { $toDate: '$timestamp' },
  //               format: '%b %d, %H:%M:%S',
  //               timezone: 'Asia/Karachi',
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: 0,
  //           timestamp: '$formattedTimestamp',
  //           Predicted_Genset_Total_kW: 1,
  //           Predicted_Fuel_Rate: 1,
  //           Genset_Total_kW_tmuaibn: '$tmuaibn.Genset_Total_kW',
  //           Fuel_Rate_tmuaibn: '$tmuaibn.Fuel_Rate',
  //         },
  //       },
  //       { $sort: { timestamp: 1 } },
  //     ];

  //     return this.navyCollection.aggregate(pipeline).toArray();
  //   }

  //   // --------------------------
  //   // Live mode → new logic
  //   // --------------------------
  //   let currentClientId = clientId;

  //   if (!currentClientId) {
  //     currentClientId = this.generateClientId();
  //     this.liveClients[currentClientId] = '';
  //   }

  //   const lastTs = this.liveClients[currentClientId];

  //   const match: any = lastTs ? { timestamp: { $gt: lastTs } } : {};

  //   const pipeline = [
  //     { $match: match },
  //     {
  //       $lookup: {
  //         from: 'navy',
  //         localField: 'timestamp',
  //         foreignField: 'timestamp',
  //         as: 'tmuaibn',
  //       },
  //     },
  //     { $unwind: { path: '$tmuaibn', preserveNullAndEmptyArrays: true } },
  //     {
  //       $addFields: {
  //         formattedTimestamp: {
  //           $dateToString: {
  //             date: { $toDate: '$timestamp' },
  //             format: '%b %d, %H:%M:%S',
  //             timezone: 'Asia/Karachi',
  //           },
  //         },
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 0,
  //         timestamp: '$formattedTimestamp',
  //         rawTimestamp: '$timestamp',
  //         Predicted_Genset_Total_kW: 1,
  //         Predicted_Fuel_Rate: 1,
  //         Genset_Total_kW_tmuaibn: '$tmuaibn.Genset_Total_kW',
  //         Fuel_Rate_tmuaibn: '$tmuaibn.Fuel_Rate',
  //       },
  //     },
  //     { $sort: { rawTimestamp: 1 } },
  //   ];

  //   const result = await this.livePredictionCollection
  //     .aggregate(pipeline)
  //     .toArray();

  //   // Update lastTimestamp
  //   if (result.length) {
  //     const newest = result[result.length - 1].rawTimestamp;
  //     this.liveClients[currentClientId] = newest;
  //   }

  //   return {
  //     clientId: currentClientId,
  //     result,
  //   };
  // }
}
