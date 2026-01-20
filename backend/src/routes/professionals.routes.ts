import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Professional } from '../models';
import { authenticateToken, adminOnly, anyAuthenticated } from '../middleware/auth';

const router = Router();

// GET /api/professionals - List all professionals (any authenticated user)
router.get('/', authenticateToken, anyAuthenticated, async (_req: Request, res: Response): Promise<void> => {
  try {
    const professionals = await Professional.findAll({
      where: { active: true },
      order: [['name', 'ASC']],
    });

    res.json({ professionals });
  } catch (error) {
    console.error('List professionals error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/professionals/all - List all professionals including inactive (admin only)
router.get('/all', authenticateToken, adminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const professionals = await Professional.findAll({
      order: [['name', 'ASC']],
    });

    res.json({ professionals });
  } catch (error) {
    console.error('List all professionals error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/professionals/:id - Get professional by ID
router.get('/:id', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await Professional.findByPk(req.params.id);
    if (!professional) {
      res.status(404).json({ error: 'Profissional não encontrado' });
      return;
    }

    res.json({ professional });
  } catch (error) {
    console.error('Get professional error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/professionals - Create new professional (admin only)
router.post(
  '/',
  authenticateToken,
  adminOnly,
  [body('name').notEmpty().withMessage('Nome é obrigatório')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name } = req.body;

      const professional = await Professional.create({ name });

      res.status(201).json({ professional });
    } catch (error) {
      console.error('Create professional error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// PUT /api/professionals/:id - Update professional (admin only)
router.put(
  '/:id',
  authenticateToken,
  adminOnly,
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('active').optional().isBoolean().withMessage('Status inválido'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const professional = await Professional.findByPk(req.params.id);
      if (!professional) {
        res.status(404).json({ error: 'Profissional não encontrado' });
        return;
      }

      const { name, active } = req.body;

      if (name !== undefined) professional.name = name;
      if (active !== undefined) professional.active = active;

      await professional.save();

      res.json({ professional });
    } catch (error) {
      console.error('Update professional error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// DELETE /api/professionals/:id - Delete professional (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const professional = await Professional.findByPk(req.params.id);
    if (!professional) {
      res.status(404).json({ error: 'Profissional não encontrado' });
      return;
    }

    // Hard delete - remove from database
    await professional.destroy();

    res.json({ message: 'Profissional excluído com sucesso' });
  } catch (error: any) {
    console.error('Delete professional error:', error);
    // Check for foreign key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ error: 'Não é possível excluir profissional com vídeos associados' });
      return;
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
