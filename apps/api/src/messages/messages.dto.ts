import { IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @IsString() @Length(1, 4000) body!: string;
}

export class CreateThreadDto {
  @IsString() @Length(3, 180) title!: string;
}
