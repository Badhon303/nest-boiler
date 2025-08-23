// logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { method, originalUrl } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        const statusCode = res.statusCode;
        const message = `[HTTP] ${method} ${originalUrl} - Status: ${statusCode} - ${duration}ms`;

        if (statusCode >= 500) {
          this.logger.error(message, 'LoggingInterceptor');
        } else if (statusCode >= 400) {
          this.logger.warn(message, 'LoggingInterceptor');
        } else {
          this.logger.log(message, 'LoggingInterceptor');
        }
      }),
    );
  }
}
