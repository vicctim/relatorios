import { Router, Request, Response } from 'express';
import { authenticateToken, anyAuthenticated } from '../middleware/auth';
import reportService from '../services/report.service';
import pdfService from '../services/pdf.service';
import { DownloadLog, Video, User, ExportedReport, Setting } from '../models';
import { directories } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET /api/reports/export - Export report by date range (must come before :year/:month)
router.get('/export', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, dateField = 'requestDate' } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
      return;
    }

    // Parse dates (expecting YYYY-MM-DD format) - tratar como datas locais
    const parseLocalDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month é 0-indexed
      return date;
    };

    const start = parseLocalDate(startDate as string);
    start.setHours(0, 0, 0, 0); // Início do dia

    const end = parseLocalDate(endDate as string);
    end.setHours(23, 59, 59, 999); // Fim do dia

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
    
    // Contar vídeos pais e versões separadamente
    let parentVideosCount = 0;
    let versionsCount = 0;
    for (const prof of report.videosByProfessional) {
      for (const v of prof.videos) {
        parentVideosCount++;
        if (v.versions && v.versions.length > 0) {
          versionsCount += v.versions.length;
        }
      }
    }
    
    res.json({
      ...report,
      parentVideosCount,
      versionsCount,
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Erro ao exportar relatório' });
  }
});

