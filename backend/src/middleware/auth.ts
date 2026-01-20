import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';

interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: number;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    // Accept token from header OR query string (for video streaming/download)
    const token = (authHeader && authHeader.split(' ')[1]) || (req.query.token as string);

    if (!token) {
      res.status(401).json({ error: 'Token de acesso não fornecido' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.active) {
      res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
      return;
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expirado' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido', message: error.message });
      return;
    }
    res.status(500).json({ error: 'Erro na autenticação' });
  }
};

export const generateToken = (user: User): string => {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
      return;
    }

    next();
  };
};

// Shorthand middlewares for common role checks
export const adminOnly = authorize('admin');
export const editorOrAdmin = authorize('admin', 'editor');
export const anyAuthenticated = authorize('admin', 'editor', 'viewer');
