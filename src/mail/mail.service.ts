// src/mail/mail.service.ts
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendEmail(params: {
    to: string;
    subject: string;
    template: string;
    context: ISendMailOptions['context'];
  }) {
    try {
      const emailsList = params.to
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!emailsList?.length) {
        throw new Error('No recipients provided');
      }
      const sendMailParams = {
        to: emailsList,
        // from: this.config.get<string>('SMTP_FROM'),
        subject: params.subject,
        template: params.template,
        context: params.context,
      };
      const response = await this.mailerService.sendMail(sendMailParams);
      this.logger.log(
        `Email sent successfully to recipients with the following parameters : ${JSON.stringify(
          sendMailParams,
        )}`,
        response,
      );
    } catch (error) {
      this.logger.error(
        `Error while sending mail with the following parameters : ${JSON.stringify(
          params,
        )}`,
        error,
      );
    }
  }
}
