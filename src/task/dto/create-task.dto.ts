// src/tasks/dto/create-task.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
