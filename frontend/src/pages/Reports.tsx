import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, Clock, Calendar, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { reportsApi } from '../services/api';
import { ReportData } from '../types';
import { formatMonthYear, formatDuration, formatDate, formatPercentage, formatTimeWithEmphasis } from '../utils/formatters';
import { LoadingSpinner, Modal } from '../components/ui';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';

export default function Reports() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | null>(null);
  const [exportEndDate, setExportEndDate] = useState<Date | null>(null);
  const [exportDateField, setExportDateField] = useState<'requestDate' | 'completionDate'>('requestDate');
  const [exportPreview, setExportPreview] = useState<{ totalVideos: number; totalDuration: number; parentVideosCount?: number; versionsCount?: number } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [manualRollover, setManualRollover] = useState<string>('');

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadReport();
    loadHistory();
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
        parentVideosCount: response.data.parentVideosCount,
        versionsCount: response.data.versionsCount,
      });
    } catch (error) {
      console.error('Error loading export preview:', error);
      setExportPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await reportsApi.getHistory();
      setHistory(response.data);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Erro ao carregar histórico de relatórios');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) {
      return;
    }

    setDeletingId(id);
    try {
      await reportsApi.deleteHistory(id);
      toast.success('Relatório excluído com sucesso');
      loadHistory();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Erro ao excluir relatório');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getReportTitle = (report: any) => {
    if (report.type === 'monthly') {
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      return `Relatório de ${monthNames[report.month - 1]} de ${report.year}`;
    } else {
      const start = new Date(report.startDate).toLocaleDateString('pt-BR');
      const end = new Date(report.endDate).toLocaleDateString('pt-BR');
      const fieldLabel = report.dateField === 'completionDate' ? 'Conclusão' : 'Solicitação';
      return `Relatório ${start} a ${end} (${fieldLabel})`;
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

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!exportStartDate || !exportEndDate || isExporting) return;

    setIsExporting(true);
    const startStr = exportStartDate.toISOString().split('T')[0];
    const endStr = exportEndDate.toISOString().split('T')[0];
    const rolloverValue = manualRollover.trim() ? parseInt(manualRollover.trim()) : undefined;
    const url = reportsApi.getExportPdfUrl(startStr, endStr, exportDateField, rolloverValue);
    
    // Abrir em nova aba
    window.open(url, '_blank');
    
    // Aguardar e recarregar histórico após o download ser iniciado
    setTimeout(() => {
      loadHistory();
      setIsExporting(false);
      setShowExportModal(false);
      setManualRollover(''); // Reset manual rollover
    }, 3000);
  };

  const openExportModal = () => {
    // Default to current month range
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setExportStartDate(firstDay);
    setExportEndDate(lastDay);
    setManualRollover(''); // Reset manual rollover
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Relatórios</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Visualize e exporte relatórios por período
        </p>
      </div>

      {/* Centered Month Navigation + Export */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-gray-200 dark:border-gray-700 shadow-md">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-2xl font-bold text-gray-900 dark:text-white min-w-[250px] text-center capitalize">
            {formatMonthYear(selectedMonth.month, selectedMonth.year)}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Próximo mês"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={openExportModal}
          className="btn-primary flex items-center gap-2 px-6 py-3 shadow-md"
        >
          <FileText className="w-5 h-5" />
          Exportar Relatório Personalizado
        </button>
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
                  <div className="mt-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatTimeWithEmphasis(report.usage.used).secondsOnly}
                    </span>
                    {formatTimeWithEmphasis(report.usage.used).timeFormatted && (
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                        ({formatTimeWithEmphasis(report.usage.used).timeFormatted})
                      </span>
                    )}
                  </div>
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
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Restante</p>
                  <div className="mt-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatTimeWithEmphasis(report.usage.remaining).secondsOnly}
                    </span>
                    {formatTimeWithEmphasis(report.usage.remaining).timeFormatted && (
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                        ({formatTimeWithEmphasis(report.usage.remaining).timeFormatted})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Limite</p>
                  <div className="mt-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatTimeWithEmphasis(report.usage.limit).secondsOnly}
                    </span>
                    {formatTimeWithEmphasis(report.usage.limit).timeFormatted && (
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                        ({formatTimeWithEmphasis(report.usage.limit).timeFormatted})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {report.usage.rollover > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  +{formatDuration(report.usage.rollover)} de rollover
                </p>
              )}
            </div>
          </div>

          {/* Generated Reports History */}
          <div className="card mt-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Histórico de Relatórios Exportados
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gerencie os relatórios que você já exportou
              </p>
            </div>

            <div className="p-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum relatório exportado ainda</p>
                  <p className="text-sm mt-2">
                    Os relatórios exportados aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {getReportTitle(report)}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(new Date(report.createdAt))}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(report.totalDuration)}
                              </span>
                              <span>{report.totalVideos} vídeo(s)</span>
                              <span>{formatFileSize(report.fileSize)}</span>
                              {report.exporter && (
                                <span className="text-gray-400 dark:text-gray-500">
                                  por {report.exporter.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <a
                          href={reportsApi.downloadHistory(report.id)}
                          download
                          className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Baixar relatório"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deletingId === report.id}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Excluir relatório"
                        >
                          {deletingId === report.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-500">Erro ao carregar relatório</p>
        </div>
      )}

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
                    onChange={(date: Date | null) => setExportStartDate(date)}
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
                    onChange={(date: Date | null) => setExportEndDate(date)}
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

          {/* Manual Rollover Input */}
          <div>
            <label className="label">
              Segundos Acumulados Manualmente (Opcional)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="input"
              placeholder="Ex: 500 (deixe vazio para usar cálculo automático)"
              value={manualRollover}
              onChange={(e) => setManualRollover(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Informe manualmente os segundos acumulados de meses anteriores. Se deixado vazio, será usado o cálculo automático baseado nos meses configurados.
            </p>
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
                      {exportPreview.parentVideosCount || exportPreview.totalVideos} vídeo{(exportPreview.parentVideosCount || exportPreview.totalVideos) !== 1 ? 's' : ''}
                      {exportPreview.versionsCount && exportPreview.versionsCount > 0 && (
                        <span className="text-sm font-normal text-primary-600 dark:text-primary-400 ml-1">
                          + {exportPreview.versionsCount} {exportPreview.versionsCount === 1 ? 'versão' : 'versões'}
                        </span>
                      )}
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
              disabled={!exportStartDate || !exportEndDate || !exportPreview || exportPreview.totalVideos === 0 || isExporting}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
