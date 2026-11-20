import { IsEnum, IsString, Length } from 'class-validator';
import { RoleCode, UserStatus } from '../generated/prisma/client.js';

export class CreateUserDto {
  @IsString() @Length(3, 100) login!: string;
  @IsString() @Length(12, 160) password!: string;
  @IsString() @Length(2, 160) displayName!: string;
  @IsEnum(RoleCode) role!: RoleCode;
}

export class ChangeUserStatusDto {
  @IsEnum(UserStatus) status!: UserStatus;
}
