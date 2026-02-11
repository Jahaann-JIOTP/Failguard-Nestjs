/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
// import { AlarmService } from '../alarms/alarm.service';

@Injectable()
export class NodeRedLinkService {
  private readonly logger = new Logger(NodeRedLinkService.name);

  constructor(
    private readonly httpService: HttpService,
    // private readonly alarmService: AlarmService,
  ) {}

  async fetchDataFromNodeRed() {
    try {
      const noderedlink = process.env.NODE_RED_LINK as string;
      const response = await this.httpService.axiosRef.get(noderedlink);

      const data = response.data;
      this.logger.log('📡 Received data from Node-RED');
      console.log(data);

      // // Process alarms using your AlarmService
      // const result = await this.alarmService.processGensetData(data);
      // return result;
    } catch (error) {
      this.logger.error(' Failed to fetch Node-RED data', error.message);
      throw error;
    }
  }
}
