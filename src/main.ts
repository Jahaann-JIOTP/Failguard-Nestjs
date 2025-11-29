import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

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
      'https://9b702e212216.ngrok-free.app',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowedDevOrigins: true,
  });

  await app.listen(process.env.PORT ?? 5000);
  Logger.log('🚀 Application running on http://localhost:5000');
}

bootstrap();
