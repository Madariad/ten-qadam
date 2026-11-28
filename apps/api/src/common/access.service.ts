import { ForbiddenException, Injectable } from '@nestjs/common';
import type { RoleCode } from '../generated/prisma/client.js';
import type { AuthContext } from './auth-context.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  requireAnyRole(user: AuthContext, roles: RoleCode[]) {
    if (!roles.some((role) => user.roles.includes(role))) throw new ForbiddenException('Недостаточно прав для этого действия');
  }

  async requireStudent(user: AuthContext, studentId: string, subjectId?: string) {
    if (user.roles.includes('ADMINISTRATOR') || user.roles.includes('DEFECTOLOGIST')) return;
    const now = new Date();
    const assignment = await this.prisma.userStudentAssignment.findFirst({
      where: {
        institutionId: user.institutionId, userId: user.userId, studentId, validFrom: { lte: now },
        AND: [
          { OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
          ...(subjectId ? [{ OR: [{ subjectId: null }, { subjectId }] }] : []),
        ],
      }, select: { id: true },
    });
    if (!assignment) throw new ForbiddenException('Студент не назначен этому пользователю');
  }

  async assignedSubjectIds(user: AuthContext, studentId: string): Promise<string[] | null> {
    if (user.roles.includes('ADMINISTRATOR') || user.roles.includes('DEFECTOLOGIST')) return null;
    const now = new Date();
    const assignments = await this.prisma.userStudentAssignment.findMany({
      where: { institutionId: user.institutionId, userId: user.userId, studentId, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
      select: { subjectId: true },
    });
    if (assignments.some((assignment) => assignment.subjectId === null)) return null;
    return [...new Set(assignments.flatMap((assignment) => assignment.subjectId ? [assignment.subjectId] : []))];
  }

  async requireThreadMember(user: AuthContext, threadId: string) {
    const thread = await this.prisma.collaborationThread.findFirst({ where: { id: threadId, institutionId: user.institutionId, members: { some: { userId: user.userId } } }, select: { studentId: true } });
    if (!thread) throw new ForbiddenException('Нет доступа к переписке');
    await this.requireStudent(user, thread.studentId);
    return thread;
  }
}
