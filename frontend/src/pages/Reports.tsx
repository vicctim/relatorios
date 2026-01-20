import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Play, FileText, Clock, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { reportsApi, videosApi } from '../services/api';
import { ReportData } from '../types';
import { formatMonthYear, formatDuration, formatDate, formatPercentage } from '../utils/formatters';
import { LoadingSpinner, Modal } from '../components/ui';
import 'react-datepicker/dist/react-datepicker.css';

export default function Reports() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [previewVideo, setPreviewVideo] = useState<{ id: number; title: string } | null>(null);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | null>(null);
  const [exportEndDate, setExportEndDate] = useState<Date | null>(null);
  const [exportDateField, setExportDateField] = useState<'requestDate' | 'completionDate'>('requestDate');
  const [exportPreview, setExportPreview] = useState<{ totalVideos: number; totalDuration: number } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    loadReport();
  }, [selectedMonth]);

  // Load preview when dates change
  useEffect(() => {
    if (exportStartDate && exportEndDate) {
      loadExportPreview();
    } else {
      setExportPreview(null);
    }
  }, [exportStartDate, exportEndDate, exportDateField]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const response = await reportsApi.getMonthly(selectedMonth.year, selectedMonth.month);
      setReport(response.data);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExportPreview = async () => {
    if (!exportStartDate || !exportEndDate) return;

    setIsLoadingPreview(true);
    try {
      const startStr = exportStartDate.toISOString().split('T')[0];
      const endStr = exportEndDate.toISOString().split('T')[0];
      const response = await reportsApi.getExport(startStr, endStr, exportDateField);
      setExportPreview({
        totalVideos: response.data.totalVideos,
        totalDuration: response.data.totalDuration,
      });
    } catch (error) {
      console.error('Error loading export preview:', error);
      setExportPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      let newMonth = prev.month + (direction === 'next' ? 1 : -1);
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { month: newMonth, year: newYear };
    });
  };

  const handleExport = () => {
    if (!exportStartDate || !exportEndDate) return;

    const startStr = exportStartDate.toISOString().split('T')[0];
    const endStr = exportEndDate.toISOString().split('T')[0];
    const url = reportsApi.getExportPdfUrl(startStr, endStr, exportDateField);
    window.open(url, '_blank');
  };

  const openExportModal = () => {
    // Default to current month range
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setExportStartDate(firstDay);
    setExportEndDate(lastDay);
    setShowExportModal(true);
  };

  const usagePercentage = report
    ? (report.usage.used / report.usage.limit) * 100
    : 0;

  const formatDateBR = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visualize os vídeos por mês
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Export Button */}
          <button
            onClick={openExportModal}
            className="btn-primary flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Exportar Relatório
          </button>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="btn-ghost p-2"
              title="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-medium text-gray-900 dark:text-white min-w-[200px] text-center capitalize">
              {formatMonthYear(selectedMonth.month, selectedMonth.year)}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="btn-ghost p-2"
              title="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : report ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Utilizado</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatDuration(report.usage.used)}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${usagePercentage > 90
                        ? 'bg-red-500'
                        : usagePercentage > 75
                          ? 'bg-yellow-500'
                          : 'bg-primary-500'
                      }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatPercentage(report.usage.used, report.usage.limit)} do limite
                </p>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Limite</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatDuration(report.usage.limit)}
                  </p>
                </div>
              </div>
              {report.usage.rollover > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  +{formatDuration(report.usage.rollover)} de rollover
                </p>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Restante</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatDuration(report.usage.remaining)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Videos List */}
          {report.videosByProfessional.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum vídeo neste mês</p>
            </div>
          ) : (
            <div className="card">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {report.videosByProfessional.flatMap(({ videos }) =>
                  videos.map(({ video, versions, totalDuration: videoDuration }) => (
                    <div key={video.id} className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Preview thumbnail */}
                        <button
                          onClick={() => setPreviewVideo({ id: video.id, title: video.title })}
                          className="w-24 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors relative overflow-hidden group"
                        >
                          <img
                            src={videosApi.getThumbnailUrl(video.id)}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        </button>

                        {/* Video info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {video.title}
                          </h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                            <span>{video.resolutionLabel}</span>
                            <span>{formatDuration(video.durationSeconds)}</span>
                            <span>Solicitado: {formatDate(video.requestDate)}</span>
                            <span>Concluído: {formatDate(video.completionDate)}</span>
                          </div>
                          {video.isTv && video.tvTitle && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                              TV: {video.tvTitle}
                            </p>
                          )}

                          {/* Total */}
                          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total contabilizado: {formatDuration(videoDuration)}
                            {versions.length > 0 && (
                              <span className="ml-2 text-green-600 dark:text-green-400">
                                (+ {formatDuration(versions.reduce((sum, v) => sum + v.calculatedDuration, 0))} de {versions.length} versã{versions.length === 1 ? 'o' : 'ões'})
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <a
                            href={videosApi.getDownloadUrl(video.id)}
                            className="btn-ghost p-2"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-500">Erro ao carregar relatório</p>
        </div>
      )}

      {/* Video Preview Modal */}
      <Modal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        title={previewVideo?.title}
        size="xl"
      >
        {previewVideo && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={videosApi.getStreamUrl(previewVideo.id)}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exportar Relatório"
        size="lg"
      >
        <div className="space-y-6">
          {/* Date Field Selector */}
          <div>
            <label className="label">Filtrar por</label>
            <select
              className="input"
              value={exportDateField}
              onChange={(e) => setExportDateField(e.target.value as 'requestDate' | 'completionDate')}
            >
              <option value="requestDate">Data de Solicitação</option>
              <option value="completionDate">Data de Conclusão</option>
            </select>
          </div>

          {/* Date Range Picker */}
          <div>
            <label className="label">Período</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm text-gray-500 mb-1 block">Data Inicial</label>
                <div className="relative">
                  <DatePicker
                    selected={exportStartDate}
                    onChange={(date) => setExportStartDate(date)}
                    selectsStart
                    startDate={exportStartDate}
                    endDate={exportEndDate}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    className="input w-full"
                    placeholderText="DD/MM/AAAA"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-500 mb-1 block">Data Final</label>
                <div className="relative">
                  <DatePicker
                    selected={exportEndDate}
                    onChange={(date) => setExportEndDate(date)}
                    selectsEnd
                    startDate={exportStartDate}
                    endDate={exportEndDate}
                    minDate={exportStartDate || undefined}
                    dateFormat="dd/MM/yyyy"
                    locale={ptBR}
                    className="input w-full"
                    placeholderText="DD/MM/AAAA"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {exportStartDate && exportEndDate && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período selecionado
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDateBR(exportStartDate)} a {formatDateBR(exportEndDate)}
              </p>
              {isLoadingPreview ? (
                <div className="flex items-center gap-2 mt-2">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-500">Carregando...</span>
                </div>
              ) : exportPreview && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">Vídeos encontrados</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {exportPreview.totalVideos}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">Duração total</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatDuration(exportPreview.totalDuration)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowExportModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={!exportStartDate || !exportEndDate || !exportPreview || exportPreview.totalVideos === 0}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Exportar PDF
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
