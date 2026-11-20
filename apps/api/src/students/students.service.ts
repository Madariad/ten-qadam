import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../common/auth-context.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAssignmentDto, CreateStudentDto } from './students.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  async findAll(user: AuthContext, search?: string) {
    if (user.roles.includes('ADMINISTRATOR')) throw new ForbiddenException('Администрации доступны только агрегированные показатели');
    const now = new Date();
    return this.prisma.student.findMany({
      where: {
        institutionId: user.institutionId,
        status: 'ACTIVE',
        assignments: { some: { userId: user.userId, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] } },
        ...(search ? { OR: [{ fullName: { contains: search } }, { studentCode: { contains: search } }] } : {}),
      },
      select: { id: true, studentCode: true, fullName: true, status: true, group: { select: { code: true, academicYear: true, specialty: { select: { nameKk: true, nameRu: true } } } } },
      orderBy: { fullName: 'asc' },
      take: 100,
    });
  }

  async groups(user: AuthContext) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST']);
    return this.prisma.studyGroup.findMany({ where: { institutionId: user.institutionId }, select: { id: true, code: true, specialty: { select: { nameKk: true, nameRu: true } } }, orderBy: { code: 'asc' } });
  }

  async findOne(user: AuthContext, studentId: string) {
    await this.access.requireStudent(user, studentId);
    const allowedSubjects = await this.access.assignedSubjectIds(user, studentId);
    const profileCategories = user.roles.some((role) => role === 'DEFECTOLOGIST') ? undefined
      : user.roles.includes('SUBJECT_TEACHER') ? ['PEDAGOGICAL']
        : user.roles.includes('PSYCHOLOGIST') ? ['PSYCHOLOGICAL']
          : user.roles.includes('SOCIAL_PEDAGOG') ? ['SOCIAL'] : [];
    const record = await this.prisma.student.findFirst({
      where: { id: studentId, institutionId: user.institutionId },
      include: {
        group: { include: { specialty: true } },
        supportProfiles: { where: profileCategories ? { category: { in: profileCategories } } : undefined, orderBy: { createdAt: 'desc' }, take: 10 },
        goals: { where: { status: 'ACTIVE', ...(allowedSubjects ? { subjectId: { in: allowedSubjects } } : {}) }, include: { subject: true, assessments: { include: { results: true }, orderBy: { assessedAt: 'desc' }, take: 2 }, recommendations: { orderBy: { createdAt: 'desc' }, take: 5 } } },
        plans: { where: { status: { in: ['IN_PROGRESS', 'PLANNED'] } }, include: { actions: { where: allowedSubjects ? { OR: [{ goalId: null }, { goal: { subjectId: { in: allowedSubjects } } }] } : undefined, orderBy: { dueAt: 'asc' } } }, orderBy: { periodStart: 'desc' }, take: 3 },
      },
    });
    if (!record) throw new NotFoundException('Студент не найден');
    return record;
  }

  async create(user: AuthContext, body: CreateStudentDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST']);
    const group = await this.prisma.studyGroup.findFirst({ where: { id: body.groupId, institutionId: user.institutionId } });
    if (!group) throw new NotFoundException('Учебная группа не найдена');
    return this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({ data: { institutionId: user.institutionId, studentCode: body.studentCode, fullName: body.fullName, groupId: body.groupId } });
      await tx.userStudentAssignment.create({ data: { institutionId: user.institutionId, userId: user.userId, studentId: student.id, assignedById: user.userId } });
      return student;
    });
  }

  async assignments(user: AuthContext, studentId: string) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST']);
    await this.access.requireStudent(user, studentId);
    return this.prisma.userStudentAssignment.findMany({
      where: { institutionId: user.institutionId, studentId, OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] },
      include: {
        user: { select: { id: true, displayName: true, status: true, roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } } } },
        subject: { select: { id: true, nameKk: true, nameRu: true } },
      },
      orderBy: { validFrom: 'desc' },
    });
  }

  async assign(user: AuthContext, studentId: string, body: CreateAssignmentDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST']);
    await this.access.requireStudent(user, studentId);
    const target = await this.prisma.user.findFirst({ where: { id: body.userId, institutionId: user.institutionId, status: 'ACTIVE' }, include: { roles: { include: { role: true } } } });
    if (!target || target.roles.some(({ role }) => role.code === 'ADMINISTRATOR')) throw new NotFoundException('Специалист не найден');
    const isTeacher = target.roles.some(({ role }) => role.code === 'SUBJECT_TEACHER');
    if (isTeacher && !body.subjectId) throw new ForbiddenException('Для преподавателя нужно назначить предмет');
    if (body.subjectId) {
      const subject = await this.prisma.subject.findFirst({ where: { id: body.subjectId, institutionId: user.institutionId } });
      if (!subject) throw new NotFoundException('Предмет не найден');
    }
    const existing = await this.prisma.userStudentAssignment.findFirst({ where: { institutionId: user.institutionId, userId: body.userId, studentId, subjectId: body.subjectId ?? null, OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }] } });
    if (existing) throw new ForbiddenException('Такое назначение уже активно');
    return this.prisma.userStudentAssignment.create({ data: { institutionId: user.institutionId, userId: body.userId, studentId, subjectId: body.subjectId, assignedById: user.userId, validUntil: body.validUntil ? new Date(body.validUntil) : undefined } });
  }

  async revokeAssignment(user: AuthContext, studentId: string, assignmentId: string) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST']);
    await this.access.requireStudent(user, studentId);
    const updated = await this.prisma.userStudentAssignment.updateMany({ where: { id: assignmentId, institutionId: user.institutionId, studentId, validUntil: null }, data: { validUntil: new Date() } });
    if (!updated.count) throw new NotFoundException('Активное назначение не найдено');
    return { ok: true };
  }
}
