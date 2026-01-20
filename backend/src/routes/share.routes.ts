import { Router, Request, Response } from 'express';
import { ShareLink, Video, User } from '../models';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

const router = Router();

// Create share link (User authenticated)
// POST /api/shares
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { videoIds, name, message, expiresAt, maxDownloads } = req.body;
        const userId = req.user!.id;

        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({ error: 'Selecione pelo menos um vídeo' });
        }

        const token = uuidv4();

        const shareLink = await ShareLink.create({
            token,
            name,
            message,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            maxDownloads: maxDownloads ? Number(maxDownloads) : null,
            active: true,
            createdBy: userId,
        });

        // Add videos
        await shareLink.addVideos(videoIds);

        res.status(201).json(shareLink);
    } catch (error) {
        console.error('Create share link error:', error);
        res.status(500).json({ error: 'Erro ao criar link de compartilhamento' });
    }
});

// Get share info (Public)
// GET /api/shares/:token
router.get('/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const shareLink = await ShareLink.findOne({
            where: { token, active: true },
            include: [
                {
                    model: Video,
                    as: 'videos',
                    attributes: ['id', 'title', 'durationSeconds', 'resolutionLabel', 'fileSizeBytes', 'thumbnailPath', 'createdAt', 'originalFilename', 'storedFilename', 'filePath', 'isTv', 'tvTitle'],
                    through: { attributes: [] }
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!shareLink) {
            return res.status(404).json({ error: 'Link não encontrado ou expirado' });
        }

        // Check expiration
        if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
            return res.status(410).json({ error: 'Link expirado' });
        }

        // Check max downloads
        if (shareLink.maxDownloads && shareLink.downloads >= shareLink.maxDownloads) {
            return res.status(403).json({ error: 'Limite de downloads atingido' });
        }

        res.json(shareLink);
    } catch (error) {
        console.error('Get share link error:', error);
        res.status(500).json({ error: 'Erro ao acessar link' });
    }
});

// Download shared videos (Public)
// POST /api/shares/:token/download
router.post('/:token/download', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        const { videoIds } = req.body; // Optional subset

        const shareLink = await ShareLink.findOne({
            where: { token, active: true },
            include: [{ model: Video, as: 'videos' }]
        });

        if (!shareLink) {
            return res.status(404).json({ error: 'Link não encontrado' });
        }

        if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
            return res.status(410).json({ error: 'Link expirado' });
        }

        if (shareLink.maxDownloads && shareLink.downloads >= shareLink.maxDownloads) {
            return res.status(403).json({ error: 'Limite de downloads atingido' });
        }

        // Determine videos to download
        let videosToDownload = shareLink.videos || [];
        if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
            videosToDownload = videosToDownload.filter(v => videoIds.includes(v.id));
        }

        if (videosToDownload.length === 0) {
            return res.status(400).json({ error: 'Nenhum vídeo selecionado' });
        }

        // Increment download count
        await shareLink.increment('downloads');

        if (videosToDownload.length === 1) {
            const video = videosToDownload[0];
            const filePath = path.isAbsolute(video.filePath) ? video.filePath : path.join(process.cwd(), video.filePath);
            if (fs.existsSync(filePath)) {
                res.download(filePath, video.originalFilename || video.title + '.mp4');
                return;
            } else {
                return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
            }
        }

        // Multiple: Zip
        const archive = archiver('zip', { zlib: { level: 9 } });
        res.attachment('shared-videos.zip');
        archive.pipe(res);

        for (const video of videosToDownload) {
            const filePath = path.isAbsolute(video.filePath) ? video.filePath : path.join(process.cwd(), video.filePath);
            if (fs.existsSync(filePath)) {
                let filename = video.originalFilename || `${video.title}.mp4`;
                filename = filename.replace(/[/\\?%*:|"<>]/g, '-');
                archive.file(filePath, { name: filename });
            }
        }
        await archive.finalize();

    } catch (error) {
        console.error('Share download error:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Erro ao baixar arquivos' });
    }
});

export default router;
