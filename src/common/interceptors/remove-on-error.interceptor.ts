// src/upload/remove-on-error.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { promises as fs } from 'fs';

@Injectable()
export class RemoveUploadedFileOnErrorInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest();
    return next.handle().pipe(
      catchError(async (err) => {
        const paths = [
          req?.file?.path, // FileInterceptor
          ...(Array.isArray(req?.files)
            ? req.files.map((f: any) => f?.path)
            : []), // FilesInterceptor
          ...(req?.files
            ? Object.values(req.files)
                .flat()
                .map((f: any) => f?.path)
            : []), // FileFields
        ].filter(Boolean) as string[];

        await Promise.all(paths.map((p) => fs.unlink(p).catch(() => void 0)));
        throw err;
      }),
    );
  }
}
