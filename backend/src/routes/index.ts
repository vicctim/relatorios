import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import professionalsRoutes from './professionals.routes';
import settingsRoutes from './settings.routes';
import videosRoutes from './videos.routes';
import reportsRoutes from './reports.routes';
import logsRoutes from './logs.routes';
import notificationsRoutes from './notifications.routes';
import shareRoutes from './share.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/professionals', professionalsRoutes);
router.use('/settings', settingsRoutes);
router.use('/videos', videosRoutes);
router.use('/reports', reportsRoutes);
router.use('/logs', logsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/shares', shareRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
