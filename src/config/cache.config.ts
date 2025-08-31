// erc/common/config/cache.config.ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';

// Create a keyv store factory function
const createKeyvStore = () => {
  const keyv = new Keyv({
    // Using in-memory storage by default
    // This can be easily switched to Redis, MongoDB, etc.
    namespace: 'nestjs-cache',
  });

  return {
    // Implement the cache-manager store interface
    get: async (key: string) => await keyv.get(key),
    set: async (key: string, value: any, ttl?: number) => {
      await keyv.set(key, value, ttl ? ttl * 1000 : undefined);
    },
    del: async (key: string) => await keyv.delete(key),
    reset: async () => await keyv.clear(),
    keys: async (pattern?: string) => {
      // keyv doesn't support pattern matching natively
      // For production, consider using Redis with pattern support
      return [];
    },
  };
};

export const cacheConfig = {
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    store: createKeyvStore,
    ttl: configService.get('CACHE_TTL', 300),
    max: configService.get('CACHE_MAX', 100),
  }),
};

// Redis Setup
// import KeyvRedis from '@keyv/redis';
// const createKeyvRedisStore = (configService: ConfigService) => {
//   const keyv = new Keyv({
//     store: new KeyvRedis({
//       host: configService.get('REDIS_HOST', 'localhost'),
//       port: configService.get('REDIS_PORT', 6379),
//       password: configService.get('REDIS_PASSWORD'),
//       db: configService.get('REDIS_DB', 0),
//     }),
//     namespace: 'nestjs-cache',
//   });

//   return {
//     get: async (key: string) => await keyv.get(key),
//     set: async (key: string, value: any, ttl?: number) => {
//       await keyv.set(key, value, ttl ? ttl * 1000 : undefined);
//     },
//     del: async (key: string) => await keyv.delete(key),
//     reset: async () => await keyv.clear(),
//     keys: async (pattern?: string) => {
//       // Redis supports pattern matching
//       const redis = keyv.store;
//       return redis.keys(pattern || '*');
//     },
//   };
// };
