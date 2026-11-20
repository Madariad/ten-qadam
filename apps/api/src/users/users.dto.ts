import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { RoleCode, UserStatus } from '../generated/prisma/client.js';

export class CreateUserDto {
  @IsString() @Length(3, 100) login!: string;
  @IsString() @Length(8, 160) password!: string;
  @IsString() @Length(2, 160) displayName!: string;
  @IsEnum(RoleCode) role!: RoleCode;
}

export class UpdateUserRoleDto {
  @IsEnum(RoleCode) role!: RoleCode;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @Length(2, 160) displayName?: string;
  @IsOptional() @IsString() @Length(8, 160) password?: string;
  @IsOptional() @IsEnum(RoleCode) role?: RoleCode;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}

export class ChangeUserStatusDto {
  @IsEnum(UserStatus) status!: UserStatus;
}
