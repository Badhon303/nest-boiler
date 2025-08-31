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
    console.log(`Cache: Invalidated list versions after creating new task.`);

    return this.taskRepository.save(task);
  }

  async findAll(query: PaginateQuery, user: User): Promise<Paginated<Task>> {
    const cacheKey = await this.generatePaginatedCacheKey(query, user);
    const cached = await this.cacheManager.get<Paginated<Task>>(cacheKey);
    if (cached) {
      console.log(
        `Cache: Serving paginated results for key "${cacheKey}" from cache. ✅`,
      );
      return cached;
    }

    console.log(
      `Cache: Cache miss for paginated results. Fetching from database. ⏳`,
    );
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
    console.log(
      `Cache: Stored new paginated results for key "${cacheKey}". 💾`,
    );
    return result;
  }

  async findOne(id: string, user: User): Promise<Task> {
    const userId = user.id;
    const taskId = id;
    const cacheKey = this.generateCacheKey('task', userId, taskId);

    const cachedTask = await this.cacheManager.get<Task>(cacheKey);
    if (cachedTask) {
      console.log(
        `Cache: Serving task ID "${id}" for user "${userId}" from cache. ✅`,
      );
      return cachedTask;
    }

    console.log(
      `Cache: Cache miss for task ID "${id}". Fetching from database. ⏳`,
    );
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);

    if (user.role !== Role.ADMIN && task.ownerId !== user.id) {
      throw new ForbiddenException('You can only access your own tasks');
    }

    await this.cacheManager.set(cacheKey, task, this.CACHE_TTL.SINGLE_TASK);
    await this.addSingleTaskKeyToIndex(task.id, cacheKey);
    console.log(
      `Cache: Stored new task ID "${id}" in cache for user "${userId}". 💾`,
    );
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
        console.log(`Document: Deleted old document at "${localFilePath}".`);
      } catch (err) {
        console.error(`Failed to delete old document: ${task.doc}`, err);
      }
    }

    Object.assign(task, dto);
    const saved = await this.taskRepository.save(task);

    // Invalidate single-task caches for any viewers (owner/admins)
    await this.invalidateSingleTaskCaches(task.id);
    console.log(
      `Cache: Invalidated single-task caches for task ID "${task.id}". 🧹`,
    );

    // Invalidate lists (admin + owner)
    await this.bumpListVersionForAdmin();
    await this.bumpListVersionForUser(task.ownerId);
    console.log(`Cache: Invalidated list versions after updating task.`);

    return saved;
  }

  async remove(id: string, user: User): Promise<Task> {
    const task = await this.findOne(id, user);
    const removed = await this.taskRepository.remove(task);

    // Invalidate single-task caches
    await this.invalidateSingleTaskCaches(task.id);
    console.log(
      `Cache: Invalidated single-task caches for task ID "${task.id}" after deletion. 🧹`,
    );

    // Invalidate lists (admin + owner)
    await this.bumpListVersionForAdmin();
    await this.bumpListVersionForUser(task.ownerId);
    console.log(`Cache: Invalidated list versions after removing task.`);

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
    console.log(`Cache: Admin list version bumped to ${cur + 1}.`);
  }
  private async bumpListVersionForUser(userId: string): Promise<void> {
    const k = this.USER_LIST_VERSION_KEY(userId);
    const cur = await this.getListVersionForUser(userId);
    await this.cacheManager.set(k, cur + 1);
    console.log(
      `Cache: User list version for "${userId}" bumped to ${cur + 1}.`,
    );
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
    console.log(`Cache: Added key "${key}" to index for task ID "${taskId}".`);
  }

  private async invalidateSingleTaskCaches(taskId: string): Promise<void> {
    const idxKey = this.singleIndexKey(taskId);
    const keys = await this.cacheManager.get<string[]>(idxKey);
    if (Array.isArray(keys)) {
      console.log(
        `Cache: Found ${keys.length} keys to invalidate for task ID "${taskId}".`,
      );
      for (const k of keys) {
        await this.cacheManager.del(k);
        console.log(`Cache: Deleted key "${k}".`);
      }
    }
    // clear the index itself
    await this.cacheManager.del(idxKey);
    console.log(`Cache: Cleared index for task ID "${taskId}".`);
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
