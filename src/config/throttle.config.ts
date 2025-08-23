import { ConfigModule, ConfigService } from '@nestjs/config';

export const throttleConfig = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => [
    {
      ttl: config.get<number>('THROTTLE_TTL', 60000),
      limit: config.get<number>('THROTTLE_LIMIT', 10),
    },
  ],
};
