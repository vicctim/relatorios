import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileVideo, TrendingUp, Calendar, Play, Download, Share2, Archive, Loader2 } from 'lucide-react';
import { reportsApi, videosApi } from '../services/api';
import { DashboardStats } from '../types';
import { formatDuration, formatDate, formatMonthYear } from '../utils/formatters';
import { LoadingSpinner } from '../components/ui';
import ShareModal from '../components/ShareModal';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Share state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareVideoIds, setShareVideoIds] = useState<number[]>([]);

  useEffect(() => {
    loadStats();
  }, [selectedMonth, selectedYear]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await reportsApi.getStats(selectedMonth, selectedYear);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!stats?.recentVideos.length) return;
    try {
      setIsDownloadingZip(true);
      const videoIds = stats.recentVideos.map(v => v.id);
      const response = await videosApi.downloadZip(videoIds);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `videos-${selectedMonth}-${selectedYear}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Error downloading zip:', error);
      toast.error('Erro ao baixar arquivo ZIP');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleShare = (ids: number[]) => {
    setShareVideoIds(ids);
    setIsShareModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  const usagePercentage = (stats.currentMonth.used / stats.currentMonth.limit) * 100;

  const currentYearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visão geral de {formatMonthYear(selectedMonth, selectedYear)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            {currentYearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tempo Utilizado */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tempo Utilizado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatDuration(stats.currentMonth.used)}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({Math.round(stats.currentMonth.used)}s)
                </span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Progresso</span>
              <span className="text-gray-700 dark:text-gray-300">
                {Math.round(usagePercentage)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${usagePercentage > 90
                  ? 'bg-red-500'
                  : usagePercentage > 75
                    ? 'bg-yellow-500'
                    : 'bg-primary-500'
                  }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Limite do Mês */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Limite do Mês</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatDuration(stats.currentMonth.limit)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          {stats.currentMonth.rollover > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              Inclui {formatDuration(stats.currentMonth.rollover)} de rollover
            </p>
          )}
        </div>

        {/* Tempo Restante */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tempo Restante</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatDuration(stats.currentMonth.remaining)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total de Vídeos */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de Vídeos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalVideos}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FileVideo className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {formatDuration(stats.totalDuration)} no total
          </p>
        </div>
      </div>

      {/* Videos List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vídeos ({stats.recentVideos.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip || !stats.recentVideos.length}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              Baixar ZIP
            </button>
            <button
              onClick={() => handleShare(stats.recentVideos.map(v => v.id))}
              disabled={!stats.recentVideos.length}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
          </div>
        </div>

        {stats.recentVideos.length === 0 ? (
          <div className="p-12 text-center">
            <FileVideo className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum vídeo encontrado neste mês</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentVideos.map((video) => (
              <div key={video.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-32 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                    {video.thumbnailPath ? (
                      <img
                        src={videosApi.getThumbnailUrl(video.id)}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${video.thumbnailPath ? 'hidden' : ''} flex items-center justify-center absolute inset-0`}>
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{video.resolutionLabel}</span>
                          <span>{formatDuration(video.durationSeconds)}</span>
                          <span>{formatDate(video.requestDate)}</span>
                        </div>
                        {video.professional && (
                          <p className="text-sm text-gray-400 mt-1">
                            Editor: {video.professional.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShare([video.id])}
                          className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Compartilhar"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <Link
                          to={`/videos/${video.id}`}
                          className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Visualizar"
                        >
                          <Play className="w-5 h-5" />
                        </Link>
                        <a
                          href={videosApi.getDownloadUrl(video.id)}
                          className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>

                    {/* Versions - Modern Card View */}
                    {video.versions && video.versions.length > 0 && (
                      <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                          <Archive className="w-3 h-3" />
                          Versões ({video.versions.length})
                        </p>
                        <div className="space-y-2">
                          {video.versions.map(version => (
                            <div key={version.id} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-3">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{version.resolutionLabel}</span>
                                <span className="text-gray-400 text-xs">{formatDuration(version.durationSeconds)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={videosApi.getDownloadUrl(version.id)}
                                  className="text-gray-500 hover:text-primary-600"
                                  title="Download Versão"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        videoIds={shareVideoIds}
      />
    </div>
  );
}
