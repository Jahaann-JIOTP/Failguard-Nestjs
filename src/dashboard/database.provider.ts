import { MongoClient } from 'mongodb';
import { Provider } from '@nestjs/common';

export const DatabaseProvider: Provider = {
  provide: 'MONGO_CLIENT',
  useFactory: async () => {
    const uri =
      'mongodb://admin:cisco123@13.234.241.103:27017/?authSource=iotdb&readPreference=primary&ssl=false';
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client.db('iotdb');
  },
};
