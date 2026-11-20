import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  const part = header.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : undefined;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = readCookie(request, process.env.SESSION_COOKIE_NAME ?? 'tenqadam_session');
    if (!token) throw new UnauthorizedException('Войдите в систему');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const session = await this.prisma.userSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() }, user: { status: 'ACTIVE' } },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });
    if (!session) throw new UnauthorizedException('Сессия завершена. Войдите снова.');
    request.auth = {
      userId: session.user.id,
      institutionId: session.user.institutionId,
      displayName: session.user.displayName,
      roles: session.user.roles.map(({ role }) => role.code),
    };
    return true;
  }
}
