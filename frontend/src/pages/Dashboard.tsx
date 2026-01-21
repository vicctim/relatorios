import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileVideo, TrendingUp, Calendar, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { reportsApi, sharesApi } from '../services/api';
import { DashboardStats } from '../types';
import { formatMonthYear, formatTimeWithEmphasis } from '../utils/formatters';
import { LoadingSpinner } from '../components/ui';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalShares, setTotalShares] = useState(0);

  useEffect(() => {
    loadStats();
    loadShares();
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

  const loadShares = async () => {
    try {
      const response = await sharesApi.list();
      setTotalShares(response.data.length);
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = selectedMonth + (direction === 'next' ? 1 : -1);
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Month Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visão geral de {formatMonthYear(selectedMonth, selectedYear)}
          </p>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium text-gray-900 dark:text-white min-w-[180px] text-center capitalize">
            {formatMonthYear(selectedMonth, selectedYear)}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tempo Utilizado */}
        <div className="card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tempo Utilizado</p>
          <div className="mb-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatTimeWithEmphasis(stats.currentMonth.used).secondsOnly}
            </span>
            {formatTimeWithEmphasis(stats.currentMonth.used).timeFormatted && (
              <span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({formatTimeWithEmphasis(stats.currentMonth.used).timeFormatted})
              </span>
            )}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Progresso</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
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
        <div className="card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Limite do Mês</p>
          <div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatTimeWithEmphasis(stats.currentMonth.limit).secondsOnly}
            </span>
            {formatTimeWithEmphasis(stats.currentMonth.limit).timeFormatted && (
              <span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({formatTimeWithEmphasis(stats.currentMonth.limit).timeFormatted})
              </span>
            )}
          </div>
        </div>

        {/* Tempo Restante */}
        <div className="card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tempo Restante</p>
          <div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatTimeWithEmphasis(stats.currentMonth.remaining).secondsOnly}
            </span>
            {formatTimeWithEmphasis(stats.currentMonth.remaining).timeFormatted && (
              <span className="text-base font-normal text-gray-500 dark:text-gray-400 ml-2">
                ({formatTimeWithEmphasis(stats.currentMonth.remaining).timeFormatted})
              </span>
            )}
          </div>
        </div>

        {/* Total de Vídeos */}
        <Link to="/videos" className="card p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileVideo className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Vídeos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.totalVideos}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Clique para ver todos
          </p>
        </Link>

        {/* Compartilhamentos */}
        <Link to="/shares" className="card p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Compartilhamentos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalShares}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Links criados
          </p>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/videos"
          className="card p-6 hover:shadow-lg transition-all duration-300 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileVideo className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Gerenciar Vídeos</h3>
            <p className="text-sm text-gray-500">Ver, editar e compartilhar</p>
          </div>
        </Link>

        <Link
          to="/reports"
          className="card p-6 hover:shadow-lg transition-all duration-300 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Relatórios</h3>
            <p className="text-sm text-gray-500">Visualizar e exportar</p>
          </div>
        </Link>

        <Link
          to="/shares"
          className="card p-6 hover:shadow-lg transition-all duration-300 group flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Share2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Compartilhamentos</h3>
            <p className="text-sm text-gray-500">Gerenciar links</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
