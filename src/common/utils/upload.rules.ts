// src/upload/upload.rules.ts
import { FileCategory } from '../constants/files-type.constants';

export type CategoryRule = {
  dest: string; // disk destination
  maxSizeBytes: number; // size limit
  mimeAllow: RegExp; // MIME allow-list
};

export const CATEGORY_RULES: Record<FileCategory, CategoryRule> = {
  [FileCategory.Image]: {
    dest: './public/uploads/images',
    maxSizeBytes: Number(process.env.IMG_MAX || 2 * 1024 * 1024),
    mimeAllow: /^image\/(jpeg|png|gif|webp|bmp|svg\+xml|tiff|heif|heic|avif)$/i,
  },
  [FileCategory.Pdf]: {
    dest: './public/uploads/docs',
    maxSizeBytes: Number(process.env.PDF_MAX || 10 * 1024 * 1024),
    mimeAllow: /^application\/pdf$/i,
  },
  [FileCategory.Audio]: {
    dest: './public/uploads/audios',
    maxSizeBytes: Number(process.env.AUDIO_MAX || 20 * 1024 * 1024),
    mimeAllow: /^audio\/(mpeg|mp4|aac|wav|x-wav|webm|ogg)$/i,
  },
  [FileCategory.Video]: {
    dest: './public/uploads/videos',
    maxSizeBytes: Number(process.env.VIDEO_MAX || 100 * 1024 * 1024),
    mimeAllow: /^video\/(mp4|quicktime|webm|ogg|x-msvideo|x-matroska)$/i,
  },
};
