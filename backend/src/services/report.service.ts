import { Op } from 'sequelize';
import { Video, Professional, Setting } from '../models';

interface MonthlyUsage {
  used: number;
  limit: number;
  remaining: number;
  rollover: number;
}

interface VideoWithCalculation {
  video: Video;
  calculatedDuration: number;
  versions: {
    video: Video;
    calculatedDuration: number;
  }[];
  totalDuration: number;
}

interface ReportData {
  month: number;
  year: number;
  usage: MonthlyUsage;
  videosByProfessional: {
    professional: Professional;
    videos: VideoWithCalculation[];
    totalDuration: number;
  }[];
  totalVideos: number;
  totalDuration: number;
}

class ReportService {
  /**
   * Get monthly usage with rollover calculation
   */
  async getMonthlyUsage(month: number, year: number): Promise<MonthlyUsage> {
    const baseLimit = await Setting.getValue<number>('monthly_limit_seconds', 1100);
    const rolloverMonths = await Setting.getValue<number>('rollover_months', 2);

    // Calculate rollover from previous months (only if rolloverMonths > 0)
    let rollover = 0;
    const effectiveRolloverMonths = rolloverMonths ?? 2;
    if (effectiveRolloverMonths > 0) {
      for (let i = 1; i <= effectiveRolloverMonths; i++) {
        let prevMonth = month - i;
        let prevYear = year;
        if (prevMonth <= 0) {
          prevMonth += 12;
          prevYear -= 1;
        }

        const prevUsage = await this.getMonthUsedSeconds(prevMonth, prevYear);
        const prevRemaining = (baseLimit ?? 1100) - prevUsage;
        if (prevRemaining > 0) {
          rollover += prevRemaining;
        }
      }
    }

    const used = await this.getMonthUsedSeconds(month, year);
    const limit = (baseLimit ?? 1100) + rollover;
    const remaining = Math.max(0, limit - used);

    return {
      used,
      limit,
      remaining,
      rollover,
    };
  }

  /**
   * Get total seconds used in a specific month
   */
  async getMonthUsedSeconds(month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // F-011: Filtrar apenas vídeos que devem ser incluídos no relatório
    const videos = await Video.findAll({
      where: {
        parentId: null, // Only parent videos
        includeInReport: true, // Only videos marked to include in report
        requestDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Video,
          as: 'versions',
          where: {
            includeInReport: true, // Versions também devem estar marcadas
          },
          required: false, // LEFT JOIN para incluir pais mesmo sem versões
        },
      ],
    });

    // Filtrar versões manualmente após a query (para garantir que apenas versões com includeInReport=true sejam contabilizadas)
    videos.forEach(video => {
      if (video.versions) {
        video.versions = video.versions.filter(v => v.includeInReport === true);
      }
    });

    let totalSeconds = 0;
    for (const video of videos) {
      // Parent video: usar customDurationSeconds se disponível, senão 100% da duração
      const parentDuration = video.customDurationSeconds !== null && video.customDurationSeconds !== undefined
        ? video.customDurationSeconds
        : video.durationSeconds;
      totalSeconds += parentDuration;

      // Versions: usar customDurationSeconds se disponível, senão 50% da duração
      if (video.versions) {
        for (const version of video.versions) {
          const versionDuration = version.customDurationSeconds !== null && version.customDurationSeconds !== undefined
            ? version.customDurationSeconds
            : version.durationSeconds * 0.5;
          totalSeconds += versionDuration;
        }
      }
    }

