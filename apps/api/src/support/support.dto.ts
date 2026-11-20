import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { AssessmentKind, WorkflowStatus } from '../generated/prisma/client.js';

export class CreateObservationDto {
  @IsOptional() @IsString() goalId?: string;
  @IsOptional() @IsString() subjectId?: string;
  @IsDateString() observedAt!: string;
  @IsOptional() @IsString() @Length(0, 180) context?: string;
  @IsString() @Length(3, 5000) observationText!: string;
}

export class CreateRecommendationDto {
  @IsOptional() @IsString() goalId?: string;
  @IsString() @Length(3, 200) title!: string;
  @IsString() @Length(3, 5000) content!: string;
}

export class ApplyRecommendationDto {
  @IsDateString() appliedAt!: string;
  @IsOptional() @IsString() @Length(0, 300) outcome?: string;
  @IsOptional() @IsString() @Length(0, 3000) reflection?: string;
}

export class AssessmentResultDto {
  @IsString() @Length(2, 120) criterion!: string;
  @IsNumber() @Min(0) @Max(1000) score!: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1000) scaleMin?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1000) scaleMax?: number;
  @IsOptional() @IsString() @Length(0, 2000) evidence?: string;
}

export class CreateAssessmentDto {
  @IsString() goalId!: string;
  @IsEnum(AssessmentKind) kind!: AssessmentKind;
  @IsDateString() assessedAt!: string;
  @IsOptional() @IsString() @Length(0, 3000) note?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => AssessmentResultDto) results!: AssessmentResultDto[];
}

export class CreatePlanDto {
  @IsString() @Length(3, 200) title!: string;
  @IsDateString() periodStart!: string;
  @IsOptional() @IsDateString() periodEnd?: string;
}

export class CreatePlanActionDto {
  @IsOptional() @IsString() goalId?: string;
  @IsString() responsibleId!: string;
  @IsString() @Length(3, 200) titleKk!: string;
  @IsString() @Length(3, 200) titleRu!: string;
  @IsOptional() @IsString() @Length(0, 3000) description?: string;
  @IsOptional() @IsDateString() dueAt?: string;
}

export class UpdatePlanActionDto {
  @IsEnum(WorkflowStatus) status!: WorkflowStatus;
  @IsOptional() @IsString() @Length(0, 3000) result?: string;
}

export class PrivateNoteDto {
  @IsString() @Length(3, 180) title!: string;
  @IsString() @Length(3, 3000) content!: string;
}

export class GrantPrivateNoteAccessDto {
  @IsString() @Length(36, 36) userId!: string;
}
