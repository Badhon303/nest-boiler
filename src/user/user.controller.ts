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
  ClassSerializerInterceptor,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { Role } from '../common/constants/roles.constant';
import { UserService } from '@/user/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Paginate } from 'nestjs-paginate';
import type { PaginateQuery, Paginated } from 'nestjs-paginate';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('populate') populate?: string | string[],
  ): Promise<Paginated<User>> {
    return this.usersService.findAll(query, populate);
  }

  @Get('me')
  getProfile(@GetUser() user: User): User {
    return user;
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<User> {
    return this.usersService.remove(id, user);
  }
}
