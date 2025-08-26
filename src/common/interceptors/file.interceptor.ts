// src/upload/interceptors.ts
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { multerOptionsForCategory } from '@/config/multer.config';
import { FileCategory } from '../constants/files-type.constants';

// Single file
export const SingleUpload = (field: string, cat: FileCategory) =>
  FileInterceptor(field, multerOptionsForCategory(cat));

// Multiple files, single field
export const MultiUpload = (
  field: string,
  maxCount: number,
  cat: FileCategory,
) => FilesInterceptor(field, maxCount, multerOptionsForCategory(cat));

// Multiple fields (e.g., thumbnail + pdf)
export const FieldUploads = (
  fields: Array<{ name: string; maxCount?: number }>,
  cat: FileCategory,
) => FileFieldsInterceptor(fields, multerOptionsForCategory(cat));
