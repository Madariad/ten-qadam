import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { AuthContext } from '../common/auth-context.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ChangeUserStatusDto, CreateUserDto, UpdateUserDto, UpdateUserRoleDto } from './users.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  async list(user: AuthContext) {
    this.access.requireAnyRole(user, ['ADMINISTRATOR']);
    return this.prisma.user.findMany({
      where: { institutionId: user.institutionId },
      select: {
        id: true,
        login: true,
        displayName: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } },
      },
      orderBy: { displayName: 'asc' },
    });
  }

  async auditLogs(user: AuthContext) {
    this.access.requireAnyRole(user, ['ADMINISTRATOR']);
    return this.prisma.auditLog.findMany({
      where: { institutionId: user.institutionId },
      select: { id: true, action: true, recordType: true, occurredAt: true, actor: { select: { login: true, displayName: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 40,
    });
  }

  async create(user: AuthContext, body: CreateUserDto) {
    this.access.requireAnyRole(user, ['ADMINISTRATOR']);
    const existing = await this.prisma.user.findFirst({ where: { institutionId: user.institutionId, login: body.login.trim() } });
    if (existing) throw new ConflictException('Пользователь с таким логином уже существует');
    const role = await this.prisma.role.findUnique({ where: { code: body.role } });
    if (!role) throw new NotFoundException('Роль не найдена');
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    return this.prisma.user.create({
      data: {
        institutionId: user.institutionId,
        login: body.login.trim(),
        displayName: body.displayName.trim(),
        passwordHash,
        roles: { create: { roleId: role.id } },
      },
      select: {
        id: true,
        login: true,
        displayName: true,
        status: true,
        lastLoginAt: true,
        roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } },
      },
    });
  }

  async changeRole(user: AuthContext, targetId: string, body: UpdateUserRoleDto) {
    this.access.requireAnyRole(user, ['ADMINISTRATOR']);
    const target = await this.prisma.user.findFirst({ where: { id: targetId, institutionId: user.institutionId } });
    if (!target) throw new NotFoundException('Пользователь не найден');
    if (targetId === user.userId && body.role !== 'ADMINISTRATOR') {
      throw new ConflictException('Нельзя снять роль администратора со своей собственной учётной записи');
    }
    const role = await this.prisma.role.findUnique({ where: { code: body.role } });
    if (!role) throw new NotFoundException('Роль не найдена');

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: targetId } }),
      this.prisma.userRole.create({ data: { userId: targetId, roleId: role.id } }),
    ]);

    return this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        login: true,
        displayName: true,
        status: true,
        lastLoginAt: true,
        roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } },
      },
    });
  }

  async update(user: AuthContext, targetId: string, body: UpdateUserDto) {
    this.access.requireAnyRole(user, ['ADMINISTRATOR']);
    const target = await this.prisma.user.findFirst({ where: { id: targetId, institutionId: user.institutionId } });
    if (!target) throw new NotFoundException('Пользователь не найден');
    if (targetId === user.userId) {
      if (body.status && body.status !== 'ACTIVE') throw new ConflictException('Нельзя заблокировать собственную учётную запись');
      if (body.role && body.role !== 'ADMINISTRATOR') throw new ConflictException('Нельзя снять роль администратора со своей учётной записи');
    }

    const passwordHash = body.password ? await argon2.hash(body.password, { type: argon2.argon2id }) : undefined;
    const role = body.role ? await this.prisma.role.findUnique({ where: { code: body.role } }) : null;
    if (body.role && !role) throw new NotFoundException('Роль не найдена');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetId },
        data: {
          ...(body.displayName ? { displayName: body.displayName.trim() } : {}),
          ...(passwordHash ? { passwordHash } : {}),
          ...(body.status ? { status: body.status } : {}),
        },
      });
      if (role) {
        await tx.userRole.deleteMany({ where: { userId: targetId } });
        await tx.userRole.create({ data: { userId: targetId, roleId: role.id } });
      }
      if (body.status && body.status !== 'ACTIVE') {
        await tx.userSession.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
      }
    });

    return this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        login: true,
        displayName: true,
        status: true,
        lastLoginAt: true,
        roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } },
      },
    });
  }

  async changeStatus(user: AuthContext, targetId: string, body: ChangeUserStatusDto) {
    this.access.requireAnyRole(user, ['ADMINISTRATOR']);
    if (targetId === user.userId && body.status !== 'ACTIVE') throw new ConflictException('Нельзя заблокировать собственную учётную запись');
    const result = await this.prisma.user.updateMany({ where: { id: targetId, institutionId: user.institutionId }, data: { status: body.status } });
    if (!result.count) throw new NotFoundException('Пользователь не найден');
    if (body.status !== 'ACTIVE') await this.prisma.userSession.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { id: targetId, status: body.status };
  }
}
