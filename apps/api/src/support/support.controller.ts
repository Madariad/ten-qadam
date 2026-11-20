import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard.js';
import { ApplyRecommendationDto, CreateAssessmentDto, CreateObservationDto, CreatePlanActionDto, CreatePlanDto, CreateRecommendationDto, GrantPrivateNoteAccessDto, PrivateNoteDto, UpdatePlanActionDto } from './support.dto.js';
import { SupportService } from './support.service.js';

@ApiTags('support')
@UseGuards(SessionGuard)
@Controller()
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get('students/:studentId/plans') plans(@Req() request: Request, @Param('studentId') studentId: string) { return this.support.plans(request.auth!, studentId); }
  @Post('students/:studentId/plans') createPlan(@Req() request: Request, @Param('studentId') studentId: string, @Body() body: CreatePlanDto) { return this.support.createPlan(request.auth!, studentId, body); }
  @Post('students/:studentId/plans/:planId/actions') createAction(@Req() request: Request, @Param('studentId') studentId: string, @Param('planId') planId: string, @Body() body: CreatePlanActionDto) { return this.support.createAction(request.auth!, studentId, planId, body); }
  @Patch('students/:studentId/actions/:actionId') updateAction(@Req() request: Request, @Param('studentId') studentId: string, @Param('actionId') actionId: string, @Body() body: UpdatePlanActionDto) { return this.support.updateAction(request.auth!, studentId, actionId, body); }
  @Post('students/:studentId/observations') observation(@Req() request: Request, @Param('studentId') studentId: string, @Body() body: CreateObservationDto) { return this.support.addObservation(request.auth!, studentId, body); }
  @Post('students/:studentId/recommendations') recommendation(@Req() request: Request, @Param('studentId') studentId: string, @Body() body: CreateRecommendationDto) { return this.support.addRecommendation(request.auth!, studentId, body); }
  @Post('students/:studentId/recommendations/:recommendationId/applications') application(@Req() request: Request, @Param('studentId') studentId: string, @Param('recommendationId') recommendationId: string, @Body() body: ApplyRecommendationDto) { return this.support.applyRecommendation(request.auth!, studentId, recommendationId, body); }
  @Post('students/:studentId/assessments') assessment(@Req() request: Request, @Param('studentId') studentId: string, @Body() body: CreateAssessmentDto) { return this.support.addAssessment(request.auth!, studentId, body); }
  @Get('students/:studentId/private-notes') privateNotes(@Req() request: Request, @Param('studentId') studentId: string) { return this.support.privateNotes(request.auth!, studentId); }
  @Post('students/:studentId/private-notes') addPrivateNote(@Req() request: Request, @Param('studentId') studentId: string, @Body() body: PrivateNoteDto) { return this.support.addPrivateNote(request.auth!, studentId, body); }
  @Post('students/:studentId/private-notes/:noteId/access') grantNoteAccess(@Req() request: Request, @Param('studentId') studentId: string, @Param('noteId') noteId: string, @Body() body: GrantPrivateNoteAccessDto) { return this.support.grantPrivateNoteAccess(request.auth!, studentId, noteId, body); }
}
