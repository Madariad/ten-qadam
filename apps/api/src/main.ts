import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const allowedOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
  app.setGlobalPrefix('api/v1');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.enableCors({ origin: allowedOrigin, credentials: true, methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-Request-Id'] });
  app.use((request: { method: string; headers: Record<string, string | string[] | undefined> }, response: { status: (code: number) => { json: (body: unknown) => void } }, next: () => void) => {
    const changesState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase());
    const origin = request.headers.origin;
    if (changesState && typeof origin === 'string' && origin !== allowedOrigin) {
      response.status(403).json({ statusCode: 403, message: 'Request origin is not allowed' });
      return;
    }
    next();
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  const swaggerConfig = new DocumentBuilder().setTitle('TEN QADAM API').setDescription('Ролевой API платформы сопровождения студентов').setVersion('1.0').build();
  SwaggerModule.setup('api/v1/docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  await app.listen(Number(process.env.PORT ?? 3001), '0.0.0.0');
  console.log(`TEN QADAM API listening on port ${process.env.PORT ?? 3001}`);
}

void bootstrap();
