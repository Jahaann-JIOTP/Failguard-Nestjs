import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as moment from 'moment-timezone';  


process.env.TZ = 'Asia/Karachi';
moment.tz.setDefault('Asia/Karachi');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // CORS configured correctly
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://192.168.2.245:3000',
      'http://192.168.2.174:3000',
      'http://192.168.3.58:3000',
      'http://110.39.23.107:3000',
      'https://z0x4xwtp-3000.inc1.devtunnels.ms',
      'http://110.39.23.106:3053',
      'https://ee601cedb676.ngrok-free.app',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowedDevOrigins: true,
  });


    // 🕓 Optional: Verify timezone on startup (just for confirmation logs)
  console.log('🕓 Server Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('🕓 Current Time:', moment().format('YYYY-MM-DD HH:mm:ss Z'));

  await app.listen(process.env.PORT ?? 5000);
  Logger.log('🚀 Application running on http://localhost:5000');
  Logger.log(`📡 WebSocket running on: ws://localhost:5000/live-dashboard`);
}

bootstrap();
