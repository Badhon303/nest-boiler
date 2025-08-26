// src/files/files.controller.ts
import {
Controller, Post, UseInterceptors, UploadedFile, UploadedFiles,
Body, BadRequestException,
} from '@nestjs/common';
import { FileCategory } from '@/upload/file-category';
import { SingleUpload, MultiUpload, FieldUploads } from '@/upload/interceptors';
import { buildParsePipe } from '@/upload/validation-pipe';

@Controller('upload')
export class FilesController {
// Image (single)
@Post('image')
@UseInterceptors(SingleUpload('file', FileCategory.Image))
uploadImage(@UploadedFile(buildParsePipe(FileCategory.Image)) file: Express.Multer.File) {
return { ok: true, path: file.path };
}

// PDF (single)
@Post('pdf')
@UseInterceptors(SingleUpload('file', FileCategory.Pdf))
uploadPdf(@UploadedFile(buildParsePipe(FileCategory.Pdf)) file: Express.Multer.File) {
return { ok: true, path: file.path };
}

// Audio (multiple)
@Post('audios')
@UseInterceptors(MultiUpload('files', 5, FileCategory.Audio))
uploadAudios(@UploadedFiles() files: Express.Multer.File[]) {
if (!files?.length) throw new BadRequestException('No files uploaded');
return { ok: true, count: files.length, items: files.map(f => f.path) };
}

// Mixed fields: thumbnail (image) + doc (pdf)
// (Here both fields will share the same category rules. If you want per-field rules, create two endpoints or two field-specific interceptors.)
@Post('thumbnail-and-doc')
@UseInterceptors(FieldUploads([{ name: 'thumbnail', maxCount: 1 }, { name: 'doc', maxCount: 1 }], FileCategory.Image))
uploadThumbAndDoc(
@UploadedFiles()
files: { thumbnail?: Express.Multer.File[]; doc?: Express.Multer.File[] },
) {
// If you need per-field category, call two different endpoints or implement a more advanced per-field rule router.
return {
ok: true,
thumbnail: files.thumbnail?.[0]?.path,
doc: files.doc?.[0]?.path,
};
}
}
