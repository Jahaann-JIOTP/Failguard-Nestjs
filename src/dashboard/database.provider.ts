import { MongoClient } from 'mongodb';
import { Provider } from '@nestjs/common';

export const DatabaseProvider: Provider = {
  provide: 'MONGO_CLIENT',
  useFactory: async () => {
    const uri =
      // 'mongodb://admin:cisco123@13.234.241.103:27017/navy?authSource=admin&readPreference=primary&ssl=false';
      'mongodb://Jamal:rVl8O8iMN@43.204.118.114:57019/navy?authSource=admin&readPreference=primary&ssl=false&maxPoolSize=10&minPoolSize=5&maxIdleTimeMS=60000&serverSelectionTimeoutMS=5000&socketTimeoutMS=45000';
    // 'mongodb://localhost:27017/';
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    // return client.db('iotdb');
    return client.db('navy');
  },
};
