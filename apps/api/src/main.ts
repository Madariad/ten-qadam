import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
  const allowedOrigin = process.env.WEB_ORIGIN;
  app.setGlobalPrefix('api/v1');
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: false,
    frameguard: false,
  }));
  app.enableCors({
    origin: allowedOrigin ? allowedOrigin.split(',').map((s) => s.trim()) : true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-Id'],
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  const swaggerConfig = new DocumentBuilder().setTitle('TEN QADAM API').setDescription('Ролевой API платформы сопровождения студентов').setVersion('1.0').build();
  SwaggerModule.setup('api/v1/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  // Serve built React frontend in cloud/production deployments
  const candidateWebDist = [
    resolve(process.cwd(), '..', 'web', 'dist'),
    resolve(process.cwd(), 'apps', 'web', 'dist'),
  ].find((dir) => existsSync(join(dir, 'index.html')));

  if (candidateWebDist) {
    app.useStaticAssets(candidateWebDist);
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get(/^\/(?!api\/v1).*/, (_req: unknown, res: { sendFile: (p: string) => void }) => {
      res.sendFile(join(candidateWebDist, 'index.html'));
    });
  }

  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
  console.log(`TEN QADAM API listening on port ${process.env.PORT ?? 3001}`);
}

void bootstrap();
