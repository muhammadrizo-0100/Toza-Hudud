import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

const UPLOAD_DIR = './uploads';

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const multerPhotoOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `photo-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestException('Faqat rasm fayllari (JPG, PNG, WEBP, GIF va boshqa rasm turlari) qabul qilinadi'), false);
    }
    cb(null, true);
  }
};
