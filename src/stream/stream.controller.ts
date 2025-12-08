// src/stream/stream.controller.ts
import { Controller, Get, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { Inject } from '@nestjs/common';
import { Db } from 'mongodb';

@Controller('stream')
export class StreamController {
  private liveCollection;
  private readonly UPDATE_INTERVAL = 12000; // 12 seconds

  constructor(@Inject('MONGO_CLIENT') private readonly db: Db) {
    this.liveCollection = this.db.collection('navy_12_live');
    console.log('✅ Stream Controller initialized with live collection');
  }

  @Get('live')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async liveStream(@Res() res: Response) {
    console.log('📡 SSE Client connected - Live Dashboard');

    // Set headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection
    res.write('retry: 5000\n\n');
    res.write(
      'event: connected\ndata: {"status": "connected", "time": "' +
        new Date().toISOString() +
        '"}\n\n',
    );

    console.log(
      '🔍 Checking live collection:',
      await this.liveCollection.countDocuments(),
    );

    // Function to send data
    const sendUpdate = async () => {
      try {
        const startTime = Date.now();

        // ✅ DEBUG: Check what's in the collection
        const totalDocs = await this.liveCollection.countDocuments();
        console.log(`📊 Total documents in live collection: ${totalDocs}`);

        if (totalDocs === 0) {
          console.warn('⚠️ Live collection is EMPTY!');
          // Send test data for debugging
          const testData = {
            type: 'test-data',
            timestamp: new Date().toISOString(),
            message: 'Live collection is empty, using test data',
            metrics: {
              load: 45.5,
              rpm: 1800,
              batteryVoltage: 24.5,
              powerFactor: 0.95,
              runningHours: 125.5,
              fuelConsumed: 15.3,
            },
            charts: {
              Genset_L1L2_Voltage: 415,
              Genset_L2L3_Voltage: 413,
              Genset_L3L1_Voltage: 416,
              Genset_Frequency_OP_calculated: 50.1,
              Genset_L1_Current: 120,
              Genset_L2_Current: 118,
              Genset_L3_Current: 122,
              Coolant_Temperature: 85,
              Oil_Temperature: 92,
              Oil_Pressure: 45,
              Fuel_Rate: 12.5,
            },
          };

          res.write(`data: ${JSON.stringify(testData)}\n\n`);
          console.log('📤 Sent test data (collection empty)');
          return;
        }

        // ✅ OPTIMIZED QUERY: Get latest running record
        const latest = await this.liveCollection.findOne(
          {
            Genset_Run_SS: { $gte: 1 }, // Running generator
          },
          {
            sort: { timestamp: -1 },
            projection: {
              // All required fields
              Genset_Total_kW: 1,
              Genset_Application_kW_Rating_PC2X: 1,
              Averagr_Engine_Speed: 1,
              Battery_Voltage_calculated: 1,
              Genset_Total_Power_Factor_calculated: 1,
              Engine_Running_Time_calculated: 1,
              Total_Fuel_Consumption_calculated: 1,
              Genset_L1L2_Voltage: 1,
              Genset_L2L3_Voltage: 1,
              Genset_L3L1_Voltage: 1,
              Genset_Frequency_OP_calculated: 1,
              Genset_L1_Current: 1,
              Genset_L2_Current: 1,
              Genset_L3_Current: 1,
              Coolant_Temperature: 1,
              Oil_Temperature: 1,
              Oil_Pressure: 1,
              Fuel_Rate: 1,
              timestamp: 1,
              Genset_Run_SS: 1,
            },
          },
        );

        const queryTime = Date.now() - startTime;

        if (latest) {
          console.log('✅ Found latest record:', {
            timestamp: latest.timestamp,
            runStatus: latest.Genset_Run_SS,
            load: latest.Genset_Total_kW,
            rpm: latest.Averagr_Engine_Speed,
          });

          // ✅ Calculate load percentage
          const loadPercent =
            latest.Genset_Total_kW && latest.Genset_Application_kW_Rating_PC2X
              ? +(
                  (latest.Genset_Total_kW /
                    latest.Genset_Application_kW_Rating_PC2X) *
                  100
                ).toFixed(1)
              : 0;

          const formattedData = {
            type: 'dashboard-update',
            timestamp: latest.timestamp || new Date().toISOString(),
            serverTime: new Date().toISOString(),
            queryTime: queryTime,
            recordFound: true,
            metrics: {
              load: loadPercent,
              rpm: Math.round(latest.Averagr_Engine_Speed || 0),
              batteryVoltage: +(latest.Battery_Voltage_calculated || 0).toFixed(
                1,
              ),
              powerFactor: +(
                latest.Genset_Total_Power_Factor_calculated || 0
              ).toFixed(2),
              runningHours: +(
                latest.Engine_Running_Time_calculated || 0
              ).toFixed(1),
              fuelConsumed: latest.Total_Fuel_Consumption_calculated
                ? +(latest.Total_Fuel_Consumption_calculated * 3.7854).toFixed(
                    2,
                  )
                : 0,
            },
            charts: {
              Genset_L1L2_Voltage: latest.Genset_L1L2_Voltage || 0,
              Genset_L2L3_Voltage: latest.Genset_L2L3_Voltage || 0,
              Genset_L3L1_Voltage: latest.Genset_L3L1_Voltage || 0,
              Genset_Frequency_OP_calculated:
                latest.Genset_Frequency_OP_calculated || 0,
              Genset_L1_Current: latest.Genset_L1_Current || 0,
              Genset_L2_Current: latest.Genset_L2_Current || 0,
              Genset_L3_Current: latest.Genset_L3_Current || 0,
              Coolant_Temperature: latest.Coolant_Temperature || 0,
              Oil_Temperature: latest.Oil_Temperature || 0,
              Oil_Pressure: latest.Oil_Pressure || 0,
              Fuel_Rate: latest.Fuel_Rate || 0,
            },
          };

          res.write(`data: ${JSON.stringify(formattedData)}\n\n`);
          console.log(`📤 Stream update sent in ${queryTime}ms`);
        } else {
          console.log('⚠️ No running generator found, checking all records...');

          // Try without Genset_Run_SS filter
          const anyRecord = await this.liveCollection.findOne(
            {},
            {
              sort: { timestamp: -1 },
              limit: 1,
            },
          );

          if (anyRecord) {
            console.log('✅ Found record (not running):', anyRecord.timestamp);

            const formattedData = {
              type: 'dashboard-update',
              timestamp: anyRecord.timestamp || new Date().toISOString(),
              serverTime: new Date().toISOString(),
              recordFound: true,
              isRunning: anyRecord.Genset_Run_SS >= 1,
              metrics: {
                load: 0, // Default values
                rpm: 0,
                batteryVoltage: 0,
                powerFactor: 0,
                runningHours: 0,
                fuelConsumed: 0,
              },
              charts: {
                Genset_L1L2_Voltage: anyRecord.Genset_L1L2_Voltage || 0,
                Genset_L2L3_Voltage: anyRecord.Genset_L2L3_Voltage || 0,
                Genset_L3L1_Voltage: anyRecord.Genset_L3L1_Voltage || 0,
                Genset_Frequency_OP_calculated:
                  anyRecord.Genset_Frequency_OP_calculated || 0,
                Genset_L1_Current: anyRecord.Genset_L1_Current || 0,
                Genset_L2_Current: anyRecord.Genset_L2_Current || 0,
                Genset_L3_Current: anyRecord.Genset_L3_Current || 0,
                Coolant_Temperature: anyRecord.Coolant_Temperature || 0,
                Oil_Temperature: anyRecord.Oil_Temperature || 0,
                Oil_Pressure: anyRecord.Oil_Pressure || 0,
                Fuel_Rate: anyRecord.Fuel_Rate || 0,
              },
            };

            res.write(`data: ${JSON.stringify(formattedData)}\n\n`);
            console.log('📤 Sent data from non-running generator');
          } else {
            console.log('❌ No records found in live collection at all');
            res.write(
              'data: {"type": "no-data", "timestamp": "' +
                new Date().toISOString() +
                '", "message": "No records in live collection"}\n\n',
            );
          }
        }
      } catch (error) {
        console.error('❌ Stream error:', error);
        res.write(
          'event: error\ndata: {"type": "error", "message": "Database error: ' +
            error.message +
            '"}\n\n',
        );
      }
    };

    // Send first update immediately
    await sendUpdate();

    // Set interval for updates
    const updateInterval = setInterval(sendUpdate, this.UPDATE_INTERVAL);

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      res.write(': heartbeat\n\n');
      console.log('💓 Heartbeat sent');
    }, 30000);

    // Client disconnect
    res.on('close', () => {
      console.log('❌ SSE Client disconnected');
      clearInterval(updateInterval);
      clearInterval(heartbeatInterval);
    });

    // Handle errors
    res.on('error', (err) => {
      console.error('❌ Response stream error:', err);
      clearInterval(updateInterval);
      clearInterval(heartbeatInterval);
    });
  }
}
