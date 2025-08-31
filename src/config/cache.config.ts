// src/common/config/cache.config.ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import { createKeyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';

export const cacheConfig = {
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    // multi-level cache: fast in-memory + Redis as distributed store
    stores: [
      new Keyv({
        store: new CacheableMemory({ ttl: 30_000, lruSize: 5000 }), // add this for redis
        // namespace: 'nestjs-cache',  // for in cache memory
      }),
      createKeyv(configService.get('REDIS_URL')), // e.g., redis://:pwd@host:6379/0 // add this for redis
    ],
    // default TTL for manual cache.set() (ms). Interceptor TTL is set separately.
    ttl: Number(configService.get('CACHE_TTL_MS') ?? 60_000),
  }),
};
