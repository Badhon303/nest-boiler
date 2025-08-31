// decorators/cacheable.decorator.ts
import { Cache } from 'cache-manager';

export function Cacheable(prefix: string, ttl: number = 300) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheManager: Cache = this.cacheManager;
      const cacheKey = `${prefix}:${args.join(':')}`;

      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      const result = await method.apply(this, args);
      await cacheManager.set(cacheKey, result, ttl);

      return result;
    };
  };
}
