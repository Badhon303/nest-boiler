// src/tasks/tasks.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { User } from '../user/entities/user.entity';
import { Paginate } from 'nestjs-paginate';
import type { PaginateQuery, Paginated } from 'nestjs-paginate';
import { FileType } from '@/common/constants/files-type.constant';
import { fileSizeParsePipe } from '@/common/pipes/file-size-validation.pipe';
import { ConfigService } from '@nestjs/config';
import { filePathToPublicUrl } from '@/common/utils/filePathToPublicUrl.utils';
import { SingleUpload } from '@/common/interceptors/file.interceptor';
import { RemoveUploadedFileOnErrorInterceptor } from '@/common/interceptors/remove-on-error.interceptor';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @UseInterceptors(
    SingleUpload('pdf', FileType.Pdf), // Multer fileFilter enforces image/*
  )
  create(
    @Body() body: { data: string },
    @GetUser() user: User,
    @UploadedFile(fileSizeParsePipe(FileType.Pdf)) file?: Express.Multer.File,
  ): Promise<Task> {
    const createTaskDto: CreateTaskDto = JSON.parse(body.data);
    if (file) {
      const baseUrl = this.config.get<string>('PUBLIC_BACKEND_URL')!;
      createTaskDto.doc = filePathToPublicUrl(file.path, baseUrl);
    }
    return this.tasksService.create(createTaskDto, user);
  }

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @GetUser() user: User,
  ): Promise<Paginated<Task>> {
    return this.tasksService.findAll(query, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  @UseInterceptors(
    SingleUpload('pdf', FileType.Pdf), // Multer fileFilter enforces image/*
    new RemoveUploadedFileOnErrorInterceptor(), // cleans up on later errors
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { data: string },
    @GetUser() user: User,
    @UploadedFile(fileSizeParsePipe(FileType.Pdf)) file?: Express.Multer.File,
  ): Promise<Task> {
    const updateTaskDto: UpdateTaskDto = JSON.parse(body.data);
    if (file) {
      const baseUrl = this.config.get<string>('PUBLIC_BACKEND_URL')!;
      updateTaskDto.doc = filePathToPublicUrl(file.path, baseUrl);
    }
    return this.tasksService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.remove(id, user);
  }
}
