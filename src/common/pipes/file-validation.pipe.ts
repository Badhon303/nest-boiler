// buildParsePipe.ts — size only (or remove this entirely)
import { ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { FileCategory } from '../constants/files-type.constants';
import { CATEGORY_RULES } from '../utils/upload.rules';

export function buildParsePipe(category: FileCategory, required = true) {
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
