import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { AuthContext } from '../common/auth-context.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ChangeUserStatusDto, CreateUserDto } from './users.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  async list(user: AuthContext) {
    this.access.requireAnyRole(user, ['ADMINISTRATOR']);
    return this.prisma.user.findMany({ where: { institutionId: user.institutionId }, select: { id: true, login: true, displayName: true, status: true, lastLoginAt: true, roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } } }, orderBy: { displayName: 'asc' } });
  }

  async create(user: AuthContext, body: CreateUserDto) {
    this.access.requireAnyRole(user, ['ADMINISTRATOR']);
    const existing = await this.prisma.user.findFirst({ where: { institutionId: user.institutionId, login: body.login } });
    if (existing) throw new ConflictException('Пользователь с таким логином уже существует');
    const role = await this.prisma.role.findUnique({ where: { code: body.role } });
    if (!role) throw new NotFoundException('Роль не найдена');
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
    return this.prisma.user.create({ data: { institutionId: user.institutionId, login: body.login, displayName: body.displayName, passwordHash, roles: { create: { roleId: role.id } } }, select: { id: true, login: true, displayName: true, status: true, roles: { include: { role: { select: { code: true, labelKk: true, labelRu: true } } } } } });
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
