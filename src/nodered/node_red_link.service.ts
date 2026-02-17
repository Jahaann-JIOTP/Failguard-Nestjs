/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
// import { AlarmService } from '../alarms/alarm.service';

@Injectable()
export class NodeRedLinkService {
  private readonly logger = new Logger(NodeRedLinkService.name);

  constructor(private readonly httpService: HttpService) {}

  async fetchDataFromNodeRed() {
    try {
      const res = await this.httpService.axiosRef.get(
        process.env.NODE_RED_LINK || 'http://43.204.118.114:6881/navy',
      );
      return res.data;
    } catch (error) {
      throw new HttpException('Unable to fetch data from Node-RED', 500);
    }
  }
}
