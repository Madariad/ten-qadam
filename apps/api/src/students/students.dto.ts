import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateStudentDto {
  @IsString() @Length(2, 60) studentCode!: string;
  @IsString() @Length(2, 160) fullName!: string;
  @IsString() @Length(36, 36) groupId!: string;
}

export class CreateAssignmentDto {
  @IsString() @Length(36, 36) userId!: string;
  @IsOptional() @IsString() @Length(36, 36) subjectId?: string;
  @IsOptional() @IsDateString() validUntil?: string;
}
