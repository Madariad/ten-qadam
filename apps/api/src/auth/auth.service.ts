import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(login: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { login, status: 'ACTIVE' }, include: { roles: { include: { role: true } } } });
    const isValid = user ? await argon2.verify(user.passwordHash, password).catch(() => false) : false;
    if (!user || !isValid) throw new UnauthorizedException('Неверный логин или пароль');
    const token = randomBytes(32).toString('base64url');
    const ttlHours = Number(process.env.SESSION_TTL_HOURS ?? 12);
    const expiresAt = new Date(Date.now() + Math.max(1, ttlHours) * 60 * 60 * 1000);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.userSession.create({ data: { userId: user.id, tokenHash, expiresAt } });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { token, expiresAt, user: { id: user.id, institutionId: user.institutionId, displayName: user.displayName, roles: user.roles.map(({ role }) => role.code) } };
  }

  async logout(token: string | undefined) {
    if (!token) return;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.userSession.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: new Date() } });
  }
}
