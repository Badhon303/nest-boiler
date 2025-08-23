// winston.config.ts
import { utilities, WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      level: 'silly',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        utilities.format.nestLike('to-do', {
          colors: true,
          prettyPrint: true,
          processId: true,
          appName: true,
        }),
      ),
    }),
    // other transports...
    new winston.transports.File({ filename: 'logs/app.log', level: 'warn' }),
  ],
};
