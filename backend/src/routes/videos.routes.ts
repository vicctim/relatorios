import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { Video, Professional, DownloadLog, User } from '../models';
import { authenticateToken, adminOnly, editorOrAdmin, anyAuthenticated } from '../middleware/auth';
import { uploadVideo, directories } from '../middleware/upload';
import ffmpegService from '../services/ffmpeg.service';
import notificationService from '../services/notification.service';
import reportService from '../services/report.service';
import archiver from 'archiver';

const router = Router();

// GET /api/videos - List videos with filters
router.get('/', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      month,
      year,
      professionalId,
      search,
      parentOnly,
      page = 1,
      limit = 50
    } = req.query;

    const where: any = {};
    const offset = (Number(page) - 1) * Number(limit);

    // Filter by month/year (using requestDate)
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      where.requestDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    // Filter by professional
    if (professionalId) {
      where.professionalId = professionalId;
    }

    // Search by title or filename
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { originalFilename: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter only parent videos
    if (parentOnly === 'true') {
      where.parentId = null;
    }

    const { count, rows: videos } = await Video.findAndCountAll({
      where,
      include: [
        { model: Professional, as: 'professional' },
        { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
        {
          model: Video,
          as: 'versions',
          include: [{ model: Professional, as: 'professional' }],
        },
      ],
      order: [['requestDate', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      videos,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('List videos error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/videos/:id - Get video by ID with versions
router.get('/:id', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findByPk(req.params.id, {
      include: [
        { model: Professional, as: 'professional' },
        { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
        {
          model: Video,
          as: 'versions',
          include: [{ model: Professional, as: 'professional' }],
        },
        { model: Video, as: 'parent' },
      ],
    });

    if (!video) {
      res.status(404).json({ error: 'Vídeo não encontrado' });
      return;
    }

    // Calculate total duration including versions
    let totalDuration = video.durationSeconds;
    if (video.versions && video.versions.length > 0) {
      totalDuration += video.versions.reduce((sum, v) => sum + v.durationSeconds * 0.5, 0);
    }

    res.json({
      video,
      totalCalculatedDuration: totalDuration,
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/videos - Upload new video (editor or admin)
router.post(
  '/',
  authenticateToken,
  editorOrAdmin,
  uploadVideo.single('video'),
  [
    body('title').optional(),
    body('requestDate').notEmpty().withMessage('Data de solicitação é obrigatória'),
    body('completionDate').notEmpty().withMessage('Data de conclusão é obrigatória'),
    body('professionalId').notEmpty().withMessage('Profissional é obrigatório'),
    body('isTv').optional().isBoolean(),
    body('tvTitle').optional(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Clean up uploaded file
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      const { requestDate, completionDate, professionalId, isTv, tvTitle, customDurationSeconds } = req.body;
      let { title } = req.body;

      // Validate TV title requirement
      if (isTv === 'true' || isTv === true) {
        if (!tvTitle) {
          fs.unlinkSync(req.file.path);
          res.status(400).json({ error: 'Título TV é obrigatório quando marcado para TV' });
          return;
        }
      }

      // Process video (analyze and compress if needed)
      const { finalPath, storedFilename, metadata, wasCompressed } =
        await ffmpegService.processUploadedVideo(req.file.path, req.file.originalname);

      // Use filename as title if not provided
      if (!title) {
        title = path.basename(req.file.originalname, path.extname(req.file.originalname));
      }

      // Generate thumbnail from video
      const thumbnailFilename = path.basename(storedFilename, path.extname(storedFilename));
      const thumbnailPath = await ffmpegService.extractThumbnail(finalPath, thumbnailFilename);

      // Create video record
      const video = await Video.create({
        title,
        originalFilename: req.file.originalname,
        storedFilename,
        filePath: finalPath,
        thumbnailPath: thumbnailPath,
        fileSizeBytes: metadata.size,
        durationSeconds: metadata.duration,
        customDurationSeconds: customDurationSeconds ? Number(customDurationSeconds) : null,
        widthPixels: metadata.width,
        heightPixels: metadata.height,
        resolutionLabel: `${metadata.width}x${metadata.height}`,
        isTv: isTv === 'true' || isTv === true,
        tvTitle: tvTitle || null,
        requestDate: new Date(requestDate),
        completionDate: new Date(completionDate),
        professionalId: Number(professionalId),
        uploadedBy: req.user!.id,
      });

      // Reload with associations
      await video.reload({
        include: [
          { model: Professional, as: 'professional' },
          { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
        ],
      });

      // Send notifications in background (don't block response)
      const videoDate = new Date(requestDate);
      const videoMonth = videoDate.getMonth() + 1;
      const videoYear = videoDate.getFullYear();

      (async () => {
        try {
          // Notify about new video
          const professionalName = video.professional?.name || 'Desconhecido';
          await notificationService.notifyNewVideo(video.title, professionalName);

          // Check monthly limit usage and send warnings
          const usage = await reportService.getMonthlyUsage(videoMonth, videoYear);
          const usagePercentage = Math.round((usage.used / usage.limit) * 100);

          if (usage.used >= usage.limit) {
            // Limit reached
            await notificationService.notifyLimitReached(videoMonth, videoYear, usage.used, usage.limit);
          } else if (usagePercentage >= 90) {
            // 90% warning
            await notificationService.notifyLimitWarning(videoMonth, videoYear, usage.used, usage.limit, 90);
          } else if (usagePercentage >= 80) {
            // 80% warning
            await notificationService.notifyLimitWarning(videoMonth, videoYear, usage.used, usage.limit, 80);
          }
        } catch (notifyError) {
          console.error('Notification error (non-blocking):', notifyError);
        }
      })();

      res.status(201).json({
        video,
        wasCompressed,
        message: wasCompressed ? 'Vídeo comprimido e salvo com sucesso' : 'Vídeo salvo com sucesso',
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Upload video error:', error);
      res.status(500).json({ error: 'Erro ao processar vídeo' });
    }
  }
);

// POST /api/videos/:id/versions - Upload additional version (editor or admin)
router.post(
  '/:id/versions',
  authenticateToken,
  editorOrAdmin,
  uploadVideo.single('video'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      // Find parent video
      const parentVideo = await Video.findByPk(req.params.id);
      if (!parentVideo) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({ error: 'Vídeo pai não encontrado' });
        return;
      }

      // Check if parent is not already a version
      if (parentVideo.parentId) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'Não é possível adicionar versão a uma versão' });
        return;
      }

      // Process version video (no compression)
      const { finalPath, storedFilename, metadata } =
        await ffmpegService.processVersionVideo(req.file.path);

      // Generate thumbnail for the version
      const thumbnailFilename = path.basename(storedFilename, path.extname(storedFilename));
      const thumbnailPath = await ffmpegService.extractThumbnail(finalPath, thumbnailFilename);

      // Create version record
      const version = await Video.create({
        parentId: parentVideo.id,
        title: parentVideo.title, // Inherit title from parent
        originalFilename: req.file.originalname,
        storedFilename,
        filePath: finalPath,
        thumbnailPath: thumbnailPath,
        fileSizeBytes: metadata.size,
        durationSeconds: metadata.duration,
        widthPixels: metadata.width,
        heightPixels: metadata.height,
        resolutionLabel: `${metadata.width}x${metadata.height}`,
        isTv: parentVideo.isTv,
        tvTitle: parentVideo.tvTitle,
        requestDate: parentVideo.requestDate,
        completionDate: parentVideo.completionDate,
        professionalId: parentVideo.professionalId,
        uploadedBy: req.user!.id,
      });

      // Check monthly limit usage after version upload (in background)
      const versionDate = new Date(parentVideo.requestDate);
      const videoMonth = versionDate.getMonth() + 1;
      const videoYear = versionDate.getFullYear();

      (async () => {
        try {
          // Check monthly limit usage and send warnings
          const usage = await reportService.getMonthlyUsage(videoMonth, videoYear);
          const usagePercentage = Math.round((usage.used / usage.limit) * 100);

          if (usage.used >= usage.limit) {
            // Limit reached
            await notificationService.notifyLimitReached(videoMonth, videoYear, usage.used, usage.limit);
          } else if (usagePercentage >= 90) {
            // 90% warning
            await notificationService.notifyLimitWarning(videoMonth, videoYear, usage.used, usage.limit, 90);
          } else if (usagePercentage >= 80) {
            // 80% warning
            await notificationService.notifyLimitWarning(videoMonth, videoYear, usage.used, usage.limit, 80);
          }
        } catch (notifyError) {
          console.error('Notification error (non-blocking):', notifyError);
        }
      })();

      res.status(201).json({
        version,
        calculatedDuration: version.durationSeconds * 0.5,
        message: 'Versão adicional salva com sucesso',
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Upload version error:', error);
      res.status(500).json({ error: 'Erro ao processar versão' });
    }
  }
);

// PUT /api/videos/:id - Update video metadata (editor or admin)
router.put(
  '/:id',
  authenticateToken,
  editorOrAdmin,
  [
    body('title').optional().notEmpty().withMessage('Título não pode ser vazio'),
    body('requestDate').optional(),
    body('completionDate').optional(),
    body('professionalId').optional(),
    body('isTv').optional().isBoolean(),
    body('tvTitle').optional(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const video = await Video.findByPk(req.params.id);
      if (!video) {
        res.status(404).json({ error: 'Vídeo não encontrado' });
        return;
      }

      const { title, requestDate, completionDate, professionalId, isTv, tvTitle, customDurationSeconds } = req.body;

      // Update fields
      if (title !== undefined) video.title = title;
      if (requestDate !== undefined) video.requestDate = new Date(requestDate);
      if (completionDate !== undefined) video.completionDate = new Date(completionDate);
      if (professionalId !== undefined) video.professionalId = Number(professionalId);
      if (isTv !== undefined) video.isTv = isTv;
      if (tvTitle !== undefined) video.tvTitle = tvTitle;
      if (customDurationSeconds !== undefined) {
        video.customDurationSeconds = customDurationSeconds ? Number(customDurationSeconds) : null;
      }

      // Validate TV title requirement
      if (video.isTv && !video.tvTitle) {
        res.status(400).json({ error: 'Título TV é obrigatório quando marcado para TV' });
        return;
      }

      await video.save();

      // Reload with associations
      await video.reload({
        include: [
          { model: Professional, as: 'professional' },
          { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
        ],
      });

      res.json({ video });
    } catch (error) {
      console.error('Update video error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// DELETE /api/videos/:id - Delete video (editor or admin)
router.delete('/:id', authenticateToken, editorOrAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findByPk(req.params.id, {
      include: [{ model: Video, as: 'versions' }],
    });

    if (!video) {
      res.status(404).json({ error: 'Vídeo não encontrado' });
      return;
    }

    // Resolve file path (handle both relative and absolute paths)
    const filePath = path.isAbsolute(video.filePath)
      ? video.filePath
      : path.join(process.cwd(), video.filePath);

    // Delete video file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete thumbnail if exists
    if (video.thumbnailPath) {
      const thumbnailPath = path.isAbsolute(video.thumbnailPath)
        ? video.thumbnailPath
        : path.join(process.cwd(), video.thumbnailPath);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    // Delete version files if any
    if (video.versions) {
      for (const version of video.versions) {
        const versionPath = path.isAbsolute(version.filePath)
          ? version.filePath
          : path.join(process.cwd(), version.filePath);
        if (fs.existsSync(versionPath)) {
          fs.unlinkSync(versionPath);
        }
      }
    }

    // Delete video record (cascade will delete versions)
    await video.destroy();

    res.json({ message: 'Vídeo excluído com sucesso' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/videos/:id/download - Download video
router.get('/:id/download', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Vídeo não encontrado' });
      return;
    }

    // Resolve file path (handle both relative and absolute paths)
    const filePath = path.isAbsolute(video.filePath)
      ? video.filePath
      : path.join(process.cwd(), video.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Arquivo não encontrado' });
      return;
    }

    // Log download
    await DownloadLog.create({
      videoId: video.id,
      userId: req.user!.id,
      downloadedAt: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    // Determine filename for download
    let filename = video.originalFilename;
    if (!filename) {
      const ext = path.extname(video.storedFilename) || '.mp4';
      filename = `${video.title}${ext}`;
    }

    // Send file
    res.download(filePath, filename);
  } catch (error) {
    console.error('Download video error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/videos/:id/stream - Stream video for preview
router.get('/:id/stream', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Vídeo não encontrado' });
      return;
    }

    // Resolve file path (handle both relative and absolute paths)
    const filePath = path.isAbsolute(video.filePath)
      ? video.filePath
      : path.join(process.cwd(), video.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Arquivo não encontrado' });
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/videos/:id/thumbnail - Get video thumbnail
router.get('/:id/thumbnail', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const video = await Video.findByPk(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Vídeo não encontrado' });
      return;
    }

    if (!video.thumbnailPath) {
      res.status(404).json({ error: 'Thumbnail não disponível' });
      return;
    }

    // Resolve file path (handle both relative and absolute paths)
    const thumbnailPath = path.isAbsolute(video.thumbnailPath)
      ? video.thumbnailPath
      : path.join(process.cwd(), video.thumbnailPath);

    if (!fs.existsSync(thumbnailPath)) {
      res.status(404).json({ error: 'Arquivo de thumbnail não encontrado' });
      return;
    }

    res.sendFile(thumbnailPath);
  } catch (error) {
    console.error('Get thumbnail error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/videos/generate-thumbnails - Generate thumbnails for existing videos (admin only)
router.post('/generate-thumbnails', authenticateToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    // Find videos without thumbnails
    const videos = await Video.findAll({
      where: {
        thumbnailPath: null,
      },
    });

    let generated = 0;
    let failed = 0;

    for (const video of videos) {
      // Resolve video path
      const videoPath = path.isAbsolute(video.filePath)
        ? video.filePath
        : path.join(process.cwd(), video.filePath);

      if (!fs.existsSync(videoPath)) {
        console.warn(`Video file not found: ${videoPath}`);
        failed++;
        continue;
      }

      // Generate thumbnail
      const thumbnailFilename = path.basename(video.storedFilename, path.extname(video.storedFilename));
      const thumbnailPath = await ffmpegService.extractThumbnail(videoPath, thumbnailFilename);

      if (thumbnailPath) {
        video.thumbnailPath = thumbnailPath;
        await video.save();
        generated++;
      } else {
        failed++;
      }
    }

    res.json({
      message: `Thumbnails geradas: ${generated}, falhas: ${failed}`,
      total: videos.length,
      generated,
      failed,
    });
  } catch (error) {
    console.error('Generate thumbnails error:', error);
    res.status(500).json({ error: 'Erro ao gerar thumbnails' });
  }
});

// POST /api/videos/download-zip - Download multiple videos as ZIP
router.post('/download-zip', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      res.status(400).json({ error: 'Lista de vídeos inválida' });
      return;
    }

    const videos = await Video.findAll({
      where: {
        id: {
          [Op.in]: videoIds,
        },
      },
    });

    if (videos.length === 0) {
      res.status(404).json({ error: 'Nenhum vídeo encontrado' });
      return;
    }

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    res.attachment('videos.zip');
    archive.pipe(res);

    for (const video of videos) {
      // Resolve file path
      const filePath = path.isAbsolute(video.filePath)
        ? video.filePath
        : path.join(process.cwd(), video.filePath);

      if (fs.existsSync(filePath)) {
        let filename = video.originalFilename;
        if (!filename) {
          const ext = path.extname(video.storedFilename) || '.mp4';
          filename = `${video.title}${ext}`;
        }
        filename = filename.replace(/[/\\?%*:|"<>]/g, '-');
        archive.file(filePath, { name: filename });
      }
    }

    await archive.finalize();

    // Log downloads
    for (const video of videos) {
      await DownloadLog.create({
        videoId: video.id,
        userId: req.user!.id,
        downloadedAt: new Date(),
        ipAddress: req.ip || req.socket.remoteAddress || null,
      });
    }
  } catch (error) {
    console.error('Download zip error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar arquivo ZIP' });
    }
  }
});

export default router;
