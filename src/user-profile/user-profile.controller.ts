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

@UseInterceptors(ClassSerializerInterceptor)
@Controller('user-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

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
  @Roles(Role.ADMIN)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<UserProfile> {
    return this.userProfileService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @GetUser() user: User,
  ): Promise<UserProfile> {
    return this.userProfileService.update(id, updateUserProfileDto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<UserProfile> {
    return this.userProfileService.remove(id);
  }
}
