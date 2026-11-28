import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../common/auth-context.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAssignmentDto, CreateLearningGoalDto, CreateStudentDto, CreateStudyGroupDto, CreateSubjectDto, CreateSupportProfileDto } from './students.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  async findAll(user: AuthContext, search?: string) {
    const isAdminOrDefectologist = user.roles.includes('ADMINISTRATOR') || user.roles.includes('DEFECTOLOGIST');
    const now = new Date();
    return this.prisma.student.findMany({
      where: {
        institutionId: user.institutionId,
        status: 'ACTIVE',
        ...(isAdminOrDefectologist ? {} : { assignments: { some: { userId: user.userId, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] } } }),
        ...(search ? { OR: [{ fullName: { contains: search } }, { studentCode: { contains: search } }] } : {}),
      },
      select: { id: true, studentCode: true, fullName: true, status: true, group: { select: { code: true, academicYear: true, specialty: { select: { nameKk: true, nameRu: true } } } } },
      orderBy: { fullName: 'asc' },
      take: 100,
    });
  }

  async groups(user: AuthContext) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'ADMINISTRATOR', 'SUBJECT_TEACHER', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG']);
    return this.prisma.studyGroup.findMany({ where: { institutionId: user.institutionId }, select: { id: true, code: true, academicYear: true, specialty: { select: { id: true, code: true, nameKk: true, nameRu: true } } }, orderBy: { code: 'asc' } });
  }

  async createGroup(user: AuthContext, body: CreateStudyGroupDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'ADMINISTRATOR']);
    const code = body.code.trim().toUpperCase();
    const academicYear = (body.academicYear ?? '2026-2027').trim();
    const specNameKk = body.specialtyNameKk.trim();
    const specNameRu = (body.specialtyNameRu ?? body.specialtyNameKk).trim();
    const specCode = (body.specialtyCode?.trim() || specNameKk.slice(0, 12).toUpperCase().replace(/\s+/g, '-')).slice(0, 32);

    const existing = await this.prisma.studyGroup.findFirst({
      where: { institutionId: user.institutionId, code, academicYear },
    });
    if (existing) throw new ConflictException('Учебная группа с таким кодом уже существует');

    const specialty = await this.prisma.specialty.upsert({
      where: { institutionId_code: { institutionId: user.institutionId, code: specCode } },
      update: { nameKk: specNameKk, nameRu: specNameRu },
      create: { institutionId: user.institutionId, code: specCode, nameKk: specNameKk, nameRu: specNameRu },
    });

    return this.prisma.studyGroup.create({
      data: {
        institutionId: user.institutionId,
        specialtyId: specialty.id,
        code,
        academicYear,
      },
      select: { id: true, code: true, academicYear: true, specialty: { select: { id: true, code: true, nameKk: true, nameRu: true } } },
    });
  }

  async subjects(user: AuthContext) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'ADMINISTRATOR', 'SUBJECT_TEACHER', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG']);
    return this.prisma.subject.findMany({ where: { institutionId: user.institutionId }, select: { id: true, code: true, nameKk: true, nameRu: true }, orderBy: { nameKk: 'asc' } });
  }

  async createSubject(user: AuthContext, body: CreateSubjectDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'ADMINISTRATOR']);
    const code = body.code.trim().toUpperCase();
    const nameKk = body.nameKk.trim();
    const nameRu = (body.nameRu ?? body.nameKk).trim();
    return this.prisma.subject.upsert({
      where: { institutionId_code: { institutionId: user.institutionId, code } },
      update: { nameKk, nameRu },
      create: { institutionId: user.institutionId, code, nameKk, nameRu },
      select: { id: true, code: true, nameKk: true, nameRu: true },
    });
  }

  async specialists(user: AuthContext) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG']);
    return this.prisma.user.findMany({
      where: {
        institutionId: user.institutionId,
        status: 'ACTIVE',
        roles: { some: { role: { code: { in: ['DEFECTOLOGIST', 'SUBJECT_TEACHER', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG'] } } } },
      },
      select: { id: true, login: true, displayName: true, roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } } },
      orderBy: { displayName: 'asc' },
    });
  }

  async findOne(user: AuthContext, studentId: string) {
    await this.access.requireStudent(user, studentId);
    const allowedSubjects = await this.access.assignedSubjectIds(user, studentId);
    const profileCategories = user.roles.some((role) => role === 'DEFECTOLOGIST') ? undefined
      : user.roles.includes('SUBJECT_TEACHER') ? ['PEDAGOGICAL']
        : user.roles.includes('PSYCHOLOGIST') ? ['PSYCHOLOGICAL']
          : user.roles.includes('SOCIAL_PEDAGOG') ? ['SOCIAL'] : [];
    const now = new Date();
    const record = await this.prisma.student.findFirst({
      where: { id: studentId, institutionId: user.institutionId },
      include: {
        group: { include: { specialty: true } },
        assignments: {
          where: { validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
          include: {
            user: { select: { id: true, displayName: true, roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } } } },
            subject: { select: { id: true, nameKk: true, nameRu: true } },
          },
          orderBy: { validFrom: 'desc' },
        },
        supportProfiles: { where: profileCategories ? { category: { in: profileCategories } } : undefined, include: { createdBy: { select: { displayName: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
        goals: {
          where: { status: 'ACTIVE', ...(allowedSubjects ? { subjectId: { in: allowedSubjects } } : {}) },
          include: {
            subject: true,
            assessments: { include: { results: true, assessor: { select: { displayName: true } } }, orderBy: { assessedAt: 'desc' }, take: 10 },
            recommendations: { include: { author: { select: { displayName: true } }, applications: { include: { appliedBy: { select: { displayName: true } } }, orderBy: { appliedAt: 'desc' } } }, orderBy: { createdAt: 'desc' }, take: 20 },
            observations: { include: { author: { select: { displayName: true } }, subject: true }, orderBy: { observedAt: 'desc' }, take: 20 },
          },
        },
        observations: {
          where: allowedSubjects ? { OR: [{ subjectId: { in: allowedSubjects } }, { goal: { subjectId: { in: allowedSubjects } } }] } : undefined,
          include: { author: { select: { displayName: true } }, subject: true, goal: { select: { id: true, titleKk: true, titleRu: true } } },
          orderBy: { observedAt: 'desc' },
          take: 30,
        },
        recommendations: {
          where: allowedSubjects ? { OR: [{ goalId: null }, { goal: { subjectId: { in: allowedSubjects } } }] } : undefined,
          include: {
            author: { select: { displayName: true } },
            goal: { select: { id: true, titleKk: true, titleRu: true } },
            applications: { include: { appliedBy: { select: { displayName: true } } }, orderBy: { appliedAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
        plans: {
          where: { status: { in: ['IN_PROGRESS', 'PLANNED'] } },
          include: {
            actions: {
              where: allowedSubjects ? { OR: [{ goalId: null }, { goal: { subjectId: { in: allowedSubjects } } }] } : undefined,
              include: { responsible: { select: { id: true, displayName: true } }, goal: { select: { id: true, titleKk: true, titleRu: true } } },
              orderBy: { dueAt: 'asc' },
            },
          },
          orderBy: { periodStart: 'desc' },
          take: 5,
        },
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

  async addSupportProfile(user: AuthContext, studentId: string, body: CreateSupportProfileDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG']);
    await this.access.requireStudent(user, studentId);
    const allowedCategory = user.roles.includes('DEFECTOLOGIST') ? body.category
      : user.roles.includes('PSYCHOLOGIST') ? 'PSYCHOLOGICAL'
        : 'SOCIAL';
    return this.prisma.studentSupportProfile.create({
      data: {
        institutionId: user.institutionId,
        studentId,
        createdById: user.userId,
        category: allowedCategory,
        description: body.description,
        reviewAt: body.reviewAt ? new Date(body.reviewAt) : undefined,
      },
    });
  }

  async addGoal(user: AuthContext, studentId: string, body: CreateLearningGoalDto) {
    this.access.requireAnyRole(user, ['DEFECTOLOGIST', 'SUBJECT_TEACHER']);
    await this.access.requireStudent(user, studentId, body.subjectId);
    const subject = await this.prisma.subject.findFirst({ where: { id: body.subjectId, institutionId: user.institutionId } });
    if (!subject) throw new NotFoundException('Предмет не найден');
    return this.prisma.learningGoal.create({
      data: {
        institutionId: user.institutionId,
        studentId,
        subjectId: body.subjectId,
        ownerId: user.userId,
        titleKk: body.titleKk,
        titleRu: body.titleRu,
        successCriteria: body.successCriteria,
        targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
        status: 'ACTIVE',
      },
      include: { subject: true },
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
