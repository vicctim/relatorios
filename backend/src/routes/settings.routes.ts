import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Setting, NotificationRecipient, DEFAULT_SETTINGS } from '../models';
import { authenticateToken, adminOnly, anyAuthenticated } from '../middleware/auth';
import { uploadLogo, directories } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET /api/settings/public - Get public settings (no auth required, for login page)
router.get('/public', async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Setting.getAll();

    // Only return public settings
    res.json({
      settings: {
        company_name: settings.company_name,
        company_logo_path: settings.company_logo_path,
      }
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/settings - Get all settings (any authenticated user)
router.get('/', authenticateToken, anyAuthenticated, async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Setting.getAll();

    // Remove sensitive settings for non-admin users
    const sanitized = { ...settings };
    delete sanitized.smtp_password;
    delete sanitized.evolution_api_token;

    res.json({ settings: sanitized });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/settings/all - Get all settings including sensitive ones (admin only)
router.get('/all', authenticateToken, adminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Setting.getAll();
    res.json({ settings });
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/settings - Update settings (admin only)
router.put(
  '/',
  authenticateToken,
  adminOnly,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updates = req.body;

      // Validate keys
      const allowedKeys = Object.keys(DEFAULT_SETTINGS);
      const invalidKeys = Object.keys(updates).filter(k => !allowedKeys.includes(k));

      if (invalidKeys.length > 0) {
        res.status(400).json({ error: `Chaves inválidas: ${invalidKeys.join(', ')}` });
        return;
      }

      // Update each setting
      for (const [key, value] of Object.entries(updates)) {
        await Setting.setValue(key, value, req.user?.id);
      }

      const settings = await Setting.getAll();
      res.json({ settings, message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// POST /api/settings/logo - Upload company logo (admin only)
router.post(
  '/logo',
  authenticateToken,
  adminOnly,
  uploadLogo.single('logo'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return;
      }

      // Delete old logo if exists
      const oldLogoPath = await Setting.getValue<string>('company_logo_path');
      if (oldLogoPath) {
        const fullOldPath = path.join(directories.logos, path.basename(oldLogoPath));
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }

      // Save new logo path
      const logoPath = `/uploads/logos/${req.file.filename}`;
      await Setting.setValue('company_logo_path', logoPath, req.user?.id);

      res.json({
        message: 'Logo atualizado com sucesso',
        logoPath,
      });
    } catch (error) {
      console.error('Upload logo error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// GET /api/settings/notification-recipients - List notification recipients (admin only)
router.get('/notification-recipients', authenticateToken, adminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const recipients = await NotificationRecipient.findAll({
      order: [['type', 'ASC'], ['value', 'ASC']],
    });

    res.json({ recipients });
  } catch (error) {
    console.error('Get notification recipients error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/settings/notification-recipients - Add notification recipient (admin only)
router.post(
  '/notification-recipients',
  authenticateToken,
  adminOnly,
  [
    body('type').isIn(['email', 'whatsapp']).withMessage('Tipo inválido'),
    body('value').notEmpty().withMessage('Valor é obrigatório'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { type, value } = req.body;

      // Validate email format
      if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        res.status(400).json({ error: 'Email inválido' });
        return;
      }

      // Validate phone format (basic validation)
      if (type === 'whatsapp' && !/^\+?\d{10,15}$/.test(value.replace(/\D/g, ''))) {
        res.status(400).json({ error: 'Número de telefone inválido' });
        return;
      }

      const recipient = await NotificationRecipient.create({ type, value });

      res.status(201).json({ recipient });
    } catch (error) {
      console.error('Create notification recipient error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// PUT /api/settings/notification-recipients/:id - Update notification recipient (admin only)
router.put(
  '/notification-recipients/:id',
  authenticateToken,
  adminOnly,
  [
    body('value').optional().notEmpty().withMessage('Valor não pode ser vazio'),
    body('active').optional().isBoolean().withMessage('Status inválido'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const recipient = await NotificationRecipient.findByPk(req.params.id);
      if (!recipient) {
        res.status(404).json({ error: 'Destinatário não encontrado' });
        return;
      }

      const { value, active } = req.body;

      if (value !== undefined) recipient.value = value;
      if (active !== undefined) recipient.active = active;

      await recipient.save();

      res.json({ recipient });
    } catch (error) {
      console.error('Update notification recipient error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// DELETE /api/settings/notification-recipients/:id - Delete notification recipient (admin only)
router.delete('/notification-recipients/:id', authenticateToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const recipient = await NotificationRecipient.findByPk(req.params.id);
    if (!recipient) {
      res.status(404).json({ error: 'Destinatário não encontrado' });
      return;
    }

    await recipient.destroy();

    res.json({ message: 'Destinatário excluído com sucesso' });
  } catch (error) {
    console.error('Delete notification recipient error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
