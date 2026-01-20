import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { directories } from '../middleware/upload';
import { Setting } from '../models';

const execAsync = promisify(exec);

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  codec: string;
  bitrate: number;
}

interface CompressionOptions {
  videoBitrate: string;
  audioBitrate: string;
  resolution: string;
  crf: number;
}

class FFmpegService {
  private ffmpegAvailable: boolean | null = null;

  /**
   * Check if FFmpeg is available on the system
   */
  async isFFmpegAvailable(): Promise<boolean> {
    if (this.ffmpegAvailable !== null) {
      return this.ffmpegAvailable;
    }

    try {
      await execAsync('ffmpeg -version');
      this.ffmpegAvailable = true;
      console.log('FFmpeg está disponível no sistema');
    } catch {
      this.ffmpegAvailable = false;
      console.warn('FFmpeg NÃO está instalado. Usando modo básico (sem análise de duração).');
    }

    return this.ffmpegAvailable;
  }

  /**
   * Get basic metadata without FFmpeg (fallback mode)
   */
  getBasicMetadata(filePath: string): VideoMetadata {
    const stats = fs.statSync(filePath);
    return {
      duration: 0, // Unknown without FFmpeg
      width: 0,
      height: 0,
      size: stats.size,
      codec: 'unknown',
      bitrate: 0,
    };
  }

  /**
   * Analyze video file and extract metadata
   */
  async analyzeVideo(filePath: string): Promise<VideoMetadata> {
    // Check if FFmpeg is available
    const ffmpegAvailable = await this.isFFmpegAvailable();

    if (!ffmpegAvailable) {
      // Return basic metadata without FFmpeg analysis
      console.log('Usando metadados básicos (FFmpeg não disponível)');
      return this.getBasicMetadata(filePath);
    }

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          // Fallback to basic metadata if ffprobe fails
          console.warn(`Erro no ffprobe, usando metadados básicos: ${err.message}`);
          resolve(this.getBasicMetadata(filePath));
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          // Return basic metadata if no video stream found
          console.warn('Nenhum stream de vídeo encontrado, usando metadados básicos');
          resolve(this.getBasicMetadata(filePath));
          return;
        }

        const stats = fs.statSync(filePath);

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          size: stats.size,
          codec: videoStream.codec_name || 'unknown',
          bitrate: metadata.format.bit_rate ? Number(metadata.format.bit_rate) : 0,
        });
      });
    });
  }

  /**
   * Check if video needs compression based on file size
   */
  async needsCompression(fileSizeBytes: number): Promise<boolean> {
    const thresholdMB = await Setting.getValue<number>('compression_threshold_mb', 100);
    const thresholdBytes = (thresholdMB || 100) * 1024 * 1024;
    return fileSizeBytes > thresholdBytes;
  }

  /**
   * Get FFmpeg compression preset from settings
   */
  async getCompressionPreset(): Promise<CompressionOptions> {
    const defaultPreset: CompressionOptions = {
      videoBitrate: '2000k',
      audioBitrate: '128k',
      resolution: '1280x720',
      crf: 23,
    };

    const preset = await Setting.getValue<CompressionOptions>('ffmpeg_preset');
    return preset || defaultPreset;
  }

  /**
   * Compress video using FFmpeg
   */
  async compressVideo(
    inputPath: string,
    outputFilename?: string
  ): Promise<{ outputPath: string; metadata: VideoMetadata }> {
    const preset = await this.getCompressionPreset();
    const [width, height] = preset.resolution.split('x').map(Number);

    const filename = outputFilename || `compressed-${path.basename(inputPath, path.extname(inputPath))}.mp4`;
    const outputPath = path.join(directories.videos, filename);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
          `-c:v libx264`,
          `-crf ${preset.crf}`,
          `-preset medium`,
          `-c:a aac`,
          `-b:a ${preset.audioBitrate}`,
          `-movflags +faststart`,
        ])
        .output(outputPath)
        .on('start', (command) => {
          console.log('FFmpeg command:', command);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Compressão: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', async () => {
          try {
            const metadata = await this.analyzeVideo(outputPath);
            resolve({ outputPath, metadata });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err: any) => {
          console.error('Erro na compressão:', err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Process uploaded video: analyze, compress if needed, move to final location
   */
  async processUploadedVideo(
    tempPath: string,
    originalFilename: string
  ): Promise<{
    finalPath: string;
    storedFilename: string;
    metadata: VideoMetadata;
    wasCompressed: boolean;
  }> {
    // Analyze the uploaded video
    const metadata = await this.analyzeVideo(tempPath);

    // Check if FFmpeg is available for compression
    const ffmpegAvailable = await this.isFFmpegAvailable();

    // Check if compression is needed (only if FFmpeg is available)
    const needsCompression = ffmpegAvailable && await this.needsCompression(metadata.size);

    if (needsCompression) {
      console.log(`Vídeo ${originalFilename} precisa de compressão (${(metadata.size / 1024 / 1024).toFixed(2)}MB)`);

      // Compress the video
      const storedFilename = `${path.basename(tempPath, path.extname(tempPath))}.mp4`;
      const { outputPath, metadata: compressedMetadata } = await this.compressVideo(tempPath, storedFilename);

      // Delete the original temp file
      fs.unlinkSync(tempPath);

      return {
        finalPath: outputPath,
        storedFilename,
        metadata: {
          ...metadata, // Use original metadata (dimensions, duration)
          size: compressedMetadata.size, // Use actual stored size
        },
        wasCompressed: true,
      };
    } else {
      // Move file directly to videos folder without compression
      const ext = path.extname(tempPath);
      const storedFilename = path.basename(tempPath);
      const finalPath = path.join(directories.videos, storedFilename);

      fs.renameSync(tempPath, finalPath);

      return {
        finalPath,
        storedFilename,
        metadata,
        wasCompressed: false,
      };
    }
  }

  /**
   * Process additional version video (no compression, just move and analyze)
   */
  async processVersionVideo(
    tempPath: string
  ): Promise<{
    finalPath: string;
    storedFilename: string;
    metadata: VideoMetadata;
  }> {
    // Analyze the uploaded video
    const metadata = await this.analyzeVideo(tempPath);

    // Move to videos folder without compression
    const storedFilename = path.basename(tempPath);
    const finalPath = path.join(directories.videos, storedFilename);

    fs.renameSync(tempPath, finalPath);

    return {
      finalPath,
      storedFilename,
      metadata,
    };
  }

  /**
   * Extract a thumbnail from video at specified time (default: 1 second)
   */
  async extractThumbnail(
    videoPath: string,
    outputFilename: string,
    timeInSeconds: number = 1
  ): Promise<string | null> {
    // Check if FFmpeg is available
    const ffmpegAvailable = await this.isFFmpegAvailable();

    if (!ffmpegAvailable) {
      console.log('FFmpeg não disponível, thumbnail não será gerada');
      return null;
    }

    const thumbnailPath = path.join(directories.thumbnails, `${outputFilename}.jpg`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeInSeconds],
          filename: `${outputFilename}.jpg`,
          folder: directories.thumbnails,
          size: '320x?', // Mantém proporção original, largura máxima 320px
        })
        .on('end', () => {
          console.log(`Thumbnail gerada: ${thumbnailPath}`);
          resolve(thumbnailPath);
        })
        .on('error', (err: any) => {
          console.error('Erro ao gerar thumbnail:', err);
          reject(err);
          resolve(null);
        });
    });
  }
}

export default new FFmpegService();
