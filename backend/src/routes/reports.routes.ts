import { Router, Request, Response } from 'express';
import { authenticateToken, anyAuthenticated } from '../middleware/auth';
import reportService from '../services/report.service';
import pdfService from '../services/pdf.service';
import { DownloadLog, Video, User } from '../models';

const router = Router();

// GET /api/reports/export - Export report by date range (must come before :year/:month)
router.get('/export', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, dateField = 'requestDate' } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
      return;
    }

    // Parse dates (expecting YYYY-MM-DD format)
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Formato de data inválido' });
      return;
    }

    if (start > end) {
      res.status(400).json({ error: 'Data inicial deve ser anterior à data final' });
      return;
    }

    const validDateFields = ['requestDate', 'completionDate'];
    const field = validDateFields.includes(dateField as string)
      ? (dateField as 'requestDate' | 'completionDate')
      : 'requestDate';

    const report = await reportService.getDateRangeReport(start, end, field);
    res.json(report);
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório' });
  }
});

// GET /api/reports/export/pdf - Generate PDF report by date range
router.get('/export/pdf', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, dateField = 'requestDate' } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
      return;
    }

    // Parse dates
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Formato de data inválido' });
      return;
    }

    if (start > end) {
      res.status(400).json({ error: 'Data inicial deve ser anterior à data final' });
      return;
    }

    const validDateFields = ['requestDate', 'completionDate'];
    const field = validDateFields.includes(dateField as string)
      ? (dateField as 'requestDate' | 'completionDate')
      : 'requestDate';

    const report = await reportService.getDateRangeReport(start, end, field);

    const pdfData = {
      startDate: start,
      endDate: end,
      dateField: field,
      professionals: report.videosByProfessional.map((prof: any) => ({
        name: prof.professional.name,
        videos: prof.videos.map((v: any) => ({
          id: v.video.id,
          title: v.video.title,
          resolutionLabel: v.video.resolutionLabel,
          durationSeconds: v.video.durationSeconds,
          requestDate: v.video.requestDate,
          completionDate: v.video.completionDate,
          isTv: v.video.isTv,
          tvTitle: v.video.tvTitle,
          versions: v.versions.map((ver: any) => ({
            id: ver.video.id,
            title: ver.video.title,
            resolutionLabel: ver.video.resolutionLabel,
            durationSeconds: ver.video.durationSeconds,
            calculatedDuration: ver.calculatedDuration,
          })),
          calculatedDuration: v.calculatedDuration,
          totalDuration: v.totalDuration,
        })),
        totalDuration: prof.totalDuration,
      })),
      totalUsed: report.totalDuration,
      totalVideos: report.totalVideos,
    };

    const pdfBuffer = await pdfService.generateDateRangeReportPDF(pdfData);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const filename = `relatorio-${formatDate(start)}-a-${formatDate(end)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate date range PDF error:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

// GET /api/reports/stats - Dashboard statistics
router.get('/stats', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;
    const parsedMonth = month ? parseInt(month as string) : undefined;
    const parsedYear = year ? parseInt(year as string) : undefined;

    const stats = await reportService.getDashboardStats(parsedMonth, parsedYear);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/:year/:month - Monthly report data
router.get('/:year/:month', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ error: 'Mês ou ano inválido' });
      return;
    }

    const report = await reportService.getMonthlyReport(month, year);
    res.json(report);
  } catch (error) {
    console.error('Get monthly report error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/:year/:month/usage - Monthly usage only
router.get('/:year/:month/usage', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ error: 'Mês ou ano inválido' });
      return;
    }

    const usage = await reportService.getMonthlyUsage(month, year);
    res.json(usage);
  } catch (error) {
    console.error('Get monthly usage error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/:year/:month/pdf - Generate PDF report
router.get('/:year/:month/pdf', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ error: 'Mês ou ano inválido' });
      return;
    }

    const report = await reportService.getMonthlyReport(month, year);
    const usage = await reportService.getMonthlyUsage(month, year);

    const pdfData = {
      month,
      year,
      professionals: report.videosByProfessional.map((prof: any) => ({
        name: prof.professional.name,
        videos: prof.videos.map((v: any) => ({
          id: v.video.id,
          title: v.video.title,
          resolutionLabel: v.video.resolutionLabel,
          durationSeconds: v.video.durationSeconds,
          requestDate: v.video.requestDate,
          completionDate: v.video.completionDate,
          isTv: v.video.isTv,
          tvTitle: v.video.tvTitle,
          versions: v.versions.map((ver: any) => ({
            id: ver.video.id,
            title: ver.video.title,
            resolutionLabel: ver.video.resolutionLabel,
            durationSeconds: ver.video.durationSeconds,
            calculatedDuration: ver.calculatedDuration,
          })),
          calculatedDuration: v.calculatedDuration,
          totalDuration: v.totalDuration,
        })),
        totalDuration: prof.totalDuration,
      })),
      totalUsed: usage.used,
      limit: usage.limit,
      rollover: usage.rollover,
      remaining: usage.remaining,
    };

    const pdfBuffer = await pdfService.generateReportPDF(pdfData);

    const monthNames = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const filename = `relatorio-${monthNames[month - 1]}-${year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

export default router;
