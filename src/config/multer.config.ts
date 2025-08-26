// src/upload/multer-factory.ts
import { diskStorage, FileFilterCallback, MulterError } from 'multer';
import { extname } from 'path';
import { Options as MulterOptions } from 'multer';
import { FileCategory } from '@/common/constants/files-type.constants';
import { CATEGORY_RULES } from '@/common/utils/upload.rules';
import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common';

export function multerOptionsForCategory(
  category: FileCategory,
): MulterOptions {
  const rule = CATEGORY_RULES[category];

  if (!fs.existsSync(rule.dest)) {
    fs.mkdirSync(rule.dest, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: rule.dest,
      filename: (req, file, cb) => {
        const id =
          Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        cb(null, `${id}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: rule.maxSizeBytes },
    fileFilter: (req, file, cb: FileFilterCallback) => {
      if (rule.mimeAllow.test(file.mimetype)) return cb(null, true);
      return cb(new BadRequestException(`Only ${category} files are allowed.`));
    },
  };
}
