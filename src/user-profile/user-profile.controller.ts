// src/users - profile / user - profile.controller.ts;
import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Body,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Post,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UserProfileService } from './user-profile.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfile } from './entities/user-profile.entity';
import { User } from '@/user/entities/user.entity';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/common/constants/roles.constant';
import { Paginate } from 'nestjs-paginate';
import type { PaginateQuery, Paginated } from 'nestjs-paginate';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { ConfigService } from '@nestjs/config';
import { filePathToPublicUrl } from '@/common/utils/filePathToPublicUrl.utils';
import { SingleUpload } from '@/common/interceptors/file.interceptor';
import { FileCategory } from '@/common/constants/files-type.constants';
import { buildParsePipe } from '@/common/pipes/file-validation.pipe';
import { RemoveUploadedFileOnErrorInterceptor } from '@/common/interceptors/remove-on-error.interceptor';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('user-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserProfileController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  create(
    @Body() createUserProfileDto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    return this.userProfileService.create(createUserProfileDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('populate') populate?: string | string[],
  ): Promise<Paginated<UserProfile>> {
    return this.userProfileService.findAll(query, populate);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<UserProfile> {
    return this.userProfileService.findOne(id, user);
  }

  @Patch(':id')
  @UseInterceptors(
    SingleUpload('image', FileCategory.Image), // Multer fileFilter enforces image/*
    new RemoveUploadedFileOnErrorInterceptor(), // cleans up on later errors
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { data: string },
    @GetUser() user: User,
    @UploadedFile(buildParsePipe(FileCategory.Image)) // size only
    file?: Express.Multer.File,
  ): Promise<UserProfile> {
    const updateUserProfileDto: UpdateUserProfileDto = JSON.parse(body.data);
    if (file) {
      const baseUrl = this.config.get<string>('PUBLIC_BACKEND_URL')!;
      updateUserProfileDto.image = filePathToPublicUrl(file.path, baseUrl);
    }
    return this.userProfileService.update(id, updateUserProfileDto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<UserProfile> {
    return this.userProfileService.remove(id);
  }
}
