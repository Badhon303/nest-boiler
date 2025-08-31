// src/tasks/tasks.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
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
import { join } from 'path';
import { unlink } from 'fs/promises';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TasksService {
  // Cache TTL configurations
  private readonly CACHE_TTL = {
    SINGLE_TASK: 600 * 1000, // 10 minutes for individual tasks
    PAGINATED_RESULTS: 60 * 1000, // 1 minutes for paginated results (shorter due to complexity)
  };
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      ownerId: user.id,
    });

    // Invalidate lists
    await this.bumpListVersionForAdmin();
    await this.bumpListVersionForUser(user.id);

    return this.taskRepository.save(task);
  }

  async findAll(query: PaginateQuery, user: User): Promise<Paginated<Task>> {
    const cacheKey = await this.generatePaginatedCacheKey(query, user);
    const cached = await this.cacheManager.get<Paginated<Task>>(cacheKey);
    if (cached) return cached;

    const config: PaginateConfig<Task> = {
      sortableColumns: ['title', 'createdAt', 'updatedAt'],
      searchableColumns: ['title', 'description'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: { title: true },
    };

    const qb = this.taskRepository.createQueryBuilder('task');
    if (user.role !== Role.ADMIN) {
      qb.where('task.ownerId = :userId', { userId: user.id });
    }

    const result = await paginate(query, qb, config);

    await this.cacheManager.set(
      cacheKey,
      result,
      this.CACHE_TTL.PAGINATED_RESULTS,
    );
    return result;
  }

  async findOne(id: string, user: User): Promise<Task> {
    const userId = user.id;
    const taskId = id;
    const cacheKey = this.generateCacheKey('task', userId, taskId);

    const cachedTask = await this.cacheManager.get<Task>(cacheKey);
    if (cachedTask) return cachedTask;

    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);

    if (user.role !== Role.ADMIN && task.ownerId !== user.id) {
      throw new ForbiddenException('You can only access your own tasks');
    }

    await this.cacheManager.set(cacheKey, task, this.CACHE_TTL.SINGLE_TASK);
    await this.addSingleTaskKeyToIndex(task.id, cacheKey); // <-- track this key
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, user: User): Promise<Task> {
    const task = await this.findOne(id, user);

    if (dto.doc && task.doc) {
      try {
        const DOCUMENT_UPLOAD_DIR = join(
          process.cwd(),
          'public',
          'uploads',
          'docs',
        );
        const filename = task.doc.split('/').pop() || '';
        const localFilePath = join(DOCUMENT_UPLOAD_DIR, filename);
        await unlink(localFilePath);
      } catch (err) {
        console.error(`Failed to delete old document: ${task.doc}`, err);
      }
    }

    Object.assign(task, dto);
    const saved = await this.taskRepository.save(task);

    // Invalidate single-task caches for any viewers (owner/admins)
    await this.invalidateSingleTaskCaches(task.id);

    // Invalidate lists (admin + owner)
    await this.bumpListVersionForAdmin();
    await this.bumpListVersionForUser(task.ownerId);

    return saved;
  }

  async remove(id: string, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    const removed = await this.taskRepository.remove(task);

    // Invalidate single-task caches
    await this.invalidateSingleTaskCaches(task.id);

    // Invalidate lists (admin + owner)
    await this.bumpListVersionForAdmin();
    await this.bumpListVersionForUser(task.ownerId);

    return removed;
  }

  // ---- LIST VERSION HELPERS ----
  private ADMIN_LIST_VERSION_KEY = 'tasks:list:version:admin';
  private USER_LIST_VERSION_KEY = (userId: string) =>
    `tasks:list:version:user:${userId}`;

  private async getListVersionForAdmin(): Promise<number> {
    const v = await this.cacheManager.get<number>(this.ADMIN_LIST_VERSION_KEY);
    return typeof v === 'number' ? v : 1;
  }
  private async getListVersionForUser(userId: string): Promise<number> {
    const k = this.USER_LIST_VERSION_KEY(userId);
    const v = await this.cacheManager.get<number>(k);
    return typeof v === 'number' ? v : 1;
  }
  private async bumpListVersionForAdmin(): Promise<void> {
    const cur = await this.getListVersionForAdmin();
    await this.cacheManager.set(this.ADMIN_LIST_VERSION_KEY, cur + 1);
  }
  private async bumpListVersionForUser(userId: string): Promise<void> {
    const k = this.USER_LIST_VERSION_KEY(userId);
    const cur = await this.getListVersionForUser(userId);
    await this.cacheManager.set(k, cur + 1);
  }

  // ---- SINGLE TASK KEY INDEX HELPERS ----
  // We keep a small index of cached single-task keys per task ID.
  private singleIndexKey = (taskId: string) => `tasks:index:single:${taskId}`;

  private async addSingleTaskKeyToIndex(
    taskId: string,
    key: string,
  ): Promise<void> {
    const idxKey = this.singleIndexKey(taskId);
    const existing = await this.cacheManager.get<string[]>(idxKey);
    const set = new Set(existing ?? []);
    set.add(key);
    await this.cacheManager.set(idxKey, Array.from(set));
  }

  private async invalidateSingleTaskCaches(taskId: string): Promise<void> {
    const idxKey = this.singleIndexKey(taskId);
    const keys = await this.cacheManager.get<string[]>(idxKey);
    if (Array.isArray(keys)) {
      for (const k of keys) {
        await this.cacheManager.del(k);
      }
    }
    // clear the index itself
    await this.cacheManager.del(idxKey);
  }

  // ===== CACHE MANAGEMENT HELPER METHODS =====

  private async generatePaginatedCacheKey(
    query: PaginateQuery,
    user: User,
  ): Promise<string> {
    const baseParts = [
      'tasks_paginated',
      `user:${user.id}`,
      `role:${user.role}`,
      `page:${query.page || 1}`,
      `limit:${query.limit || 20}`,
    ];

    if (query.search) baseParts.push(`search:${query.search}`);

    if (query.filter) {
      const filterKeys = Object.keys(query.filter).sort();
      for (const key of filterKeys) {
        baseParts.push(`filter:${key}:${query.filter[key]}`);
      }
    }

    if (query.sortBy?.length) {
      const sortString = query.sortBy.map(([f, d]) => `${f}:${d}`).join(',');
      baseParts.push(`sort:${sortString}`);
    }

    // --- add version token so we don't need wildcard deletes ---
    const version =
      user.role === Role.ADMIN
        ? await this.getListVersionForAdmin()
        : await this.getListVersionForUser(user.id);

    baseParts.push(`v:${version}`);

    return baseParts.join(':');
  }

  private generateCacheKey(
    type: string,
    userId: string,
    taskId: string,
  ): string {
    return `tasks:${type}:user:${userId}:task:${taskId}`;
  }
}
