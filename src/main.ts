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
      'https://pn.jahaann.com',
      'http://pn.jahaann.com',
      'https://8z5xx3fp-3000.asse.devtunnels.ms',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowedDevOrigins: true,
  });

  // 🕓 Optional: Verify timezone on startup (just for confirmation logs)
  console.log(
    '🕓 Server Timezone:',
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  console.log('🕓 Current Time:', moment().format('YYYY-MM-DD HH:mm:ss Z'));

  await app.listen(process.env.PORT ?? 5003);
  Logger.log('🚀 Application running on http://localhost:5003');
  Logger.log(`📡 WebSocket running on: ws://localhost:5003/live-dashboard`);
}

bootstrap();
