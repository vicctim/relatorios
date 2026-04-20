import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models';
import { authenticateToken, generateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Senha é obrigatória'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      if (!user.active) {
        res.status(401).json({ error: 'Usuário inativo' });
        return;
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
      }

      const token = generateToken(user);

      res.json({
        token,
        user: user.toJSON(),
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ user: req.user?.toJSON() });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  // For JWT, logout is handled client-side by removing the token
  // This endpoint is just for consistency and could be used for token blacklisting in the future
  res.json({ message: 'Logout realizado com sucesso' });
});

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Senha atual é obrigatória'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Nova senha deve ter pelo menos 6 caracteres'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const user = req.user!;

      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Senha atual incorreta' });
        return;
      }

      user.password = newPassword;
      await user.save();

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

// POST /api/auth/api-key - Autenticação via API Key para automação (script BAT)
router.post(
  '/api-key',
  [body('apiKey').notEmpty().withMessage('API Key é obrigatória')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { apiKey } = req.body;
      const serverApiKey = process.env.API_KEY;

      if (!serverApiKey) {
        console.error('API_KEY not configured in environment');
        res.status(500).json({ error: 'API Key não configurada no servidor' });
        return;
      }

      if (apiKey !== serverApiKey) {
        res.status(401).json({ error: 'API Key inválida' });
        return;
      }

      // Find admin user to generate token
      const user = await User.findOne({ where: { email: 'admin@pixfilmes.com', active: true } });
      if (!user) {
        res.status(500).json({ error: 'Usuário admin não encontrado' });
        return;
      }

      const token = generateToken(user);

      res.json({
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (error) {
      console.error('API Key auth error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;
