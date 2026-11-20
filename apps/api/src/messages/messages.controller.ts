import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMessageDto, CreateThreadDto, UpdateThreadStatusDto } from './messages.dto.js';

@ApiTags('collaboration')
@UseGuards(SessionGuard)
@Controller()
export class MessagesController {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  @Get('students/:studentId/threads')
  async list(@Req() request: Request, @Param('studentId') studentId: string) {
    const user = request.auth!;
    await this.access.requireStudent(user, studentId);
    const now = new Date();
    const assigned = await this.prisma.userStudentAssignment.findMany({
      where: { institutionId: user.institutionId, studentId, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }], user: { status: 'ACTIVE' } },
      select: { userId: true },
    });
    const assignedIds = [...new Set([user.userId, ...assigned.map((item) => item.userId)])];
    const threads = await this.prisma.collaborationThread.findMany({
      where: { institutionId: user.institutionId, studentId },
      include: { members: true },
    });
    for (const thread of threads) {
      const existingMemberIds = new Set(thread.members.map((m) => m.userId));
      const missing = assignedIds.filter((id) => !existingMemberIds.has(id));
      if (missing.length > 0) {
        await this.prisma.threadMember.createMany({
          data: missing.map((userId) => ({ threadId: thread.id, userId })),
          skipDuplicates: true,
        });
      }
    }
    return this.prisma.collaborationThread.findMany({
      where: { institutionId: user.institutionId, studentId, members: { some: { userId: user.userId } } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, roles: { include: { role: true } } } } } },
        messages: { take: 100, orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, displayName: true, roles: { include: { role: true } } } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Post('students/:studentId/threads')
  async create(@Req() request: Request, @Param('studentId') studentId: string, @Body() body: CreateThreadDto) {
    const user = request.auth!;
    await this.access.requireStudent(user, studentId);
    const now = new Date();
    const assigned = await this.prisma.userStudentAssignment.findMany({
      where: { institutionId: user.institutionId, studentId, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gt: now } }], user: { status: 'ACTIVE' } },
      select: { userId: true },
    });
    const userIds = [...new Set([user.userId, ...assigned.map((item) => item.userId)])];
    return this.prisma.collaborationThread.create({
      data: { institutionId: user.institutionId, studentId, title: body.title, members: { create: userIds.map((userId) => ({ userId })) } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, roles: { include: { role: true } } } } } },
        messages: { include: { author: { select: { id: true, displayName: true, roles: { include: { role: true } } } } } },
      },
    });
  }

  @Patch('threads/:threadId/status')
  async updateStatus(@Req() request: Request, @Param('threadId') threadId: string, @Body() body: UpdateThreadStatusDto) {
    const user = request.auth!;
    await this.access.requireThreadMember(user, threadId);
    const thread = await this.prisma.collaborationThread.findFirst({ where: { id: threadId, institutionId: user.institutionId } });
    if (!thread) throw new NotFoundException('Тред не найден');
    return this.prisma.collaborationThread.update({ where: { id: threadId }, data: { status: body.status } });
  }

  @Get('threads/:threadId/messages')
  async messages(@Req() request: Request, @Param('threadId') threadId: string) {
    const user = request.auth!;
    await this.access.requireThreadMember(user, threadId);
    return this.prisma.message.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' }, take: 100, include: { author: { select: { id: true, displayName: true, roles: { include: { role: true } } } } } });
  }

  @Post('threads/:threadId/messages')
  async send(@Req() request: Request, @Param('threadId') threadId: string, @Body() body: CreateMessageDto) {
    const user = request.auth!;
    await this.access.requireThreadMember(user, threadId);
    const message = await this.prisma.message.create({ data: { threadId, authorId: user.userId, body: body.body }, include: { author: { select: { id: true, displayName: true, roles: { include: { role: true } } } } } });
    await this.prisma.collaborationThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
    return message;
  }
}
