import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Ensure upload directories exist
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
const videosDir = path.join(uploadsDir, 'videos');
const logosDir = path.join(uploadsDir, 'logos');
const tempDir = path.join(uploadsDir, 'temp');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

[uploadsDir, videosDir, logosDir, tempDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Video upload configuration
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir); // Upload to temp first, then process
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const videoFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const allowedExts = ['.mp4', '.mov', '.avi'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não permitido. Use MP4 ou MOV.'));
  }
};

// Logo upload configuration
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, logosDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `logo-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const imageFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagem não permitido. Use PNG ou JPG.'));
  }
};

// Max file size from env (default 500MB for video, 5MB for images)
const maxVideoSize = parseInt(process.env.MAX_FILE_SIZE_MB || '500') * 1024 * 1024;
const maxImageSize = 5 * 1024 * 1024; // 5MB

export const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: maxVideoSize,
  },
});

export const uploadLogo = multer({
  storage: logoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: maxImageSize,
  },
});

// Export directories for use in other modules
export const directories = {
  uploads: uploadsDir,
  videos: videosDir,
  logos: logosDir,
  temp: tempDir,
  thumbnails: thumbnailsDir,
};
