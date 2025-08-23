import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  paginate,
  Paginated,
  PaginateQuery,
  PaginateConfig,
} from 'nestjs-paginate';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/constants/roles.constant';
// import { UserProfileService } from '../user-profile/user-profile.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    // private userProfileService: UserProfileService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      email: createUserDto.email,
      username: createUserDto?.username,
      password: hashedPassword,
      role: createUserDto.role || Role.USER,
    });

    const savedUser = await this.userRepository.save(user);

    // // Create user profile
    // await this.userProfileService.create({
    //   userId: savedUser.id,
    //   fullName: createUserDto.fullName || createUserDto.username,
    //   bio: createUserDto.bio || '',
    // });

    return this.findOne(savedUser.id);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    const config: PaginateConfig<User> = {
      sortableColumns: ['email', 'role', 'createdAt'],
      searchableColumns: ['email', 'role'],
      defaultSortBy: [['createdAt', 'DESC']],
      // relations: ['profile'],
      filterableColumns: {
        role: true,
      },
    };

    return paginate(query, this.userRepository, config);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      // relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      // relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: User,
  ): Promise<User> {
    const user = await this.findOne(id);

    // Check if user can update this profile
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // 2. Restrict role changes to only admins
    if (updateUserDto.role && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'You are not authorized to change user roles',
      );
    }

    // Check if email is being updated and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // // Update profile if needed
    // if (updateUserDto.fullName || updateUserDto.bio) {
    //   await this.userProfileService.update(user.profile.id, {
    //     fullName: updateUserDto.fullName,
    //     bio: updateUserDto.bio,
    //   });
    // }

    return this.findOne(id);
  }

  async remove(id: string, currentUser: User): Promise<User> {
    const user = await this.findOne(id);

    // Check if user can delete this account
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }

    const deletedUser = await this.userRepository.remove(user);
    return deletedUser;
  }
}
