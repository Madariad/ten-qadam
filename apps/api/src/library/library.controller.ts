import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { SessionGuard } from '../auth/session.guard.js';
import { AccessService } from '../common/access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLibraryItemDto, UpdateLibraryItemDto } from './library.dto.js';

type UploadedMemoryFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const STORAGE_DIR = resolve(process.cwd(), 'storage', 'library');

function ensureStorageDir() {
  if (!existsSync(STORAGE_DIR)) {
    mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function serializeFile(file: {
  id: string;
  itemId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: bigint;
  checksum: string | null;
  createdAt: Date;
}) {
  return {
    id: file.id,
    itemId: file.itemId,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: Number(file.sizeBytes),
    checksum: file.checksum,
    createdAt: file.createdAt,
  };
}

@ApiTags('library')
@UseGuards(SessionGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {
    ensureStorageDir();
    void this.ensureDatabaseBlobColumn();
  }

  private async ensureDatabaseBlobColumn() {
    try {
      await this.prisma.$executeRawUnsafe(
        'ALTER TABLE `library_files` ADD COLUMN `content_blob` LONGBLOB NULL',
      );
    } catch {
      /* Column already exists */
    }
  }

  @Get()
  async list(@Req() request: Request, @Query('q') query?: string, @Query('kind') kind?: string) {
    const user = request.auth!;
    const normalized = query?.trim().slice(0, 120);
    const items = await this.prisma.libraryItem.findMany({
      where: {
        institutionId: user.institutionId,
        ...(user.roles.includes('ADMINISTRATOR') || user.roles.includes('DEFECTOLOGIST') ? {} : { isPublished: true }),
        ...(kind && ['NORMATIVE', 'TEACHER_GUIDE', 'METHODICAL'].includes(kind) ? { kind: kind as 'NORMATIVE' | 'TEACHER_GUIDE' | 'METHODICAL' } : {}),
        ...(normalized ? { OR: [{ titleKk: { contains: normalized } }, { titleRu: { contains: normalized } }, { summaryKk: { contains: normalized } }, { summaryRu: { contains: normalized } }, { category: { contains: normalized } }] } : {}),
      },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        files: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
    return items.map((item) => ({
      ...item,
      files: item.files.map(serializeFile),
    }));
  }

  @Post()
  async create(@Req() request: Request, @Body() body: CreateLibraryItemDto) {
    const user = request.auth!;
    this.access.requireAnyRole(user, ['ADMINISTRATOR', 'DEFECTOLOGIST', 'SUBJECT_TEACHER', 'PSYCHOLOGIST', 'SOCIAL_PEDAGOG']);
    if (body.kind === 'NORMATIVE') {
      this.access.requireAnyRole(user, ['ADMINISTRATOR', 'DEFECTOLOGIST']);
    }
    const isPublished = body.isPublished ?? true;
    const item = await this.prisma.libraryItem.create({
      data: {
        institutionId: user.institutionId,
        createdById: user.userId,
        kind: body.kind,
        category: body.category,
        titleKk: body.titleKk,
        titleRu: body.titleRu,
        summaryKk: body.summaryKk,
        summaryRu: body.summaryRu,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        files: true,
      },
    });
    return { ...item, files: item.files.map(serializeFile) };
  }

  @Patch(':itemId')
  async update(@Req() request: Request, @Param('itemId') itemId: string, @Body() body: UpdateLibraryItemDto) {
    const user = request.auth!;
    const existing = await this.prisma.libraryItem.findFirst({ where: { id: itemId, institutionId: user.institutionId } });
    if (!existing) throw new NotFoundException('Документ не найден');
    if (existing.createdById !== user.userId) {
      this.access.requireAnyRole(user, ['ADMINISTRATOR', 'DEFECTOLOGIST']);
    }
    const updated = await this.prisma.libraryItem.update({
      where: { id: itemId },
      data: {
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.titleKk !== undefined ? { titleKk: body.titleKk } : {}),
        ...(body.titleRu !== undefined ? { titleRu: body.titleRu } : {}),
        ...(body.summaryKk !== undefined ? { summaryKk: body.summaryKk } : {}),
        ...(body.summaryRu !== undefined ? { summaryRu: body.summaryRu } : {}),
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished, publishedAt: body.isPublished ? (existing.publishedAt ?? new Date()) : null } : {}),
      },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        files: true,
      },
    });
    return { ...updated, files: updated.files.map(serializeFile) };
  }

  @Delete(':itemId')
  async removeItem(@Req() request: Request, @Param('itemId') itemId: string) {
    const user = request.auth!;
    const existing = await this.prisma.libraryItem.findFirst({
      where: { id: itemId, institutionId: user.institutionId },
      include: { files: true },
    });
    if (!existing) throw new NotFoundException('Документ не найден');
    if (existing.createdById !== user.userId) {
      this.access.requireAnyRole(user, ['ADMINISTRATOR', 'DEFECTOLOGIST']);
    }
    for (const file of existing.files) {
      const fullPath = join(STORAGE_DIR, file.objectKey);
      if (existsSync(fullPath)) {
        try { unlinkSync(fullPath); } catch { /* ignore */ }
      }
    }
    await this.prisma.libraryItem.delete({ where: { id: itemId } });
    return { ok: true };
  }

  @Post(':itemId/files')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  async uploadFile(
    @Req() request: Request,
    @Param('itemId') itemId: string,
    @UploadedFile() file?: UploadedMemoryFile,
  ) {
    const user = request.auth!;
    if (!file || !file.buffer) throw new BadRequestException('Файл не передан');
    const item = await this.prisma.libraryItem.findFirst({ where: { id: itemId, institutionId: user.institutionId } });
    if (!item) throw new NotFoundException('Материал библиотеки не найден');
    if (item.kind === 'NORMATIVE') {
      this.access.requireAnyRole(user, ['ADMINISTRATOR', 'DEFECTOLOGIST']);
    }

    ensureStorageDir();
    // Fix UTF-8 filename encoding from busboy/multer if latin1 mangled
    let originalName = file.originalname;
    try {
      const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
      if (!decoded.includes('\uFFFD')) originalName = decoded;
    } catch {
      /* keep as is */
    }

    const safeExt = extname(originalName).slice(0, 16) || '.bin';
    const objectKey = `${itemId}-${randomUUID()}${safeExt}`;
    const targetPath = join(STORAGE_DIR, objectKey);
    writeFileSync(targetPath, file.buffer);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const saved = await this.prisma.libraryFile.create({
      data: {
        itemId: item.id,
        uploadedById: user.userId,
        objectKey,
        originalName: originalName.slice(0, 250),
        mimeType: (file.mimetype || 'application/octet-stream').slice(0, 120),
        sizeBytes: BigInt(file.size),
        checksum,
      },
    });
    try {
      await this.prisma.$executeRawUnsafe(
        'UPDATE `library_files` SET `content_blob` = ? WHERE `id` = ?',
        file.buffer,
        saved.id,
      );
    } catch {
      /* ignore if column not ready */
    }
    return serializeFile(saved);
  }

  @Get('files/:fileId')
  async serveFile(
    @Req() request: Request,
    @Param('fileId') fileId: string,
    @Query('download') download: string | undefined,
    @Res() response: Response,
  ) {
    const user = request.auth!;
    const file = await this.prisma.libraryFile.findFirst({
      where: { id: fileId, item: { institutionId: user.institutionId } },
      include: { item: true },
    });
    if (!file) throw new NotFoundException('Файл не найден');
    ensureStorageDir();
    const targetPath = join(STORAGE_DIR, file.objectKey);
    if (!existsSync(targetPath)) {
      try {
        const rows = await this.prisma.$queryRawUnsafe<{ content_blob: Buffer | Uint8Array | null }[]>(
          'SELECT `content_blob` FROM `library_files` WHERE `id` = ? LIMIT 1',
          file.id,
        );
        const blob = rows?.[0]?.content_blob;
        if (blob) {
          writeFileSync(targetPath, Buffer.from(blob));
        }
      } catch {
        /* ignore */
      }
    }
    if (!existsSync(targetPath)) {
      throw new NotFoundException('Физический файл отсутствует на сервере');
    }

    const disposition = download === '1' || download === 'true' ? 'attachment' : 'inline';
    const encodedName = encodeURIComponent(file.originalName);
    response.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    response.setHeader('Content-Length', String(file.sizeBytes));
    response.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodedName}`);
    const stream = createReadStream(targetPath);
    stream.pipe(response);
  }

  @Delete('files/:fileId')
  async deleteFile(@Req() request: Request, @Param('fileId') fileId: string) {
    const user = request.auth!;
    const file = await this.prisma.libraryFile.findFirst({
      where: { id: fileId, item: { institutionId: user.institutionId } },
      include: { item: true },
    });
    if (!file) throw new NotFoundException('Файл не найден');
    if (file.uploadedById !== user.userId && file.item.createdById !== user.userId) {
      this.access.requireAnyRole(user, ['ADMINISTRATOR', 'DEFECTOLOGIST']);
    }
    const targetPath = join(STORAGE_DIR, file.objectKey);
    if (existsSync(targetPath)) {
      try { unlinkSync(targetPath); } catch { /* ignore */ }
    }
    await this.prisma.libraryFile.delete({ where: { id: fileId } });
    return { ok: true };
  }
}
