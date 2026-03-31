import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { initDatabase } from './models';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting (more permissive in development)
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15m)
  max: 5000, // Increased substantially for internal usage
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
  skip: () => isDev, // Skip rate limiting entirely in development
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Static files for reports
app.use('/uploads/reports', express.static(path.join(__dirname, '../uploads/reports')));

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande' });
    }
    return res.status(400).json({ error: 'Erro no upload do arquivo' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database (set to true to reset DB on first run)
    const forceSync = process.env.DB_FORCE_SYNC === 'true';
    await initDatabase(forceSync);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
