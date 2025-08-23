import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { Role } from '../../common/constants/roles.constant';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
