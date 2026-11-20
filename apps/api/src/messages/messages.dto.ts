import { IsEnum, IsString, Length } from 'class-validator';
import { ThreadStatus } from '../generated/prisma/client.js';

export class CreateMessageDto {
  @IsString() @Length(1, 4000) body!: string;
}

export class CreateThreadDto {
  @IsString() @Length(3, 180) title!: string;
}

export class UpdateThreadStatusDto {
  @IsEnum(ThreadStatus) status!: ThreadStatus;
}
