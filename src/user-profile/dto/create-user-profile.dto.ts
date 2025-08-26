// src/user-profile/dto/create-user-profile.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateUserProfileDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  image?: string;
}
