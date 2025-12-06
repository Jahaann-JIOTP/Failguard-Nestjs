// src/dashboard/change-stream.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Db, ChangeStream, ChangeStreamDocument } from 'mongodb';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DashboardService } from './dashboard.service';

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/live-stream',
})
export class ChangeStreamService implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private changeStream: ChangeStream;
  private isStreamActive = false;
  private lastProcessedId = new Map<string, string>(); // clientId -> lastDocId
  private connectedClients = new Map<string, Set<string>>(); // dashboard -> clientIds

  constructor(
    @Inject('MONGO_CLIENT') private readonly db: Db,
    private readonly dashboardService: DashboardService,
  ) {}

  async onModuleInit() {
    await this.initializeChangeStream();
  }

  async onModuleDestroy() {
    await this.closeChangeStream();
  }

  /**
   * Initialize MongoDB Change Stream
   */
  private async initializeChangeStream() {
    try {
      const collection = this.db.collection('navy_12s');
      
      console.log('🚀 Initializing MongoDB Change Stream...');
      
      // Create change stream with filter for Genset_Run_SS >= 1
      this.changeStream = collection.watch(
        [
          {
            $match: {
              $or: [
                { operationType: 'insert' },
                { operationType: 'update' },
              ],
              'fullDocument.Genset_Run_SS': { $gte: 1 },
            },
          },
        ],
        {
          fullDocument: 'updateLookup',
          batchSize: 1,
          maxAwaitTimeMS: 1000, // Wait up to 1 second for changes
        },
      );

      // Listen for changes
      this.changeStream.on('change', async (change: ChangeStreamDocument) => {
        await this.handleChange(change);
      });

      this.changeStream.on('error', (error) => {
        console.error('❌ Change Stream Error:', error);
        this.isStreamActive = false;
        
        // Attempt to restart after delay
        setTimeout(() => this.restartChangeStream(), 5000);
      });

      this.changeStream.on('close', () => {
        console.log('🔌 Change Stream closed');
        this.isStreamActive = false;
      });

      this.isStreamActive = true;
      console.log('✅ MongoDB Change Stream initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Change Stream:', error.message);
      console.log('💡 Possible reasons:');
      console.log('1. MongoDB Atlas M0/M2/M5 tier (Change Streams not supported)');
      console.log('2. Replica set not configured');
      console.log('3. Network/firewall issues');
      
      // Fallback to polling
      this.startPollingFallback();
    }
  }

  /**
   * Handle change stream events
   */
  private async handleChange(change: ChangeStreamDocument) {
    try {
      console.log(`📥 Change Stream Event: ${change.operationType}`);
      
      if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'replace') {
        const document = change.fullDocument;
        if (!document) {
          console.log('⚠️ No full document in change event');
          return;
        }

        // Process the document for all dashboards
        const processedData = await this.processDocumentForDashboards(document);
        
        // Broadcast to all connected clients
        this.broadcastToClients(processedData);
        
        // Log performance
        const now = new Date();
        const docTime = new Date(document.timestamp);
        const latency = now.getTime() - docTime.getTime();
        
        console.log(`⚡ Real-time update processed in ${latency}ms`);
        console.log(`📊 Document timestamp: ${document.timestamp}`);
        console.log(`📈 Processed at: ${now.toISOString()}`);
      }
      
    } catch (error) {
      console.error('❌ Error handling change:', error);
    }
  }

  /**
   * Process document for all dashboards
   */
  private async processDocumentForDashboards(document: any) {
    const dashboards = ['dashboard1', 'dashboard2', 'dashboard3', 'dashboard4', 'dashboard5', 'dashboard6'];
    const result: Record<string, any> = {};

    for (const dashboard of dashboards) {
      try {
        // Get dashboard config
        const config = this.dashboardService.getDashboardConfig(dashboard);
        if (!config) continue;

        // Create chart data point
        const chartPoint = {
          time: this.formatTimestamp(document.timestamp),
          ...this.extractChartFields(document, dashboard),
        };

        // Create metrics
        const metrics = config.metricsMapper(document, [], 'live');

        result[dashboard] = {
          metrics,
          charts: this.createChartUpdate(chartPoint, dashboard),
          timestamp: new Date().toISOString(),
          documentId: document._id.toString(),
        };

      } catch (error) {
        console.error(`Error processing ${dashboard}:`, error);
      }
    }

    return result;
  }

  /**
   * Extract chart fields based on dashboard
   */
  private extractChartFields(document: any, dashboard: string): any {
    const fields: any = {};
    
    switch (dashboard) {
      case 'dashboard1':
        fields.Genset_L1L2_Voltage = document.Genset_L1L2_Voltage || 0;
        fields.Genset_L2L3_Voltage = document.Genset_L2L3_Voltage || 0;
        fields.Genset_L3L1_Voltage = document.Genset_L3L1_Voltage || 0;
        fields.Genset_Frequency_OP_calculated = document.Genset_Frequency_OP_calculated || 0;
        break;
      
      case 'dashboard2':
        fields.Genset_L1_Current = document.Genset_L1_Current || 0;
        fields.Genset_L2_Current = document.Genset_L2_Current || 0;
        fields.Genset_L3_Current = document.Genset_L3_Current || 0;
        fields.LoadPercent = this.calculateLoadPercent(document);
        break;
      
      // Add other dashboards...
    }
    
    return fields;
  }

  /**
   * Create chart update structure
   */
  private createChartUpdate(chartPoint: any, dashboard: string): any {
    const chartMap = {
      dashboard1: {
        electricalStability: [chartPoint],
      },
      dashboard2: {
        loadSharing: [chartPoint],
      },
      // Add other dashboards...
    };

    return chartMap[dashboard] || {};
  }

  /**
   * Broadcast to connected WebSocket clients
   */
  private broadcastToClients(data: Record<string, any>) {
    if (!this.server) {
      console.log('⚠️ WebSocket server not initialized');
      return;
    }

    Object.entries(data).forEach(([dashboard, dashboardData]) => {
      // Get clients subscribed to this dashboard
      const clients = this.connectedClients.get(dashboard) || new Set();
      
      clients.forEach(clientId => {
        this.server.to(clientId).emit('realtimeUpdate', {
          dashboard,
          data: dashboardData,
          type: 'changeStream',
          timestamp: new Date().toISOString(),
        });
      });
    });

    console.log(`📤 Broadcasted to ${this.connectedClients.size} dashboard(s)`);
  }

  /**
   * Client subscription management
   */
  subscribeClient(clientId: string, dashboard: string) {
    if (!this.connectedClients.has(dashboard)) {
      this.connectedClients.set(dashboard, new Set());
    }
    
    this.connectedClients.get(dashboard)?.add(clientId);
    console.log(`✅ Client ${clientId} subscribed to ${dashboard}`);
    
    // Send initial data
    this.sendInitialData(clientId, dashboard);
  }

  unsubscribeClient(clientId: string, dashboard: string) {
    this.connectedClients.get(dashboard)?.delete(clientId);
    console.log(`❌ Client ${clientId} unsubscribed from ${dashboard}`);
  }

  /**
   * Send initial data to new client
   */
  private async sendInitialData(clientId: string, dashboard: string) {
    try {
      // Get last 30 seconds of data for the dashboard
      const initialData = await this.dashboardService.getDashboardData(
        dashboard,
        'live',
      );
      
      this.server.to(clientId).emit('realtimeUpdate', {
        dashboard,
        data: initialData,
        type: 'initial',
        timestamp: new Date().toISOString(),
      });
      
      console.log(`📦 Sent initial data to ${clientId} for ${dashboard}`);
    } catch (error) {
      console.error(`Error sending initial data to ${clientId}:`, error);
    }
  }

  /**
   * Fallback polling if Change Streams fail
   */
  private startPollingFallback() {
    console.log('🔄 Starting polling fallback (2 seconds interval)');
    
    let lastPollTime = new Date(Date.now() - 30000); // 30 seconds ago
    
    setInterval(async () => {
      try {
        const collection = this.db.collection('navy_12s');
        
        // Get new documents since last poll
        const newDocs = await collection.find({
          timestamp: { $gt: lastPollTime.toISOString() },
          Genset_Run_SS: { $gte: 1 },
        }).sort({ timestamp: 1 }).toArray();
        
        if (newDocs.length > 0) {
          console.log(`📥 Polling found ${newDocs.length} new documents`);
          
          // Process each document
          for (const doc of newDocs) {
            const processedData = await this.processDocumentForDashboards(doc);
            this.broadcastToClients(processedData);
          }
          
          lastPollTime = new Date(newDocs[newDocs.length - 1].timestamp);
        }
        
      } catch (error) {
        console.error('Polling fallback error:', error);
      }
    }, 2000); // Poll every 2 seconds
  }

  /**
   * Restart change stream on error
   */
  private async restartChangeStream() {
    console.log('🔄 Attempting to restart Change Stream...');
    
    await this.closeChangeStream();
    await this.initializeChangeStream();
  }

  /**
   * Close change stream
   */
  private async closeChangeStream() {
    if (this.changeStream) {
      try {
        await this.changeStream.close();
        console.log('🔌 Change Stream closed gracefully');
      } catch (error) {
        console.error('Error closing Change Stream:', error);
      }
    }
  }

  /**
   * Helper methods
   */
  private formatTimestamp(timestamp: any): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    } catch {
      return new Date().toLocaleTimeString();
    }
  }

  private calculateLoadPercent(doc: any): number {
    const actual = doc.Genset_Total_kW || 0;
    const rated = doc.Genset_Application_kW_Rating_PC2X || 1;
    return rated > 0 ? (actual / rated) * 100 : 0;
  }

  /**
   * Public API
   */
  getStreamStatus() {
    return {
      active: this.isStreamActive,
      connectedClients: Array.from(this.connectedClients.entries()).map(
        ([dashboard, clients]) => ({
          dashboard,
          clientCount: clients.size,
        })
      ),
      uptime: this.isStreamActive ? 'active' : 'inactive',
    };
  }
}