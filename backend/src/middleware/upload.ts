import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Readable } from 'stream';

// Ensure upload directories exist
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
const videosDir = path.join(uploadsDir, 'videos');
const logosDir = path.join(uploadsDir, 'logos');
const tempDir = path.join(uploadsDir, 'temp');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const reportsDir = path.join(uploadsDir, 'reports');

[uploadsDir, videosDir, logosDir, tempDir, thumbnailsDir, reportsDir].forEach(dir => {
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

/**
 * Valida magic bytes do arquivo para garantir que é realmente um vídeo
 * MP4: 00 00 00 ?? 66 74 79 70 (ftyp box)
 * MOV/QuickTime: 00 00 00 ?? 66 74 79 70 (ftyp box)
 * AVI: 52 49 46 46 ?? ?? ?? ?? 41 56 49 20 (RIFF...AVI )
 */
const validateVideoMagicBytes = (filePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const stream = fs.createReadStream(filePath, { start: 0, end: 12 });
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: string | Buffer) => {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      } else {
        chunks.push(Buffer.from(chunk));
      }
    });

    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      
      // MP4/MOV: deve começar com ftyp box (bytes 4-7 = 'ftyp')
      if (buffer.length >= 8) {
        const ftyp = buffer.slice(4, 8).toString('ascii');
        if (ftyp === 'ftyp') {
          // Verificar brand (MP4 ou QuickTime)
          const brand = buffer.slice(8, 12).toString('ascii');
          if (brand.includes('mp4') || brand.includes('qt  ') || brand.includes('isom')) {
            resolve(true);
            return;
          }
        }
      }

      // AVI: deve começar com RIFF...AVI
      if (buffer.length >= 12) {
        const riff = buffer.slice(0, 4).toString('ascii');
        const avi = buffer.slice(8, 12).toString('ascii');
        if (riff === 'RIFF' && avi === 'AVI ') {
          resolve(true);
          return;
        }
      }

      resolve(false);
    });

    stream.on('error', () => {
      resolve(false);
    });
  });
};

const videoFileFilter = async (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const allowedExts = ['.mp4', '.mov', '.avi'];

  const ext = path.extname(file.originalname).toLowerCase();

  // Validação básica de MIME e extensão
  if (!allowedMimes.includes(file.mimetype) && !allowedExts.includes(ext)) {
    cb(new Error('Formato de arquivo não permitido. Use MP4 ou MOV.'));
    return;
  }

  // Validação de magic bytes será feita após upload (no handler da rota)
  // pois precisamos do arquivo no disco para ler os primeiros bytes
  cb(null, true);
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
  reports: reportsDir,
};
