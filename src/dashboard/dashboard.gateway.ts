// src/dashboard/dashboard.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DashboardService } from './dashboard.service';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Production mein specific domain dal dein
    credentials: true,
  },
  namespace: '/live-dashboard',
  transports: ['websocket', 'polling'],
})
@Injectable()
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DashboardGateway.name);

  @WebSocketServer()
  server: Server;

  // Har client ke liye alag interval store karein
  private clientIntervals = new Map<string, NodeJS.Timeout>();

  // Active live dashboards track karein
  private activeDashboards = new Map<string, Set<string>>(); // clientId -> dashboards Set

  constructor(private readonly dashboardService: DashboardService) {
    this.logger.log('Dashboard WebSocket Gateway initialized');
  }

  /**
   * Client connect hone par
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client connected: ${clientId}`);

    // Welcome message
    client.emit('connected', {
      message: 'Connected to Live Dashboard Server',
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Client ke liye active dashboards ka Set initialize karein
    this.activeDashboards.set(clientId, new Set());
  }

  /**
   * Client disconnect hone par
   */
  handleDisconnect(@ConnectedSocket() client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client disconnected: ${clientId}`);

    // Client ke sabhi intervals clear karein
    this.stopAllLiveUpdatesForClient(clientId);

    // Cleanup
    this.activeDashboards.delete(clientId);
  }

  /**
   * Live updates start karne ka handler
   */
  @SubscribeMessage('startLive')
  async handleStartLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { dashboard: string },
  ) {
    const clientId = client.id;
    const { dashboard } = payload;

    if (!dashboard) {
      client.emit('error', {
        message: 'Dashboard name is required',
        code: 'DASHBOARD_REQUIRED',
      });
      return;
    }

    this.logger.log(
      `Client ${clientId} starting live updates for ${dashboard}`,
    );

    // Pehle existing interval stop karein is dashboard ke liye
    this.stopLiveUpdatesForDashboard(clientId, dashboard);

    // Initial data bhejein
    await this.sendLiveDataToClient(client, dashboard);

    // Every 12 seconds updates start karein
    const interval = setInterval(async () => {
      await this.sendLiveDataToClient(client, dashboard);
    }, 12000); // 12 seconds

    // Interval store karein
    this.clientIntervals.set(`${clientId}_${dashboard}`, interval);

    // Active dashboard add karein
    const dashboards = this.activeDashboards.get(clientId);
    if (dashboards) {
      dashboards.add(dashboard);
    }

    client.emit('liveStarted', {
      dashboard,
      message: `Live updates started for ${dashboard}`,
      updateInterval: 12000,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Live updates stop karne ka handler
   */
  @SubscribeMessage('stopLive')
  handleStopLive(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { dashboard?: string },
  ) {
    const clientId = client.id;
    const { dashboard } = payload;

    if (dashboard) {
      // Specific dashboard stop karein
      this.stopLiveUpdatesForDashboard(clientId, dashboard);
      client.emit('liveStopped', {
        dashboard,
        message: `Live updates stopped for ${dashboard}`,
      });
    } else {
      // Sabhi dashboards stop karein
      this.stopAllLiveUpdatesForClient(clientId);
      client.emit('allLiveStopped', {
        message: 'All live updates stopped',
      });
    }
  }

  /**
   * Specific dashboard data fetch karne ka handler
   */
  @SubscribeMessage('getDashboard')
  async handleGetDashboard(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      dashboard: string;
      mode: 'live' | 'historic' | 'range';
      start?: string;
      end?: string;
    },
  ) {
    const { dashboard, mode, start, end } = payload;

    this.logger.log(
      `Client ${client.id} fetching ${dashboard} in ${mode} mode`,
    );

    try {
      const data = await this.dashboardService.getDashboardData(
        dashboard,
        mode,
        start,
        end,
      );

      client.emit('dashboardData', {
        dashboard,
        mode,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error fetching dashboard ${dashboard}:`, error);
      client.emit('error', {
        dashboard,
        message: `Failed to fetch ${dashboard}: ${error.message}`,
        code: 'FETCH_ERROR',
      });
    }
  }

  /**
   * Multiple dashboards ek saath fetch karne ka handler
   */
  @SubscribeMessage('getMultipleDashboards')
  async handleGetMultipleDashboards(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      dashboards: string[];
      mode: 'live' | 'historic' | 'range';
      start?: string;
      end?: string;
    },
  ) {
    const { dashboards, mode, start, end } = payload;

    this.logger.log(
      `Client ${client.id} fetching ${dashboards.length} dashboards`,
    );

    try {
      const results = await this.dashboardService.getMultipleDashboards(
        dashboards,
        mode,
        start,
        end,
      );

      client.emit('multipleDashboardsData', {
        dashboards,
        mode,
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error fetching multiple dashboards:`, error);
      client.emit('error', {
        message: `Failed to fetch dashboards: ${error.message}`,
        code: 'MULTI_FETCH_ERROR',
      });
    }
  }

  /**
   * Client ke liye live data fetch karke bhejna
   */
  private async sendLiveDataToClient(client: Socket, dashboard: string) {
    try {
      const data = await this.dashboardService.getDashboardData(
        dashboard,
        'live',
      );

      client.emit('liveUpdate', {
        dashboard,
        data,
        timestamp: new Date().toISOString(),
        serverTime: Date.now(),
      });

      this.logger.debug(`Live update sent for ${dashboard} to ${client.id}`);
    } catch (error) {
      this.logger.error(`Error sending live update for ${dashboard}:`, error);
      client.emit('error', {
        dashboard,
        message: `Live update failed: ${error.message}`,
        code: 'LIVE_UPDATE_ERROR',
      });
    }
  }

  /**
   * Specific dashboard ke live updates stop karein
   */
  private stopLiveUpdatesForDashboard(clientId: string, dashboard: string) {
    const intervalKey = `${clientId}_${dashboard}`;
    const interval = this.clientIntervals.get(intervalKey);

    if (interval) {
      clearInterval(interval);
      this.clientIntervals.delete(intervalKey);
      this.logger.log(
        `Stopped live updates for ${dashboard} (client: ${clientId})`,
      );
    }

    // Active dashboard list se remove karein
    const dashboards = this.activeDashboards.get(clientId);
    if (dashboards) {
      dashboards.delete(dashboard);
    }
  }

  /**
   * Client ke sabhi live updates stop karein
   */
  private stopAllLiveUpdatesForClient(clientId: string) {
    // Sabhi intervals clear karein
    for (const [key, interval] of this.clientIntervals.entries()) {
      if (key.startsWith(`${clientId}_`)) {
        clearInterval(interval);
        this.clientIntervals.delete(key);
      }
    }

    // Active dashboards clear karein
    this.activeDashboards.delete(clientId);

    this.logger.log(`Stopped all live updates for client: ${clientId}`);
  }

  /**
   * Get active clients info (admin ke liye)
   */
  @SubscribeMessage('getActiveClients')
  handleGetActiveClients(@ConnectedSocket() client: Socket) {
    const activeClients = Array.from(this.activeDashboards.entries()).map(
      ([clientId, dashboards]) => ({
        clientId,
        dashboards: Array.from(dashboards),
        connectionTime: 'N/A', // Aap timestamp bhi store kar sakte hain
      }),
    );

    client.emit('activeClients', {
      totalClients: activeClients.length,
      clients: activeClients,
      timestamp: new Date().toISOString(),
    });
  }
}
