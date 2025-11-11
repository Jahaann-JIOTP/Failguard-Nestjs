import { MongoClient } from 'mongodb';
import { Provider } from '@nestjs/common';

export const DatabaseProvider: Provider = {
  provide: 'MONGO_CLIENT',
  useFactory: async () => {
    const uri =
      'mongodb://admin:cisco123@13.234.241.103:27017/?authSource=iotdb&readPreference=primary&ssl=false';
    // 'mongodb+srv://alihamza:1uEiKEgyCfNg57qb@cluster0.rtxdhjc.mongodb.net/navy?retryWrites=true&w=majority&appName=Cluster0';
    // 'mongodb://localhost:27017/';
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    return client.db('iotdb');
    // return client.db('navy');
  },
};
