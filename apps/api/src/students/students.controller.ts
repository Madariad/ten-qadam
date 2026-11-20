import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard.js';
import { CreateAssignmentDto, CreateStudentDto } from './students.dto.js';
import { StudentsService } from './students.service.js';

@ApiTags('students')
@UseGuards(SessionGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}
  @Get('groups') groups(@Req() request: Request) { return this.students.groups(request.auth!); }
  @Get() list(@Req() request: Request, @Query('search') search?: string) { return this.students.findAll(request.auth!, search?.slice(0, 100)); }
  @Get(':studentId') one(@Req() request: Request, @Param('studentId') id: string) { return this.students.findOne(request.auth!, id); }
  @Post() create(@Req() request: Request, @Body() body: CreateStudentDto) { return this.students.create(request.auth!, body); }
  @Get(':studentId/assignments') assignments(@Req() request: Request, @Param('studentId') id: string) { return this.students.assignments(request.auth!, id); }
  @Post(':studentId/assignments') assign(@Req() request: Request, @Param('studentId') id: string, @Body() body: CreateAssignmentDto) { return this.students.assign(request.auth!, id, body); }
  @Delete(':studentId/assignments/:assignmentId') revoke(@Req() request: Request, @Param('studentId') studentId: string, @Param('assignmentId') assignmentId: string) { return this.students.revokeAssignment(request.auth!, studentId, assignmentId); }
}
