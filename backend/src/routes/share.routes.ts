import { Router, Request, Response } from 'express';
import { ShareLink, Video, User } from '../models';
import { authenticateToken } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

const router = Router();

// Função auxiliar para gerar slug a partir de string
function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
        .replace(/^-+|-+$/g, '') // Remove hífens do início e fim
        .substring(0, 50); // Limita tamanho
}

// Helper function to validate share token and get share link
async function validateShareToken(token: string): Promise<ShareLink | null> {
    try {
        const shareLink = await ShareLink.findOne({
            where: { 
                [Op.or]: [
                    { token },
                    { customSlug: token }
                ],
                active: true 
            },
            include: [{ model: Video, as: 'videos' }]
        });

        if (!shareLink) return null;
        if (shareLink.expiresAt && new Date() > shareLink.expiresAt) return null;
        if (shareLink.maxDownloads && shareLink.downloads >= shareLink.maxDownloads) return null;

        return shareLink;
    } catch (error) {
        console.error('Error validating share token:', error);
        return null;
    }
}

// Função auxiliar para gerar slug único
async function generateUniqueSlug(baseSlug: string, videoIds: number[]): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    // Verifica se o slug já existe
    while (true) {
        const existing = await ShareLink.findOne({
            where: {
                // IMPORTANTE:
                // O índice UNIQUE do banco vale para registros ativos e inativos.
                // Então precisamos checar qualquer ocorrência para evitar ER_DUP_ENTRY.
                customSlug: slug
            }
        });

        if (!existing) {
            return slug;
        }

        // Tenta com contador
        slug = `${baseSlug}-${counter}`;
        counter++;

        // Limita tentativas
        if (counter > 100) {
            return uuidv4().substring(0, 8); // Fallback para UUID curto
        }
    }
}

// Create share link (User authenticated)
// POST /api/shares
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { videoIds, name, message, expiresAt, maxDownloads, customSlug } = req.body;
        const userId = req.user!.id;

        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            return res.status(400).json({ error: 'Selecione pelo menos um vídeo' });
        }

        // Buscar todos os vídeos selecionados para verificar quais são pais
        const selectedVideos = await Video.findAll({
            where: { id: videoIds },
            attributes: ['id', 'parentId']
        });

        // Criar conjunto de IDs finais (inclui selecionados + versões)
        const finalVideoIds = new Set<number>(videoIds);

        // Para cada vídeo selecionado, se for pai (parentId === null), buscar suas versões
        for (const video of selectedVideos) {
            if (video.parentId === null) {
                // É um vídeo pai, buscar todas as versões
                const versions = await Video.findAll({
                    where: { parentId: video.id },
                    attributes: ['id']
                });
                // Adicionar IDs das versões ao conjunto
                versions.forEach(version => finalVideoIds.add(version.id));
            }
        }

        // Converter Set para Array
        const allVideoIds = Array.from(finalVideoIds);

        const token = uuidv4();

        // Gera slug personalizado
        let finalSlug: string | null = null;
        
        if (customSlug && customSlug.trim()) {
            // Se o usuário forneceu um slug customizado
            finalSlug = generateSlug(customSlug.trim());
            finalSlug = await generateUniqueSlug(finalSlug, allVideoIds);
        } else if (name && name.trim()) {
            // Senão, usa o nome do compartilhamento
            finalSlug = generateSlug(name.trim());
            finalSlug = await generateUniqueSlug(finalSlug, allVideoIds);
        } else {
            // Senão, usa o título do primeiro vídeo
            const firstVideo = await Video.findByPk(allVideoIds[0]);
            if (firstVideo) {
                const baseSlug = generateSlug(firstVideo.title || 'video');
                finalSlug = await generateUniqueSlug(baseSlug, allVideoIds);
            }
        }

        // Criar shareLink com retry leve para evitar race condition de UNIQUE
        let shareLink: ShareLink | null = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                shareLink = await ShareLink.create({
                    token,
                    customSlug: finalSlug,
                    name,
                    message,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    maxDownloads: maxDownloads ? Number(maxDownloads) : null,
                    active: true,
                    createdBy: userId,
                });
                break;
            } catch (err: any) {
                const isUniqueSlug =
                    err?.name === 'SequelizeUniqueConstraintError' &&
                    (err?.fields?.custom_slug ||
                        (Array.isArray(err?.errors) && err.errors.some((e: any) => e?.path === 'custom_slug')));

                if (isUniqueSlug && finalSlug) {
                    // Gera próximo slug disponível e tenta novamente
                    finalSlug = await generateUniqueSlug(finalSlug, allVideoIds);
                    continue;
                }
                throw err;
            }
        }

        if (!shareLink) {
            throw new Error('Falha ao criar link de compartilhamento');
        }

        // Add videos (incluindo versões automaticamente)
        await shareLink.addVideos(allVideoIds);

        // Buscar shareLink completo com vídeos para retornar
        const shareLinkWithVideos = await ShareLink.findByPk(shareLink.id, {
            include: [
                {
                    model: Video,
                    as: 'videos',
                    attributes: ['id', 'title', 'thumbnailPath', 'parentId'],
                    through: { attributes: [] }
                }
            ]
        });

        res.status(201).json(shareLinkWithVideos);
    } catch (error) {
        console.error('Create share link error:', error);
        res.status(500).json({ error: 'Erro ao criar link de compartilhamento' });
    }
});

