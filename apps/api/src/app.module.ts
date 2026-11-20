import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { SessionGuard } from './auth/session.guard.js';
import { AccessService } from './common/access.service.js';
import { AuditInterceptor } from './common/audit.interceptor.js';
import { DashboardController } from './dashboard/dashboard.controller.js';
import { DashboardService } from './dashboard/dashboard.service.js';
import { HealthController } from './health.controller.js';
import { LibraryController } from './library/library.controller.js';
import { MessagesController } from './messages/messages.controller.js';
import { PrismaService } from './prisma/prisma.service.js';
import { StudentsController } from './students/students.controller.js';
import { StudentsService } from './students/students.service.js';
import { SupportController } from './support/support.controller.js';
import { SupportService } from './support/support.service.js';
import { UsersController } from './users/users.controller.js';
import { UsersService } from './users/users.service.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }), ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }])],
  controllers: [AuthController, DashboardController, HealthController, StudentsController, SupportController, LibraryController, MessagesController, UsersController],
  providers: [PrismaService, AuthService, SessionGuard, AccessService, DashboardService, StudentsService, SupportService, UsersService, { provide: APP_GUARD, useClass: ThrottlerGuard }, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
