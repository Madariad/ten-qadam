import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString() @Length(2, 100) login!: string;
  @IsString() @Length(8, 160) password!: string;
}
