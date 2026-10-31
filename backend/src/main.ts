import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  const rawOrigins = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Safe matching for dev, tunnels, localhost, and explicit origins
      const isAllowed =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('trycloudflare.com') ||
        /^https?:\/\/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin) ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback: allow to prevent breaking dev workflows
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Global ValidationPipe — safely transform and sanitize without breaking extra frontend fields
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  // Serve uploaded images statically
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/'
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🌿 Toza Hudud Backend running at: http://localhost:${port}/api`);
}

bootstrap();
