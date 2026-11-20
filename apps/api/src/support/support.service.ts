import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../common/auth-context.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ApplyRecommendationDto, CreateAssessmentDto, CreateObservationDto, CreatePlanActionDto, CreatePlanDto, CreateRecommendationDto, PrivateNoteDto, UpdatePlanActionDto } from './support.dto.js';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  private async goalSubject(user: AuthContext, studentId: string, goalId?: string) {
    if (!goalId) return undefined;
    const goal = await this.prisma.learningGoal.findFirst({ where: { id: goalId, institutionId: user.institutionId, studentId }, select: { subjectId: true } });
    if (!goal) throw new NotFoundException('Учебная цель не найдена');
    return goal.subjectId;
  }

  async addObservation(user: AuthContext, studentId: string, body: CreateObservationDto) {
    this.access.requireAnyRole(user, ['SUBJECT_TEACHER', 'DEFECTOLOGIST']);
    const subjectId = body.subjectId ?? await this.goalSubject(user, studentId, body.goalId);
    if (user.roles.includes('SUBJECT_TEACHER') && !subjectId) throw new ForbiddenException('Преподавателю нужно выбрать назначенный предмет');
    await this.access.requireStudent(user, studentId, subjectId);
    return this.prisma.observation.create({ data: { institutionId: user.institutionId, studentId, goalId: body.goalId, subjectId, authorId: user.userId, observedAt: new Date(body.observedAt), context: body.context, observationText: body.observationText } });
  }

  async addRecommendation(user: AuthContext, studentId: string, body: CreateRecommendationDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG']);
    const subjectId = await this.goalSubject(user, studentId, body.goalId);
    await this.access.requireStudent(user, studentId, subjectId);
    const domain = user.roles.find((role) => ['DEFECTOLOGIST', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG'].includes(role))!;
    return this.prisma.recommendation.create({ data: { institutionId: user.institutionId, studentId, goalId: body.goalId, authorId: user.userId, domain, title: body.title, content: body.content } });
  }

  async applyRecommendation(user: AuthContext, studentId: string, recommendationId: string, body: ApplyRecommendationDto) {
    this.access.requireAnyRole(user, ['SUBJECT_TEACHER']);
    const recommendation = await this.prisma.recommendation.findFirst({ where: { id: recommendationId, studentId, institutionId: user.institutionId }, include: { goal: { select: { subjectId: true } } } });
    if (!recommendation) throw new NotFoundException('Рекомендация не найдена');
    await this.access.requireStudent(user, studentId, recommendation.goal?.subjectId);
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.recommendationApplication.create({ data: { institutionId: user.institutionId, recommendationId, appliedById: user.userId, appliedAt: new Date(body.appliedAt), outcome: body.outcome, reflection: body.reflection } });
      await tx.recommendation.update({ where: { id: recommendationId }, data: { status: 'IN_PROGRESS' } });
      return application;
    });
  }

  async addAssessment(user: AuthContext, studentId: string, body: CreateAssessmentDto) {
    this.access.requireAnyRole(user, ['SUBJECT_TEACHER', 'DEFECTOLOGIST']);
    const subjectId = await this.goalSubject(user, studentId, body.goalId);
    if (user.roles.includes('SUBJECT_TEACHER') && !subjectId) throw new ForbiddenException('Преподавателю нужно выбрать цель по назначенному предмету');
    await this.access.requireStudent(user, studentId, subjectId);
    return this.prisma.assessmentSession.create({
      data: {
        institutionId: user.institutionId, studentId, goalId: body.goalId, assessorId: user.userId, kind: body.kind, assessedAt: new Date(body.assessedAt), note: body.note,
        results: { create: body.results.map((result) => ({ criterion: result.criterion, score: result.score, scaleMin: result.scaleMin ?? 0, scaleMax: result.scaleMax ?? 100, evidence: result.evidence })) },
      }, include: { results: true },
    });
  }

  async plans(user: AuthContext, studentId: string) {
    await this.access.requireStudent(user, studentId);
    const allowedSubjects = await this.access.assignedSubjectIds(user, studentId);
    return this.prisma.supportPlan.findMany({ where: { institutionId: user.institutionId, studentId }, include: { actions: { where: allowedSubjects ? { OR: [{ goalId: null, responsibleId: user.userId }, { goal: { subjectId: { in: allowedSubjects } } }] } : undefined, include: { responsible: { select: { id: true, displayName: true } }, goal: { select: { titleKk: true, titleRu: true } } }, orderBy: { dueAt: 'asc' } } }, orderBy: { periodStart: 'desc' } });
  }

  async createPlan(user: AuthContext, studentId: string, body: CreatePlanDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'SOCIAL_PEDAGOG', 'PSYCHOLOGIST']);
    await this.access.requireStudent(user, studentId);
    return this.prisma.supportPlan.create({ data: { institutionId: user.institutionId, studentId, createdById: user.userId, title: body.title, periodStart: new Date(body.periodStart), periodEnd: body.periodEnd ? new Date(body.periodEnd) : undefined } });
  }

  async createAction(user: AuthContext, studentId: string, planId: string, body: CreatePlanActionDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'SOCIAL_PEDAGOG', 'PSYCHOLOGIST']);
    await this.access.requireStudent(user, studentId);
    const plan = await this.prisma.supportPlan.findFirst({ where: { id: planId, studentId, institutionId: user.institutionId }, select: { id: true } });
    if (!plan) throw new NotFoundException('План поддержки не найден');
    const responsible = await this.prisma.user.findFirst({ where: { id: body.responsibleId, institutionId: user.institutionId, status: 'ACTIVE' }, select: { id: true } });
    if (!responsible) throw new NotFoundException('Ответственный специалист не найден');
    const assignment = await this.prisma.userStudentAssignment.findFirst({ where: { institutionId: user.institutionId, userId: body.responsibleId, studentId, validFrom: { lte: new Date() }, OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] }, select: { id: true } });
    if (!assignment) throw new ForbiddenException('Сначала назначьте ответственного специалиста этому студенту');
    if (body.goalId) await this.goalSubject(user, studentId, body.goalId);
    return this.prisma.supportPlanAction.create({ data: { planId, goalId: body.goalId, responsibleId: body.responsibleId, titleKk: body.titleKk, titleRu: body.titleRu, description: body.description, dueAt: body.dueAt ? new Date(body.dueAt) : undefined } });
  }

  async updateAction(user: AuthContext, studentId: string, actionId: string, body: UpdatePlanActionDto) {
    const action = await this.prisma.supportPlanAction.findFirst({ where: { id: actionId, plan: { institutionId: user.institutionId, studentId } } });
    if (!action) throw new NotFoundException('Мероприятие не найдено');
    if (action.responsibleId !== user.userId && !user.roles.includes('DEFECTOLOGIST') && !user.roles.includes('SOCIAL_PEDAGOG')) throw new ForbiddenException('Изменить статус может ответственный специалист');
    await this.access.requireStudent(user, studentId, action.goalId ? (await this.goalSubject(user, studentId, action.goalId)) : undefined);
    return this.prisma.supportPlanAction.update({ where: { id: actionId }, data: { status: body.status, result: body.result, completedAt: body.status === 'COMPLETED' ? new Date() : null } });
  }

  async privateNotes(user: AuthContext, studentId: string) {
    this.access.requireAnyRole(user, ['PSYCHOLOGIST']);
    await this.access.requireStudent(user, studentId);
    return this.prisma.specialistPrivateNote.findMany({ where: { institutionId: user.institutionId, studentId, OR: [{ authorId: user.userId }, { accessList: { some: { userId: user.userId } } }] }, select: { id: true, title: true, content: true, domain: true, createdAt: true, authorId: true }, orderBy: { createdAt: 'desc' } });
  }

  async addPrivateNote(user: AuthContext, studentId: string, body: PrivateNoteDto) {
    this.access.requireAnyRole(user, ['PSYCHOLOGIST']);
    await this.access.requireStudent(user, studentId);
    return this.prisma.specialistPrivateNote.create({ data: { institutionId: user.institutionId, studentId, authorId: user.userId, domain: 'PSYCHOLOGIST', title: body.title, content: body.content } });
  }
}