// GET /api/shares/:token/thumbnail/:videoId - Get thumbnail for shared video (Public)
// IMPORTANTE: Esta rota deve vir ANTES de /:token para evitar conflito
router.get('/:token/thumbnail/:videoId', async (req: Request, res: Response) => {
    try {
        const { token, videoId } = req.params;
        const shareLink = await validateShareToken(token);

        if (!shareLink) {
            return res.status(404).json({ error: 'Link não encontrado ou expirado' });
        }

        const video = shareLink.videos?.find(v => v.id === Number(videoId));
        if (!video) {
            return res.status(404).json({ error: 'Vídeo não encontrado neste compartilhamento' });
        }

        if (!video.thumbnailPath) {
            return res.status(404).json({ error: 'Thumbnail não disponível' });
        }

        const thumbnailPath = path.isAbsolute(video.thumbnailPath)
            ? video.thumbnailPath
            : path.join(process.cwd(), video.thumbnailPath);

        if (!fs.existsSync(thumbnailPath)) {
            return res.status(404).json({ error: 'Arquivo de thumbnail não encontrado' });
        }

        res.sendFile(thumbnailPath);
    } catch (error) {
        console.error('Get share thumbnail error:', error);
        res.status(500).json({ error: 'Erro ao buscar thumbnail' });
    }
});

// GET /api/shares/:token/stream/:videoId - Stream video for shared link (Public)
// IMPORTANTE: Esta rota deve vir ANTES de /:token para evitar conflito
router.get('/:token/stream/:videoId', async (req: Request, res: Response) => {
    try {
        const { token, videoId } = req.params;
        const shareLink = await validateShareToken(token);

        if (!shareLink) {
            return res.status(404).json({ error: 'Link não encontrado ou expirado' });
        }

        const video = shareLink.videos?.find(v => v.id === Number(videoId));
        if (!video) {
            return res.status(404).json({ error: 'Vídeo não encontrado neste compartilhamento' });
        }

        const filePath = path.isAbsolute(video.filePath)
            ? video.filePath
            : path.join(process.cwd(), video.filePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
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
        console.error('Stream share video error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Erro ao reproduzir vídeo' });
        }
    }
});

// Get share info (Public)
// GET /api/shares/:token
router.get('/:token', async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        // Busca por token UUID ou customSlug
        const shareLink = await ShareLink.findOne({
            where: { 
                [Op.or]: [
                    { token },
                    { customSlug: token }
                ],
                active: true 
            },
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
            where: { 
                [Op.or]: [
                    { token },
                    { customSlug: token }
                ],
                active: true 
            },
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

// List all share links (User authenticated - Global access)
// GET /api/shares/list/my-shares
router.get('/list/my-shares', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Retorna todos os compartilhamentos ativos (global)
        const shareLinks = await ShareLink.findAll({
            where: { 
                active: true 
            },
            include: [
                {
                    model: Video,
                    as: 'videos',
                    attributes: ['id', 'title', 'thumbnailPath'],
                    through: { attributes: [] }
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(shareLinks);
    } catch (error) {
        console.error('List share links error:', error);
        res.status(500).json({ error: 'Erro ao listar compartilhamentos' });
    }
});

// Check if videos already have an active share link (User authenticated)
// POST /api/shares/check-existing
router.post('/check-existing', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { videoIds } = req.body;
        const userId = req.user!.id;

        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            return res.json({ existing: null });
        }

        // Buscar vídeos selecionados e incluir versões automaticamente
        const selectedVideos = await Video.findAll({
            where: { id: videoIds },
            attributes: ['id', 'parentId']
        });

        const finalVideoIds = new Set<number>(videoIds);
        for (const video of selectedVideos) {
            if (video.parentId === null) {
                const versions = await Video.findAll({
                    where: { parentId: video.id },
                    attributes: ['id']
                });
                versions.forEach(version => finalVideoIds.add(version.id));
            }
        }

        // Ordena os IDs para comparação consistente
        const sortedVideoIds = [...finalVideoIds].sort((a, b) => a - b);

        // Busca links ativos do usuário
        const existingLinks = await ShareLink.findAll({
            where: { 
                createdBy: userId,
                active: true,
                [Op.or]: [
                    { expiresAt: null },
                    { expiresAt: { [Op.gt]: new Date() } }
                ]
            },
            include: [
                {
                    model: Video,
                    as: 'videos',
                    attributes: ['id'],
                    through: { attributes: [] }
                }
            ]
        });

        // Verifica se algum link tem exatamente os mesmos vídeos
        for (const link of existingLinks) {
            const linkVideoIds = link.videos?.map(v => v.id).sort((a, b) => a - b) || [];
            
            if (JSON.stringify(linkVideoIds) === JSON.stringify(sortedVideoIds)) {
                // Verifica limite de downloads
                if (link.maxDownloads && link.downloads >= link.maxDownloads) {
                    continue; // Ignora links que atingiram o limite
                }

                return res.json({ 
                    existing: {
                        id: link.id,
                        token: link.token,
                        customSlug: link.customSlug,
                        name: link.name,
                        expiresAt: link.expiresAt,
                        downloads: link.downloads,
                        maxDownloads: link.maxDownloads,
                        createdAt: link.createdAt
                    }
                });
            }
        }

        res.json({ existing: null });
    } catch (error) {
        console.error('Check existing share error:', error);
        res.status(500).json({ error: 'Erro ao verificar compartilhamentos existentes' });
    }
});

// Delete share link (User authenticated - Global access, any user can delete)
// DELETE /api/shares/:id
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const shareLink = await ShareLink.findByPk(id);

        if (!shareLink) {
            return res.status(404).json({ error: 'Compartilhamento não encontrado' });
        }

        // Qualquer usuário autenticado pode excluir (global)
        // Marca como inativo ao invés de deletar fisicamente
        await shareLink.update({ active: false });

        res.json({ message: 'Compartilhamento excluído com sucesso' });
    } catch (error) {
        console.error('Delete share link error:', error);
        res.status(500).json({ error: 'Erro ao excluir compartilhamento' });
    }
});

export default router;
