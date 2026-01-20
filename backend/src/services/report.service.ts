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

    const videos = await Video.findAll({
      where: {
        parentId: null, // Only parent videos
        requestDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Video,
          as: 'versions',
        },
      ],
    });

    let totalSeconds = 0;
    for (const video of videos) {
      // Parent video counts 100%
      totalSeconds += video.durationSeconds;

      // Versions count 50%
      if (video.versions) {
        for (const version of video.versions) {
          totalSeconds += version.durationSeconds * 0.5;
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

    // Get all parent videos for the month
    const videos = await Video.findAll({
      where: {
        parentId: null,
        requestDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: Professional, as: 'professional' },
        {
          model: Video,
          as: 'versions',
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
        const versions = (video.versions || []).map(version => ({
          video: version,
          calculatedDuration: version.durationSeconds * 0.5,
        }));

        const versionsDuration = versions.reduce((sum, v) => sum + v.calculatedDuration, 0);
        const totalDuration = video.durationSeconds + versionsDuration;

        return {
          video,
          calculatedDuration: video.durationSeconds,
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

    // Calculate totals
    const totalVideos = videos.length;
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
    // Get all parent videos for the date range
    const videos = await Video.findAll({
      where: {
        parentId: null,
        [dateField]: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: Professional, as: 'professional' },
        {
          model: Video,
          as: 'versions',
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
        const versions = (video.versions || []).map(version => ({
          video: version,
          calculatedDuration: version.durationSeconds * 0.5,
        }));

        const versionsDuration = versions.reduce((sum, v) => sum + v.calculatedDuration, 0);
        const totalDuration = video.durationSeconds + versionsDuration;

        return {
          video,
          calculatedDuration: video.durationSeconds,
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

    // Calculate totals
    const totalVideos = videos.length;
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

    let totalDuration = 0;
    for (const video of allVideos) {
      totalDuration += video.durationSeconds;
      if (video.versions) {
        totalDuration += video.versions.reduce((sum, v) => sum + v.durationSeconds * 0.5, 0);
      }
    }

    // Filter videos by target month/year
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    // Set end of day for endDate
    endDate.setHours(23, 59, 59, 999);

    const recentVideos = await Video.findAll({
      where: {
        parentId: null,
        requestDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        { model: Professional, as: 'professional' },
        { model: Video, as: 'versions' },
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
