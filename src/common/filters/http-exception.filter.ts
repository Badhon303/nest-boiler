import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log with context and path
    this.logger.error(
      `[HTTP] ${request.method} ${request.url} - Status: ${httpStatus} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      'HttpExceptionFilter',
    );

    const responseBody = {
      success: false,
      error:
        exception instanceof HttpException
          ? exception.getResponse()
          : { message: 'Internal Server Error', statusCode: httpStatus },
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
