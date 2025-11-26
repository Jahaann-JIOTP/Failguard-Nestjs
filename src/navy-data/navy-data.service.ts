import { Injectable, Inject } from '@nestjs/common';
import { Db } from 'mongodb';

@Injectable()
export class NavyDataService {
  private navyCollection;
  private tmuaibnCollection;

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.navyCollection = this.db.collection('navy_30_S_predicted');
    this.navyCollection.createIndex({ timestamp: 1 });

    this.tmuaibnCollection = this.db.collection('navy_30_S');
    this.tmuaibnCollection.createIndex({ timestamp: 1 });
  }

  async getCombinedData(
    mode: 'historic' | 'live',
    startDate?: string,
    endDate?: string,
  ) {
    let start: string;
    let end: string;

    if (mode === 'historic') {
      if (!startDate || !endDate) {
        throw new Error('start and end dates are required for historic mode');
      }
      start = startDate;
      end = endDate;
    } else if (mode === 'live') {
      // Get today's date in ISO string format (local timezone)
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');

      start = `${yyyy}-${mm}-${dd}T00:00:00+05:00`;
      end = `${yyyy}-${mm}-${dd}T23:59:59+05:00`;
    } else {
      throw new Error('Invalid mode');
    }

    const query = { timestamp: { $gte: start, $lte: end } };

    const navyData = await this.navyCollection.find(query).toArray();

    const tmuaibnData = await this.tmuaibnCollection
      .find(query)
      .project({ _id: 0, Genset_Total_kW: 1, Fuel_Rate: 1, timestamp: 1 })
      .toArray();

    const tmuaibnMap = new Map<string, any>();
    tmuaibnData.forEach((item) => {
      tmuaibnMap.set(item.timestamp, item);
    });

    const mergedData = navyData.map((navItem) => {
      const ts = navItem.timestamp;
      const tmuaibnItem = tmuaibnMap.get(ts) || {};

      function formatTimestampFull(ts: string): string {
        const date = new Date(ts);
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false, // 24-hour format
        });
      }

      // Usage
      const formatted = formatTimestampFull('2025-11-17T09:10:47.907Z');
      console.log(formatted); // Example output: "Nov 17, 09:10:47"

      return {
        timestamp: formatTimestampFull(ts),
        Predicted_Genset_Total_kW: navItem.Predicted_Genset_Total_kW || null,
        Predicted_Fuel_Rate: navItem.Predicted_Fuel_Rate || null,
        Genset_Total_kW_tmuaibn: tmuaibnItem.Genset_Total_kW || null,
        Fuel_Rate_tmuaibn: tmuaibnItem.Fuel_Rate || null,
      };
    });

    return mergedData;
  }
}
