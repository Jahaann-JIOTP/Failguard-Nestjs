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

  // ✅ NEW: Timezone conversion method for Pakistan (UTC+5)
  private formatTimestampForPK(dateString: string): string {
    try {
      if (!dateString) {
        return new Date().toISOString();
      }

      // Parse the incoming timestamp
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', dateString);
        return new Date().toISOString();
      }

      // Get current time in Pakistan (UTC+5)
      const now = new Date();
      const pkOffset = 5 * 60 * 60 * 1000; // +5 hours in milliseconds
      const pkTime = new Date(now.getTime() + pkOffset);

      // Format to ISO with +05:00 timezone
      const year = pkTime.getUTCFullYear();
      const month = String(pkTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(pkTime.getUTCDate()).padStart(2, '0');
      const hour = String(pkTime.getUTCHours()).padStart(2, '0');
      const minute = String(pkTime.getUTCMinutes()).padStart(2, '0');
      const second = String(pkTime.getUTCSeconds()).padStart(2, '0');

      // Return in format: 2025-12-09T11:17:00+05:00
      return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:00`;
    } catch (error) {
      console.error('Error formatting timestamp:', error, dateString);

      // Fallback: Use current Pakistan time
      const now = new Date();
      const pkOffset = 5 * 60 * 60 * 1000;
      const pkTime = new Date(now.getTime() + pkOffset);
      return pkTime.toISOString().replace('Z', '+05:00');
    }
  }

  // ✅ NEW: Get current Pakistan time
  private getCurrentPKTime(): { iso: string; local: string } {
    const now = new Date();
    const pkOffset = 5 * 60 * 60 * 1000; // +5 hours
    const pkTime = new Date(now.getTime() + pkOffset);

    const year = pkTime.getUTCFullYear();
    const month = String(pkTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(pkTime.getUTCDate()).padStart(2, '0');
    const hour = String(pkTime.getUTCHours()).padStart(2, '0');
    const minute = String(pkTime.getUTCMinutes()).padStart(2, '0');
    const second = String(pkTime.getUTCSeconds()).padStart(2, '0');

    return {
      iso: `${year}-${month}-${day}T${hour}:${minute}:${second}+05:00`,
      local: `${day}/${month}/${year} ${hour}:${minute}:${second} PKT`,
    };
  }

  @Get('live')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async liveStream(@Res() res: Response) {
    console.log('📡 SSE Client connected - Live Dashboard');

    // Get current Pakistan time
    const currentPKTime = this.getCurrentPKTime();
    console.log('🕐 Current Pakistan Time:', currentPKTime.local);

    // Set headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial connection with PK time
    res.write('retry: 5000\n\n');
    res.write(
      'event: connected\ndata: {"status": "connected", "time": "' +
        currentPKTime.iso +
        '", "timezone": "Asia/Karachi (UTC+5)"}\n\n',
    );

    console.log(
      '🔍 Checking live collection:',
      await this.liveCollection.countDocuments(),
    );

    // Function to send data
    const sendUpdate = async () => {
      try {
        const startTime = Date.now();
        const currentPKTime = this.getCurrentPKTime();

        // ✅ DEBUG: Check what's in the collection
        const totalDocs = await this.liveCollection.countDocuments();
        console.log(`📊 Total documents in live collection: ${totalDocs}`);
        console.log(`🕐 Current PK Time: ${currentPKTime.local}`);

        if (totalDocs === 0) {
          console.warn('⚠️ Live collection is EMPTY!');
          // Send test data for debugging with PK time
          const testData = {
            type: 'test-data',
            timestamp: currentPKTime.iso,
            serverTime: currentPKTime.local,
            timezone: 'Asia/Karachi (UTC+5)',
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
          console.log('📄 Latest record from DB:', {
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

          // ✅ Use Pakistan time instead of database timestamp
          const formattedTimestamp = currentPKTime.iso;

          const formattedData = {
            type: 'dashboard-update',
            timestamp: formattedTimestamp, // ✅ Pakistan time
            serverTime: currentPKTime.local, // ✅ Human readable PK time
            timezone: 'Asia/Karachi (UTC+5)',
            originalDbTimestamp: latest.timestamp, // Keep original for debugging
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

          console.log('📤 Sending stream data:', {
            timestamp: formattedData.timestamp,
            serverTime: formattedData.serverTime,
            load: formattedData.metrics.load,
            rpm: formattedData.metrics.rpm,
          });

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
              timestamp: currentPKTime.iso, // ✅ Use Pakistan time
              serverTime: currentPKTime.local,
              timezone: 'Asia/Karachi (UTC+5)',
              originalDbTimestamp: anyRecord.timestamp,
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
            const errorData = {
              type: 'no-data',
              timestamp: currentPKTime.iso,
              serverTime: currentPKTime.local,
              timezone: 'Asia/Karachi (UTC+5)',
              message: 'No records in live collection',
            };
            res.write(`data: ${JSON.stringify(errorData)}\n\n`);
          }
        }
      } catch (error) {
        console.error('❌ Stream error:', error);
        const currentPKTime = this.getCurrentPKTime();
        const errorData = {
          event: 'error',
          data: {
            type: 'error',
            timestamp: currentPKTime.iso,
            message: 'Database error: ' + error.message,
          },
        };
        res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      }
    };

    // Send first update immediately
    await sendUpdate();

    // Set interval for updates
    const updateInterval = setInterval(sendUpdate, this.UPDATE_INTERVAL);

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      const currentPKTime = this.getCurrentPKTime();
      const heartbeatData = {
        type: 'heartbeat',
        timestamp: currentPKTime.iso,
        serverTime: currentPKTime.local,
        timezone: 'Asia/Karachi (UTC+5)',
      };
      res.write(`data: ${JSON.stringify(heartbeatData)}\n\n`);
      console.log('💓 Heartbeat sent at:', currentPKTime.local);
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
