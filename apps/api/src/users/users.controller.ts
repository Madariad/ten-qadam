import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { SessionGuard } from '../auth/session.guard.js';
import { ChangeUserStatusDto, CreateUserDto } from './users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@UseGuards(SessionGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() list(@Req() request: Request) { return this.users.list(request.auth!); }
  @Post() create(@Req() request: Request, @Body() body: CreateUserDto) { return this.users.create(request.auth!, body); }
  @Patch(':id/status') status(@Req() request: Request, @Param('id') id: string, @Body() body: ChangeUserStatusDto) { return this.users.changeStatus(request.auth!, id, body); }
}
