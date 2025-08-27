// src/common/pipes/file-size-validation.pipe.ts
// size only
import { ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { FileType } from '../constants/files-type.constant';
import { CATEGORY_RULES } from '../constants/upload.constant';

export function fileSizeParsePipe(category: FileType, required = false) {
  const rule = CATEGORY_RULES[category];
  return new ParseFilePipe({
    fileIsRequired: required,
    validators: [
      new MaxFileSizeValidator({
        maxSize: rule.maxSizeBytes,
        message: `Max upload size is ${(rule.maxSizeBytes / (1024 * 1024)).toFixed(1)}MB`,
      }),
    ],
  });
}
