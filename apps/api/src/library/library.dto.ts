import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { LibraryKind } from '../generated/prisma/client.js';

export class CreateLibraryItemDto {
  @IsEnum(LibraryKind) kind!: LibraryKind;
  @IsString() @Length(2, 100) category!: string;
  @IsString() @Length(2, 240) titleKk!: string;
  @IsString() @Length(2, 240) titleRu!: string;
  @IsOptional() @IsString() @Length(0, 4000) summaryKk?: string;
  @IsOptional() @IsString() @Length(0, 4000) summaryRu?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class UpdateLibraryItemDto {
  @IsOptional() @IsString() @Length(2, 100) category?: string;
  @IsOptional() @IsString() @Length(2, 240) titleKk?: string;
  @IsOptional() @IsString() @Length(2, 240) titleRu?: string;
  @IsOptional() @IsString() @Length(0, 4000) summaryKk?: string;
  @IsOptional() @IsString() @Length(0, 4000) summaryRu?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
