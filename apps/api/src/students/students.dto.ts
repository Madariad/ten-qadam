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

export class CreateSupportProfileDto {
  @IsString() @Length(2, 60) category!: string;
  @IsString() @Length(3, 4000) description!: string;
  @IsOptional() @IsDateString() reviewAt?: string;
}

export class CreateLearningGoalDto {
  @IsString() @Length(36, 36) subjectId!: string;
  @IsString() @Length(3, 240) titleKk!: string;
  @IsString() @Length(3, 240) titleRu!: string;
  @IsString() @Length(3, 4000) successCriteria!: string;
  @IsOptional() @IsDateString() targetDate?: string;
}