// GET /api/reports/export/pdf - Generate PDF report by date range
router.get('/export/pdf', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, dateField = 'requestDate', manualRollover } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Data inicial e final são obrigatórias' });
      return;
    }

    // Parse dates (expecting YYYY-MM-DD format) - tratar como datas locais
    const parseLocalDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month é 0-indexed
      return date;
    };

    const start = parseLocalDate(startDate as string);
    start.setHours(0, 0, 0, 0); // Início do dia

    const end = parseLocalDate(endDate as string);
    end.setHours(23, 59, 59, 999); // Fim do dia

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

    // Contar vídeos pais e versões separadamente
    let parentVideosCount = 0;
    let versionsCount = 0;
    for (const prof of report.videosByProfessional) {
      for (const v of prof.videos) {
        parentVideosCount++;
        if (v.versions && v.versions.length > 0) {
          versionsCount += v.versions.length;
        }
      }
    }

    // Calcular limite com rollover manual se fornecido
    const baseLimit = await Setting.getValue<number>('monthly_limit_seconds', 1100);
    const manualRolloverValue = manualRollover ? parseInt(manualRollover as string) : undefined;
    const rollover = manualRolloverValue !== undefined && !isNaN(manualRolloverValue) ? manualRolloverValue : 0;
    const limit = baseLimit + rollover;
    const remaining = Math.max(0, limit - report.totalDuration);

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
      parentVideosCount,
      versionsCount,
      limit,
      rollover,
      remaining,
    };

    const pdfBuffer = await pdfService.generateDateRangeReportPDF(pdfData);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const filename = `relatorio-${formatDate(start)}-a-${formatDate(end)}.pdf`;
    const filePath = path.join(directories.reports, filename);

    // Verificar se já existe um relatório com os mesmos parâmetros (evitar duplicatas)
    const existingReport = await ExportedReport.findOne({
      where: {
        type: 'dateRange',
        startDate: start,
        endDate: end,
        dateField: field,
        exportedBy: req.user!.id,
      },
      order: [['createdAt', 'DESC']],
    });

    // Se já existe e foi criado há menos de 5 segundos, retornar o existente
    if (existingReport && existingReport.createdAt) {
      const timeDiff = Date.now() - new Date(existingReport.createdAt).getTime();
      if (timeDiff < 5000) {
        // Retornar o PDF existente
        const existingFilePath = path.isAbsolute(existingReport.filePath)
          ? existingReport.filePath
          : path.join(process.cwd(), existingReport.filePath);
        
        if (fs.existsSync(existingFilePath)) {
          const existingBuffer = fs.readFileSync(existingFilePath);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.setHeader('Content-Length', existingBuffer.length);
          res.send(existingBuffer);
          return;
        }
      }
    }

    // Save PDF to disk
    fs.writeFileSync(filePath, pdfBuffer);

    // Save to database (apenas se não existir duplicata recente)
    if (!existingReport || (existingReport.createdAt && Date.now() - new Date(existingReport.createdAt).getTime() >= 5000)) {
      await ExportedReport.create({
        type: 'dateRange',
        startDate: start,
        endDate: end,
        dateField: field,
        filename,
        filePath: `/uploads/reports/${filename}`,
        fileSize: pdfBuffer.length,
        totalVideos: report.totalVideos,
        totalDuration: report.totalDuration,
        exportedBy: req.user!.id,
      });
    }

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
    const filePath = path.join(directories.reports, filename);

    // Verificar se já existe um relatório com os mesmos parâmetros (evitar duplicatas)
    const existingReport = await ExportedReport.findOne({
      where: {
        type: 'monthly',
        month,
        year,
        exportedBy: req.user!.id,
      },
      order: [['createdAt', 'DESC']],
    });

    // Se já existe e foi criado há menos de 5 segundos, retornar o existente
    if (existingReport && existingReport.createdAt) {
      const timeDiff = Date.now() - new Date(existingReport.createdAt).getTime();
      if (timeDiff < 5000) {
        // Retornar o PDF existente
        const existingFilePath = path.isAbsolute(existingReport.filePath)
          ? existingReport.filePath
          : path.join(process.cwd(), existingReport.filePath);
        
        if (fs.existsSync(existingFilePath)) {
          const existingBuffer = fs.readFileSync(existingFilePath);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.setHeader('Content-Length', existingBuffer.length);
          res.send(existingBuffer);
          return;
        }
      }
    }

    // Save PDF to disk
    fs.writeFileSync(filePath, pdfBuffer);

    // Save to database (apenas se não existir duplicata recente)
    if (!existingReport || (existingReport.createdAt && Date.now() - new Date(existingReport.createdAt).getTime() >= 5000)) {
      await ExportedReport.create({
        type: 'monthly',
        month,
        year,
        filename,
        filePath: `/uploads/reports/${filename}`,
        fileSize: pdfBuffer.length,
        totalVideos: report.totalVideos,
        totalDuration: report.totalDuration,
        exportedBy: req.user!.id,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

// GET /api/reports/history - List all exported reports
router.get('/history', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await ExportedReport.findAll({
      include: [
        {
          model: User,
          as: 'exporter',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(reports);
  } catch (error) {
    console.error('Get reports history error:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de relatórios' });
  }
});

// GET /api/reports/history/:id - Get specific exported report
router.get('/history/:id', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const report = await ExportedReport.findByPk(id, {
      include: [
        {
          model: User,
          as: 'exporter',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!report) {
      res.status(404).json({ error: 'Relatório não encontrado' });
      return;
    }

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório' });
  }
});

// GET /api/reports/history/:id/download - Download exported report PDF
router.get('/history/:id/download', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const report = await ExportedReport.findByPk(id);
    if (!report) {
      res.status(404).json({ error: 'Relatório não encontrado' });
      return;
    }

    const fullPath = path.isAbsolute(report.filePath)
      ? report.filePath
      : path.join(process.cwd(), report.filePath);

    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Arquivo PDF não encontrado' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Erro ao baixar relatório' });
  }
});

// DELETE /api/reports/history/:id - Delete exported report
router.delete('/history/:id', authenticateToken, anyAuthenticated, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const report = await ExportedReport.findByPk(id);
    if (!report) {
      res.status(404).json({ error: 'Relatório não encontrado' });
      return;
    }

    // Delete file from disk
    const fullPath = path.isAbsolute(report.filePath)
      ? report.filePath
      : path.join(process.cwd(), report.filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete from database
    await report.destroy();

    res.json({ message: 'Relatório excluído com sucesso' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Erro ao excluir relatório' });
  }
});

export default router;
