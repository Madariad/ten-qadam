import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client.js';

export function resolveDbConfig() {
  const rawUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      return {
        host: parsed.hostname || 'localhost',
        port: Number(parsed.port || 3306),
        user: decodeURIComponent(parsed.username || 'root'),
        password: decodeURIComponent(parsed.password || ''),
        database: parsed.pathname.replace(/^\//, '') || 'tenqadam',
      };
    } catch {
      /* fallback to env vars */
    }
  }
  return {
    host: process.env.DATABASE_HOST ?? process.env.MYSQLHOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? process.env.MYSQLPORT ?? 3307),
    user: process.env.DATABASE_USER ?? process.env.MYSQLUSER ?? 'tenqadam',
    password: process.env.DATABASE_PASSWORD ?? process.env.MYSQLPASSWORD ?? 'tenqadam_dev_password',
    database: process.env.DATABASE_NAME ?? process.env.MYSQLDATABASE ?? 'tenqadam',
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const db = resolveDbConfig();
    const adapter = new PrismaMariaDb({
      ...db,
      connectionLimit: 5,
      allowPublicKeyRetrieval: true,
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}