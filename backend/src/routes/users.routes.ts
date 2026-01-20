import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models';
import { authenticateToken, adminOnly } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken, adminOnly);

// GET /api/users - List all users
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      order: [['name', 'ASC']],
    });

    res.json({ users: users.map(u => u.toJSON()) });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/users - Create new user
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('role')
      .isIn(['admin', 'editor', 'viewer'])
      .withMessage('Papel inválido'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, email, password, role } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'Email já cadastrado' });
        return;
      }

      const user = await User.create({
        name,
        email,
        password,
        role,
      });

      res.status(201).json({ user: user.toJSON() });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// PUT /api/users/:id - Update user
router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('role')
      .optional()
      .isIn(['admin', 'editor', 'viewer'])
      .withMessage('Papel inválido'),
    body('active').optional().isBoolean().withMessage('Status inválido'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      const { name, email, password, role, active } = req.body;

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          res.status(400).json({ error: 'Email já cadastrado' });
          return;
        }
      }

      // Update fields
      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (password !== undefined) user.password = password;
      if (role !== undefined) user.role = role;
      if (active !== undefined) user.active = active;

      await user.save();

      res.json({ user: user.toJSON() });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    // Prevent self-deletion
    if (req.user?.id === user.id) {
      res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
      return;
    }

    await user.destroy();

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
