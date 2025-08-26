// src/tasks/tasks.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  paginate,
  Paginated,
  PaginateQuery,
  PaginateConfig,
} from 'nestjs-paginate';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../user/entities/user.entity';
import { Role } from '../common/constants/roles.constant';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      ownerId: user.id,
    });

    return this.taskRepository.save(task);
  }

  async findAll(query: PaginateQuery, user: User): Promise<Paginated<Task>> {
    const config: PaginateConfig<Task> = {
      sortableColumns: ['title', 'createdAt', 'updatedAt'],
      searchableColumns: ['title', 'description'],
      defaultSortBy: [['createdAt', 'DESC']],
      // relations: ['owner', 'owner.profile'],
      filterableColumns: {
        title: true,
      },
    };

    const queryBuilder = this.taskRepository.createQueryBuilder('task');

    // If user is not admin, only show their tasks
    if (user.role !== Role.ADMIN) {
      queryBuilder.where('task.ownerId = :userId', { userId: user.id });
    }

    return paginate(query, queryBuilder, config);
  }

  async findOne(id: string, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      // relations: ['owner', 'owner.profile'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Check if user can access this task
    if (user.role !== Role.ADMIN && task.ownerId !== user.id) {
      throw new ForbiddenException('You can only access your own tasks');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: User,
  ): Promise<Task> {
    const task = await this.findOne(id, user);

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: string, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    const removedTask = await this.taskRepository.remove(task);
    return removedTask;
  }
}
