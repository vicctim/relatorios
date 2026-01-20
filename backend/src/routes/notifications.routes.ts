import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, authorize } from '../middleware/auth';
import NotificationRecipient from '../models/NotificationRecipient';
import notificationService from '../services/notification.service';

const router = Router();

// GET /api/notifications/recipients - List all recipients (Admin only)
router.get('/recipients', authenticateToken, authorize('admin'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const recipients = await NotificationRecipient.findAll({
      order: [['type', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(recipients);
  } catch (error) {
    console.error('List recipients error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/notifications/recipients - Add recipient (Admin only)
router.post(
  '/recipients',
  authenticateToken,
  authorize('admin'),
  [
    body('type').isIn(['email', 'whatsapp']).withMessage('Tipo deve ser email ou whatsapp'),
    body('value').notEmpty().withMessage('Valor é obrigatório'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { type, value } = req.body;

      // Validate format
      if (type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          res.status(400).json({ error: 'Email inválido' });
          return;
        }
      } else {
        const phoneRegex = /^\d{10,13}$/;
        const cleanPhone = value.replace(/\D/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          res.status(400).json({ error: 'Telefone inválido (use apenas números, 10-13 dígitos)' });
          return;
        }
      }

      // Check for duplicate
      const existing = await NotificationRecipient.findOne({
        where: { type, value },
      });
      if (existing) {
        res.status(400).json({ error: 'Destinatário já cadastrado' });
        return;
      }

      const recipient = await NotificationRecipient.create({
        type,
        value: type === 'whatsapp' ? value.replace(/\D/g, '') : value,
        active: true,
      });

      res.status(201).json(recipient);
    } catch (error) {
      console.error('Create recipient error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// PUT /api/notifications/recipients/:id - Update recipient (Admin only)
router.put(
  '/recipients/:id',
  authenticateToken,
  authorize('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { active } = req.body;

      const recipient = await NotificationRecipient.findByPk(id);
      if (!recipient) {
        res.status(404).json({ error: 'Destinatário não encontrado' });
        return;
      }

      if (typeof active === 'boolean') {
        recipient.active = active;
        await recipient.save();
      }

      res.json(recipient);
    } catch (error) {
      console.error('Update recipient error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// DELETE /api/notifications/recipients/:id - Delete recipient (Admin only)
router.delete('/recipients/:id', authenticateToken, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const recipient = await NotificationRecipient.findByPk(id);
    if (!recipient) {
      res.status(404).json({ error: 'Destinatário não encontrado' });
      return;
    }

    await recipient.destroy();
    res.json({ message: 'Destinatário removido com sucesso' });
  } catch (error) {
    console.error('Delete recipient error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/notifications/test - Test notification (Admin only)
router.post(
  '/test',
  authenticateToken,
  authorize('admin'),
  [
    body('type').isIn(['email', 'whatsapp']).withMessage('Tipo deve ser email ou whatsapp'),
    body('recipient').notEmpty().withMessage('Destinatário é obrigatório'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { type, recipient } = req.body;

      const success = await notificationService.testNotification(type, recipient);

      if (success) {
        res.json({ message: 'Notificação de teste enviada com sucesso' });
      } else {
        res.status(500).json({ error: 'Falha ao enviar notificação de teste. Verifique as configurações.' });
      }
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({ error: 'Erro ao enviar notificação de teste' });
    }
  }
);

export default router;
