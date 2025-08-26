// src/user-profile/user-profile.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { User } from '@/user/entities/user.entity';
import { Role } from '../common/constants/roles.constant';
import {
  paginate,
  PaginateConfig,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { getRelations } from '@/common/utils/populate-query.utils';
import { unlink } from 'fs/promises';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async create(
    createUserProfileDto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    const userProfileExists = await this.userProfileRepository.findOne({
      where: { userId: createUserProfileDto.userId },
    });

    if (userProfileExists) {
      throw new ConflictException(`User's profile already exists`);
    }
    const userProfile = this.userProfileRepository.create(createUserProfileDto);
    return this.userProfileRepository.save(userProfile);
  }

  async findAll(
    query: PaginateQuery,
    populate?: string | string[],
  ): Promise<Paginated<UserProfile>> {
    const allowedUserRelations = ['user'];
    const relationsToPopulate = getRelations(populate, allowedUserRelations);

    const config: PaginateConfig<UserProfile> = {
      sortableColumns: ['fullName', 'bio', 'createdAt'],
      searchableColumns: ['fullName', 'bio'],
      defaultSortBy: [['createdAt', 'DESC']],
      relations: relationsToPopulate,
      filterableColumns: {
        fullName: true,
      },
    };

    return paginate(query, this.userProfileRepository, config);
  }

  async findByUser(id: string): Promise<UserProfile> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { userId: id },
      relations: ['user'],
    });

    if (!userProfile) {
      throw new NotFoundException(`User profile not found`);
    }

    return userProfile;
  }

  async findOne(id: string, currentUser: User): Promise<UserProfile> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!userProfile) {
      throw new NotFoundException(`User profile with ID ${id} not found`);
    }

    // Check permissions if currentUser is provided
    if (userProfile) {
      if (
        currentUser.role !== Role.ADMIN &&
        currentUser.id !== userProfile.userId
      ) {
        throw new ForbiddenException('You can only access your own profile');
      }
    }
    return userProfile;
  }

  async update(
    id: string,
    updateUserProfileDto: UpdateUserProfileDto,
    currentUser: User,
  ): Promise<UserProfile> {
    const userProfile = await this.findOne(id, currentUser);

    // Check if a new image is being uploaded and an old one exists
    if (updateUserProfileDto.image && userProfile.image) {
      try {
        await unlink(userProfile.image); // Delete the old image file
      } catch (error) {
        // Log the error but don't block the update process
        console.error(
          `Failed to delete old image: ${userProfile.image}`,
          error,
        );
      }
    }

    Object.assign(userProfile, updateUserProfileDto);
    return this.userProfileRepository.save(userProfile);
  }

  async remove(id: string): Promise<UserProfile> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { id },
    });

    if (!userProfile) {
      throw new NotFoundException(`User profile with ID ${id} not found`);
    }

    const deletedUserProfile =
      await this.userProfileRepository.remove(userProfile);
    return deletedUserProfile;
  }
}
