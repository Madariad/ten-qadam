import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('dashboard')
@UseGuards(SessionGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get('summary') summary(@Req() request: Request) { return this.dashboard.summary(request.auth!); }
  @Get('metrics') aggregateMetrics(@Req() request: Request) { return this.dashboard.aggregateMetrics(request.auth!); }
  @Get('students/:studentId/metrics') metrics(@Req() request: Request, @Param('studentId') studentId: string) { return this.dashboard.studentMetrics(request.auth!, studentId); }
}
