import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { tap, type Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.auth;
    if (!auth || request.path === '/api/v1/health') return next.handle();
    const recordType = request.route?.path ? `${request.baseUrl}${request.route.path}` : request.path;
    const studentId = typeof request.params.studentId === 'string' ? request.params.studentId : null;
    const requestHeader = request.headers['x-request-id'];
    const requestId = typeof requestHeader === 'string' ? requestHeader.slice(0, 80) : null;
    return next.handle().pipe(tap({ complete: () => {
      void this.prisma.auditLog.create({ data: { institutionId: auth.institutionId, actorId: auth.userId, studentId, action: request.method.toUpperCase(), recordType: recordType.slice(0, 100), recordId: typeof request.params.id === 'string' ? request.params.id.slice(0, 64) : null, requestId } }).catch(() => undefined);
    } }));
  }
}
