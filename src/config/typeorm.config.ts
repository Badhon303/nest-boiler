// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
// import { DataSourceOptions } from 'typeorm';

// export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
//   imports: [ConfigModule],
//   inject: [ConfigService],
//   useFactory: (configService: ConfigService): DataSourceOptions => ({
//     type: 'postgres',
//     host: configService.get('POSTGRES_HOST'),
//     port: +configService.get('POSTGRES_PORT'),
//     username: configService.get('POSTGRES_USER'),
//     password: configService.get('POSTGRES_PASSWORD'),
//     database: configService.get('POSTGRES_DATABASE'),
//     entities: ['dist/**/*.entity{.ts,.js}'],
//     synchronize: configService.get('NODE_ENV') !== 'production',
//     logging: configService.get('NODE_ENV') === 'development',
//     ssl:
//       configService.get('NODE_ENV') === 'production'
//         ? { rejectUnauthorized: false }
//         : false,
//   }),
// };

// orm.config.ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

const isProd = (env?: string) => env === 'production';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService): DataSourceOptions => {
    const nodeEnv = config.get<string>('NODE_ENV');
    const useUrl = !!config.get<string>('POSTGRES_URL'); // e.g., postgres://user:pass@host:port/db
    const host = config.get<string>('POSTGRES_HOST') || '127.0.0.1';
    const port = Number(config.get<string>('POSTGRES_PORT') ?? 5432);
    const username = config.get<string>('POSTGRES_USER');
    const password = config.get<string>('POSTGRES_PASSWORD');
    const database = config.get<string>('POSTGRES_DATABASE');

    // Use src in dev (ts-node), dist in prod (compiled)
    const entities = isProd(nodeEnv)
      ? ['dist/**/*.entity.js']
      : ['dist/**/*.entity.ts'];

    // SSL logic: enable in prod or when explicitly requested
    const sslRequired =
      isProd(nodeEnv) || config.get<boolean>('POSTGRES_SSL') === true;
    const ssl = sslRequired
      ? { rejectUnauthorized: false } // For RDS/Azure/CloudSQL defaults; replace with CA if needed
      : false;

    return {
      type: 'postgres',
      ...(useUrl
        ? { url: config.get<string>('POSTGRES_URL')! }
        : { host, port, username, password, database }),
      entities,
      synchronize: !isProd(nodeEnv),
      logging: nodeEnv === 'development',
      ssl,
      // Optional: tune connection
      extra: {
        max: Number(config.get('PG_POOL_MAX') ?? 10),
        connectionTimeoutMillis: Number(
          config.get('PG_CONNECT_TIMEOUT_MS') ?? 5000,
        ),
      },
    };
  },
};
