// src/common/interceptors/file.interceptor.ts
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { multerOptionsForCategory } from '@/config/multer.config';
import { FileType } from '../constants/files-type.constant';

// Single file
export const SingleUpload = (field: string, cat: FileType) =>
  FileInterceptor(field, multerOptionsForCategory(cat));

// Multiple files, single field
export const MultiUpload = (field: string, maxCount: number, cat: FileType) =>
  FilesInterceptor(field, maxCount, multerOptionsForCategory(cat));

// Multiple fields (e.g., thumbnail + pdf)
export const FieldUploads = (
  fields: Array<{ name: string; maxCount?: number }>,
  cat: FileType,
) => FileFieldsInterceptor(fields, multerOptionsForCategory(cat));
