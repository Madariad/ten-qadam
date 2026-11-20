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
    if (ids.length === 0) return { students: 0, plans: 0, actionCompletion: 0, learningChange: null };
    const [plans, actionCount, completed, baseline, reassessment] = await Promise.all([
      this.prisma.supportPlan.count({ where: { institutionId: user.institutionId, studentId: { in: ids }, status: { in: ['IN_PROGRESS', 'PLANNED'] } } }),
      this.prisma.supportPlanAction.count({ where: { plan: { institutionId: user.institutionId, studentId: { in: ids } }, status: { not: 'CANCELLED' } } }),
      this.prisma.supportPlanAction.count({ where: { plan: { institutionId: user.institutionId, studentId: { in: ids } }, status: 'COMPLETED' } }),
      this.prisma.assessmentResult.aggregate({ where: { session: { institutionId: user.institutionId, studentId: { in: ids }, kind: 'BASELINE' } }, _avg: { score: true } }),
      this.prisma.assessmentResult.aggregate({ where: { session: { institutionId: user.institutionId, studentId: { in: ids }, kind: 'REASSESSMENT' } }, _avg: { score: true } }),
    ]);
    const learningChange = baseline._avg.score !== null && reassessment._avg.score !== null ? Number((Number(reassessment._avg.score) - Number(baseline._avg.score)).toFixed(1)) : null;
    return { students: ids.length, plans, actionCompletion: actionCount ? Math.round((completed / actionCount) * 100) : 0, learningChange };
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
