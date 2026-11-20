import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLibraryItemDto } from './library.dto.js';

@ApiTags('library')
@UseGuards(SessionGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  @Get()
  list(@Req() request: Request, @Query('q') query?: string) {
    const user = request.auth!;
    const normalized = query?.trim().slice(0, 120);
    return this.prisma.libraryItem.findMany({
      where: {
        institutionId: user.institutionId,
        ...(user.roles.includes('ADMINISTRATOR') ? {} : { isPublished: true }),
        ...(normalized ? { OR: [{ titleKk: { contains: normalized } }, { titleRu: { contains: normalized } }, { summaryKk: { contains: normalized } }, { summaryRu: { contains: normalized } }] } : {}),
      },
      include: { files: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true } } },
      orderBy: [{ publishedAt: 'desc' }, { titleKk: 'asc' }],
      take: 100,
    });
  }

  @Post()
  async create(@Req() request: Request, @Body() body: CreateLibraryItemDto) {
    const user = request.auth!;
    this.access.requireAnyRole(user, ['ADMINISTRATOR', 'DEFECTOLOGIST']);
    return this.prisma.libraryItem.create({ data: { institutionId: user.institutionId, createdById: user.userId, kind: body.kind, category: body.category, titleKk: body.titleKk, titleRu: body.titleRu, summaryKk: body.summaryKk, summaryRu: body.summaryRu, isPublished: body.isPublished ?? false, publishedAt: body.isPublished ? new Date() : null } });
  }
}
