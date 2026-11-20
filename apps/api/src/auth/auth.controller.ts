import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { LoginDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';
import { SessionGuard } from './session.guard.js';

function readToken(request: Request) {
  const name = process.env.SESSION_COOKIE_NAME ?? 'tenqadam_session';
  const part = request.headers.cookie?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : undefined;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Создать защищённую сессию пользователя' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(body.login, body.password);
    const ttlHours = Number(process.env.SESSION_TTL_HOURS ?? 12);
    response.cookie(process.env.SESSION_COOKIE_NAME ?? 'tenqadam_session', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: ttlHours * 60 * 60 * 1000 });
    return { user: result.user, expiresAt: result.expiresAt };
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(readToken(request));
    response.clearCookie(process.env.SESSION_COOKIE_NAME ?? 'tenqadam_session', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  current(@Req() request: Request) { return request.auth; }
}
