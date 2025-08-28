// src/config/mail.config.ts
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { join } from 'path';

export const mailConfig = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    transport: {
      host: configService.get('SMTP_HOST'),
      port: +configService.get('SMTP_PORT'),
      secure: false,
      requireTLS: true,
      auth: {
        user: configService.get('EMAIL_USERNAME'),
        pass: configService.get('EMAIL_PASSWORD'),
      },
      tls: {
        // keep during dev; remove in prod
        rejectUnauthorized: false,
      },
    },
    defaults: {
      from: configService.get('SMTP_FROM'),
    },
    template: {
      dir: join(__dirname, '..', 'mail', 'templates'),
      adapter: new PugAdapter(),
      options: {
        strict: true,
      },
    },
  }),
};
