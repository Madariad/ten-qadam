import { Injectable } from '@nestjs/common';
import type { AuthContext } from '../common/auth-context.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  async summary(user: AuthContext) {
    const isAdmin = user.roles.includes('ADMINISTRATOR');
    const now = new Date();
    const studentScope = isAdmin ? { institutionId: user.institutionId, status: 'ACTIVE' as const } : {
      institutionId: user.institutionId,
      status: 'ACTIVE' as const,
      assignments: { some: { userId: user.userId, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] } },
    };
    const students = await this.prisma.student.findMany({ where: studentScope, select: { id: true } });
    const ids = students.map(({ id }) => id);
    if (ids.length === 0) {
      return {
        students: 0,
        plans: 0,
        actionCompletion: 0,
        timelyCompletion: 0,
        recommendationsApplied: 0,
        learningChange: null,
        updates: [],
        events: [],
      };
    }

    const [
      plans,
      actionCount,
      completedActions,
      recommendationsCount,
      appliedRecommendationsCount,
      baseline,
      reassessment,
      recentLibrary,
      recentObservations,
      upcomingActions,
    ] = await Promise.all([
      this.prisma.supportPlan.count({ where: { institutionId: user.institutionId, studentId: { in: ids }, status: { in: ['IN_PROGRESS', 'PLANNED'] } } }),
      this.prisma.supportPlanAction.count({ where: { plan: { institutionId: user.institutionId, studentId: { in: ids } }, status: { not: 'CANCELLED' } } }),
      this.prisma.supportPlanAction.findMany({ where: { plan: { institutionId: user.institutionId, studentId: { in: ids } }, status: 'COMPLETED' }, select: { dueAt: true, completedAt: true } }),
      this.prisma.recommendation.count({ where: { institutionId: user.institutionId, studentId: { in: ids } } }),
      this.prisma.recommendation.count({ where: { institutionId: user.institutionId, studentId: { in: ids }, applications: { some: {} } } }),
      this.prisma.assessmentResult.aggregate({ where: { session: { institutionId: user.institutionId, studentId: { in: ids }, kind: 'BASELINE' } }, _avg: { score: true } }),
      this.prisma.assessmentResult.aggregate({ where: { session: { institutionId: user.institutionId, studentId: { in: ids }, kind: 'REASSESSMENT' } }, _avg: { score: true } }),
      this.prisma.libraryItem.findMany({ where: { institutionId: user.institutionId, isPublished: true }, select: { id: true, titleKk: true, titleRu: true, publishedAt: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 2 }),
      this.prisma.observation.findMany({ where: { institutionId: user.institutionId, studentId: { in: ids } }, select: { id: true, context: true, observedAt: true }, orderBy: { observedAt: 'desc' }, take: 2 }),
      this.prisma.supportPlanAction.findMany({
        where: { plan: { institutionId: user.institutionId, studentId: { in: ids } }, status: { in: ['PLANNED', 'IN_PROGRESS'] } },
        select: { id: true, titleKk: true, titleRu: true, dueAt: true, responsible: { select: { displayName: true } } },
        orderBy: { dueAt: 'asc' },
        take: 4,
      }),
    ]);

    const completed = completedActions.length;
    const timelyCount = completedActions.filter((a) => !a.dueAt || !a.completedAt || a.completedAt <= a.dueAt).length;
    const timelyCompletion = completed ? Math.round((timelyCount / completed) * 100) : (actionCount ? 0 : 100);
    const recommendationsApplied = recommendationsCount ? Math.round((appliedRecommendationsCount / recommendationsCount) * 100) : 0;
    const learningChange = baseline._avg.score !== null && reassessment._avg.score !== null ? Number((Number(reassessment._avg.score) - Number(baseline._avg.score)).toFixed(1)) : null;

    const updates = [
      ...recentLibrary.map((item) => ({
        icon: 'document' as const,
        titleKk: item.titleKk,
        titleRu: item.titleRu,
        date: (item.publishedAt ?? item.createdAt).toISOString(),
      })),
      ...recentObservations.map((obs) => ({
        icon: 'people' as const,
        titleKk: obs.context ? `Педагогикалық бақылау: ${obs.context}` : 'Жаңа педагогикалық бақылау тіркелді',
        titleRu: obs.context ? `Педагогическое наблюдение: ${obs.context}` : 'Зарегистрировано новое педагогическое наблюдение',
        date: obs.observedAt.toISOString(),
      })),
    ].slice(0, 4);

    const events = upcomingActions.map((act) => ({
      id: act.id,
      titleKk: act.titleKk,
      titleRu: act.titleRu,
      subtitle: act.responsible.displayName,
      date: act.dueAt ? act.dueAt.toISOString() : null,
    }));

    return {
      students: ids.length,
      plans,
      actionCompletion: actionCount ? Math.round((completed / actionCount) * 100) : 0,
      timelyCompletion,
      recommendationsApplied,
      learningChange,
      updates,
      events,
    };
  }

  async aggregateMetrics(user: AuthContext) {
    const isAdmin = user.roles.includes('ADMINISTRATOR');
    const now = new Date();
    const studentScope = isAdmin ? { institutionId: user.institutionId, status: 'ACTIVE' as const } : {
      institutionId: user.institutionId,
      status: 'ACTIVE' as const,
      assignments: { some: { userId: user.userId, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] } },
    };
    const students = await this.prisma.student.findMany({ where: studentScope, select: { id: true } });
    const ids = students.map(({ id }) => id);
    if (ids.length === 0) return [];
    const sessions = await this.prisma.assessmentSession.findMany({
      where: { institutionId: user.institutionId, studentId: { in: ids } },
      include: { results: true },
      orderBy: { assessedAt: 'asc' },
    });
    const byCriterion = new Map<string, { baseline: number[]; reassessment: number[] }>();
    for (const session of sessions) {
      for (const res of session.results) {
        const entry = byCriterion.get(res.criterion) ?? { baseline: [], reassessment: [] };
        const min = Number(res.scaleMin);
        const max = Number(res.scaleMax);
        const raw = Number(res.score);
        const norm = max > min ? Math.max(0, Math.min(100, Math.round(((raw - min) / (max - min)) * 100))) : 0;
        if (session.kind === 'BASELINE') entry.baseline.push(norm);
        else entry.reassessment.push(norm);
        byCriterion.set(res.criterion, entry);
      }
    }
    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    return Array.from(byCriterion.entries()).map(([criterion, scores]) => ({
      criterion,
      baseline: avg(scores.baseline),
      reassessment: avg(scores.reassessment),
    }));
  }

  async studentMetrics(user: AuthContext, studentId: string) {
    await this.access.requireStudent(user, studentId);
    const allowedSubjects = await this.access.assignedSubjectIds(user, studentId);
    const sessions = await this.prisma.assessmentSession.findMany({
      where: { institutionId: user.institutionId, studentId, ...(allowedSubjects ? { goal: { subjectId: { in: allowedSubjects } } } : {}) },
      include: { goal: { select: { id: true, titleKk: true, titleRu: true, subject: { select: { nameKk: true, nameRu: true } } } }, results: true },
      orderBy: { assessedAt: 'asc' },
    });
    return sessions.map((session) => ({ id: session.id, kind: session.kind, assessedAt: session.assessedAt, goal: session.goal, results: session.results.map((result) => ({ criterion: result.criterion, score: Number(result.score), min: Number(result.scaleMin), max: Number(result.scaleMax), evidence: result.evidence })) }));
  }
}