    return totalSeconds;
  }

  /**
   * Get full report data for a month
   */
  async getMonthlyReport(month: number, year: number): Promise<ReportData> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // F-011: Get all parent videos for the month that are included in reports
    const videos = await Video.findAll({
      where: {
        parentId: null,
        includeInReport: true, // Only videos marked to include in report
        requestDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: Professional, as: 'professional' },
        {
          model: Video,
          as: 'versions',
          where: {
            includeInReport: true, // Versions também devem estar marcadas
          },
          required: false, // LEFT JOIN
        },
      ],
      order: [
        ['professionalId', 'ASC'],
        ['requestDate', 'DESC'],
      ],
    });

    // Get all professionals that have videos this month
    const professionalIds = [...new Set(videos.map(v => v.professionalId))];
    const professionals = await Professional.findAll({
      where: { id: professionalIds },
      order: [['name', 'ASC']],
    });

    // Group videos by professional
    const videosByProfessional = professionals.map(professional => {
      const profVideos = videos.filter(v => v.professionalId === professional.id);

      const videosWithCalc: VideoWithCalculation[] = profVideos.map(video => {
        // Calcular duração do vídeo pai: usar customDurationSeconds se disponível, senão 100%
        const parentCalculatedDuration = video.customDurationSeconds !== null && video.customDurationSeconds !== undefined
          ? video.customDurationSeconds
          : video.durationSeconds;

        const versions = (video.versions || []).map(version => {
          // Calcular duração da versão: usar customDurationSeconds se disponível, senão 50%
          const versionCalculatedDuration = version.customDurationSeconds !== null && version.customDurationSeconds !== undefined
            ? version.customDurationSeconds
            : version.durationSeconds * 0.5;
          
          return {
            video: version,
            calculatedDuration: versionCalculatedDuration,
          };
        });

        const versionsDuration = versions.reduce((sum, v) => sum + v.calculatedDuration, 0);
        const totalDuration = parentCalculatedDuration + versionsDuration;

        return {
          video,
          calculatedDuration: parentCalculatedDuration,
          versions,
          totalDuration,
        };
      });

      const totalDuration = videosWithCalc.reduce((sum, v) => sum + v.totalDuration, 0);

      return {
        professional,
        videos: videosWithCalc,
        totalDuration,
      };
    });

    // Calculate totals - incluir versões na contagem
    let totalVideos = videos.length;
    // Adicionar versões à contagem
    for (const video of videos) {
      if (video.versions && video.versions.length > 0) {
        totalVideos += video.versions.length;
      }
    }
    const totalDuration = videosByProfessional.reduce((sum, p) => sum + p.totalDuration, 0);

    // Get usage info
    const usage = await this.getMonthlyUsage(month, year);

    return {
      month,
      year,
      usage,
      videosByProfessional,
      totalVideos,
      totalDuration,
    };
  }

  /**
   * Get report data for a date range
   */
  async getDateRangeReport(
    startDate: Date,
    endDate: Date,
    dateField: 'requestDate' | 'completionDate' = 'requestDate'
  ): Promise<{
    startDate: Date;
    endDate: Date;
    dateField: string;
    videosByProfessional: {
      professional: Professional;
      videos: VideoWithCalculation[];
      totalDuration: number;
    }[];
    totalVideos: number;
    totalDuration: number;
  }> {
    // F-011: Get all parent videos for the date range that are included in reports
    const videos = await Video.findAll({
      where: {
        parentId: null,
        includeInReport: true, // Only videos marked to include in report
        [dateField]: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: Professional, as: 'professional' },
        {
          model: Video,
          as: 'versions',
          where: {
            includeInReport: true, // Versions também devem estar marcadas
          },
          required: false, // LEFT JOIN
        },
      ],
      order: [
        ['professionalId', 'ASC'],
        [dateField, 'DESC'],
      ],
    });

    // Get all professionals that have videos in this range
    const professionalIds = [...new Set(videos.map(v => v.professionalId))];
    const professionals = await Professional.findAll({
      where: { id: professionalIds },
      order: [['name', 'ASC']],
    });

    // Group videos by professional
    const videosByProfessional = professionals.map(professional => {
      const profVideos = videos.filter(v => v.professionalId === professional.id);

      const videosWithCalc: VideoWithCalculation[] = profVideos.map(video => {
        // Calcular duração do vídeo pai: usar customDurationSeconds se disponível, senão 100%
        const parentCalculatedDuration = video.customDurationSeconds !== null && video.customDurationSeconds !== undefined
          ? video.customDurationSeconds
          : video.durationSeconds;

        const versions = (video.versions || []).map(version => {
          // Calcular duração da versão: usar customDurationSeconds se disponível, senão 50%
          const versionCalculatedDuration = version.customDurationSeconds !== null && version.customDurationSeconds !== undefined
            ? version.customDurationSeconds
            : version.durationSeconds * 0.5;
          
          return {
            video: version,
            calculatedDuration: versionCalculatedDuration,
          };
        });

        const versionsDuration = versions.reduce((sum, v) => sum + v.calculatedDuration, 0);
        const totalDuration = parentCalculatedDuration + versionsDuration;

        return {
          video,
          calculatedDuration: parentCalculatedDuration,
          versions,
          totalDuration,
        };
      });

      const totalDuration = videosWithCalc.reduce((sum, v) => sum + v.totalDuration, 0);

      return {
        professional,
        videos: videosWithCalc,
        totalDuration,
      };
    });

    // Calculate totals - incluir versões na contagem
    let totalVideos = videos.length;
    // Adicionar versões à contagem
    for (const video of videos) {
      if (video.versions && video.versions.length > 0) {
        totalVideos += video.versions.length;
      }
    }
    const totalDuration = videosByProfessional.reduce((sum, p) => sum + p.totalDuration, 0);

    return {
      startDate,
      endDate,
      dateField,
      videosByProfessional,
      totalVideos,
      totalDuration,
    };
  }

  /**
   * Get statistics for dashboard
   */
  async getDashboardStats(month?: number, year?: number): Promise<{
    currentMonth: MonthlyUsage;
    totalVideos: number;
    totalDuration: number;
    recentVideos: Video[];
  }> {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const currentMonth = await this.getMonthlyUsage(targetMonth, targetYear);

    const totalVideos = await Video.count({ where: { parentId: null } });

    const allVideos = await Video.findAll({
      where: { parentId: null },
      include: [{ model: Video, as: 'versions' }],
    });

    // F-010: Usar getCalculatedDuration() para considerar customDurationSeconds
    let totalDuration = 0;
    for (const video of allVideos) {
      totalDuration += video.getCalculatedDuration();
      if (video.versions) {
        totalDuration += video.versions.reduce((sum, v) => sum + v.getCalculatedDuration(), 0);
      }
    }

    // Filter videos by target month/year
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    // Set end of day for endDate
    endDate.setHours(23, 59, 59, 999);

    // F-011: Filtrar apenas vídeos incluídos no relatório
    const recentVideos = await Video.findAll({
      where: {
        parentId: null,
        includeInReport: true,
        requestDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: Professional, as: 'professional' },
        { 
          model: Video, 
          as: 'versions',
          where: {
            includeInReport: true,
          },
          required: false,
        },
      ],
      order: [['requestDate', 'DESC'], ['createdAt', 'DESC']],
    });

    return {
      currentMonth,
      totalVideos,
      totalDuration,
      recentVideos,
    };
  }
}

export default new ReportService();
