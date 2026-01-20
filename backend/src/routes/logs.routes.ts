import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { DownloadLog, Video, User } from '../models';
import { authenticateToken, adminOnly } from '../middleware/auth';

const router = Router();

// GET /api/logs/downloads - Get download logs (admin only)
router.get('/downloads', authenticateToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      startDate,
      endDate,
      userId,
      videoId,
      page = 1,
      limit = 50
    } = req.query;

    const where: any = {};
    const offset = (Number(page) - 1) * Number(limit);

    // Filter by date range
    if (startDate || endDate) {
      where.downloadedAt = {};
      if (startDate) {
        where.downloadedAt[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        where.downloadedAt[Op.lte] = new Date(endDate as string);
      }
    }

    // Filter by user
    if (userId) {
      where.userId = userId;
    }

    // Filter by video
    if (videoId) {
      where.videoId = videoId;
    }

    const { count, rows: logs } = await DownloadLog.findAndCountAll({
      where,
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'originalFilename', 'resolutionLabel'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['downloadedAt', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      logs,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get download logs error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/logs/downloads/summary - Get download summary (admin only)
router.get('/downloads/summary', authenticateToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;

    let where: any = {};

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.downloadedAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    const totalDownloads = await DownloadLog.count({ where });

    // Most downloaded videos
    const mostDownloaded = await DownloadLog.findAll({
      where,
      attributes: [
        'videoId',
        [DownloadLog.sequelize!.fn('COUNT', 'videoId'), 'downloadCount'],
      ],
      include: [
        {
          model: Video,
          as: 'video',
          attributes: ['id', 'title', 'originalFilename'],
        },
      ],
      group: ['videoId', 'video.id'],
      order: [[DownloadLog.sequelize!.literal('downloadCount'), 'DESC']],
      limit: 10,
    });

    // Downloads by user
    const byUser = await DownloadLog.findAll({
      where,
      attributes: [
        'userId',
        [DownloadLog.sequelize!.fn('COUNT', 'userId'), 'downloadCount'],
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      group: ['userId', 'user.id'],
      order: [[DownloadLog.sequelize!.literal('downloadCount'), 'DESC']],
    });

    res.json({
      totalDownloads,
      mostDownloaded,
      byUser,
    });
  } catch (error) {
    console.error('Get download summary error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
