import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, Clock, Calendar, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { reportsApi } from '../services/api';
import { formatMonthYear, formatDuration, formatDate, formatPercentage, formatTimeWithEmphasis } from '../utils/formatters';
import { LoadingSpinner, Modal } from '../components/ui';
import toast from 'react-hot-toast';
import 'react-datepicker/dist/react-datepicker.css';
export default function Reports() {
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return { month: now.getMonth() + 1, year: now.getFullYear() };
    });
    // Export modal state
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState(null);
    const [exportEndDate, setExportEndDate] = useState(null);
    const [exportDateField, setExportDateField] = useState('requestDate');
    const [exportPreview, setExportPreview] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    // History state
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    useEffect(() => {
        loadReport();
        loadHistory();
    }, [selectedMonth]);
    // Load preview when dates change
    useEffect(() => {
        if (exportStartDate && exportEndDate) {
            loadExportPreview();
        }
        else {
            setExportPreview(null);
        }
    }, [exportStartDate, exportEndDate, exportDateField]);
    const loadReport = async () => {
        setIsLoading(true);
        try {
            const response = await reportsApi.getMonthly(selectedMonth.year, selectedMonth.month);
            setReport(response.data);
        }
        catch (error) {
            console.error('Error loading report:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const loadExportPreview = async () => {
        if (!exportStartDate || !exportEndDate)
            return;
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
        }
        catch (error) {
            console.error('Error loading export preview:', error);
            setExportPreview(null);
        }
        finally {
            setIsLoadingPreview(false);
        }
    };
    const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const response = await reportsApi.getHistory();
            setHistory(response.data);
        }
        catch (error) {
            console.error('Error loading history:', error);
            toast.error('Erro ao carregar histórico de relatórios');
        }
        finally {
            setIsLoadingHistory(false);
        }
    };
    const handleDeleteReport = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este relatório?')) {
            return;
        }
        setDeletingId(id);
        try {
            await reportsApi.deleteHistory(id);
            toast.success('Relatório excluído com sucesso');
            loadHistory();
        }
        catch (error) {
            console.error('Error deleting report:', error);
            toast.error('Erro ao excluir relatório');
        }
        finally {
            setDeletingId(null);
        }
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };
    const getReportTitle = (report) => {
        if (report.type === 'monthly') {
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            return `Relatório de ${monthNames[report.month - 1]} de ${report.year}`;
        }
        else {
            const start = new Date(report.startDate).toLocaleDateString('pt-BR');
            const end = new Date(report.endDate).toLocaleDateString('pt-BR');
            const fieldLabel = report.dateField === 'completionDate' ? 'Conclusão' : 'Solicitação';
            return `Relatório ${start} a ${end} (${fieldLabel})`;
        }
    };
    const navigateMonth = (direction) => {
        setSelectedMonth((prev) => {
            let newMonth = prev.month + (direction === 'next' ? 1 : -1);
            let newYear = prev.year;
            if (newMonth > 12) {
                newMonth = 1;
                newYear++;
            }
            else if (newMonth < 1) {
                newMonth = 12;
                newYear--;
            }
            return { month: newMonth, year: newYear };
        });
    };
    const [isExporting, setIsExporting] = useState(false);
    const handleExport = () => {
        if (!exportStartDate || !exportEndDate || isExporting)
            return;
        setIsExporting(true);
        const startStr = exportStartDate.toISOString().split('T')[0];
        const endStr = exportEndDate.toISOString().split('T')[0];
        const url = reportsApi.getExportPdfUrl(startStr, endStr, exportDateField);
        // Abrir em nova aba
        window.open(url, '_blank');
        // Aguardar e recarregar histórico após o download ser iniciado
        setTimeout(() => {
            loadHistory();
            setIsExporting(false);
            setShowExportModal(false);
        }, 3000);
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
    const formatDateBR = (date) => {
        if (!date)
            return '';
        return date.toLocaleDateString('pt-BR');
    };
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white text-center", children: "Relat\u00F3rios" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-center", children: "Visualize e exporte relat\u00F3rios por per\u00EDodo" })] }), _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-gray-200 dark:border-gray-700 shadow-md", children: [_jsx("button", { onClick: () => navigateMonth('prev'), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", title: "M\u00EAs anterior", children: _jsx(ChevronLeft, { className: "w-6 h-6" }) }), _jsx("span", { className: "text-2xl font-bold text-gray-900 dark:text-white min-w-[250px] text-center capitalize", children: formatMonthYear(selectedMonth.month, selectedMonth.year) }), _jsx("button", { onClick: () => navigateMonth('next'), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Pr\u00F3ximo m\u00EAs", children: _jsx(ChevronRight, { className: "w-6 h-6" }) })] }), _jsxs("button", { onClick: openExportModal, className: "btn-primary flex items-center gap-2 px-6 py-3 shadow-md", children: [_jsx(FileText, { className: "w-5 h-5" }), "Exportar Relat\u00F3rio Personalizado"] })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) })) : report ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "card p-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center", children: _jsx(Clock, { className: "w-6 h-6 text-primary-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Utilizado" }), _jsxs("div", { className: "mt-1", children: [_jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: formatTimeWithEmphasis(report.usage.used).secondsOnly }), formatTimeWithEmphasis(report.usage.used).timeFormatted && (_jsxs("span", { className: "text-sm font-normal text-gray-500 dark:text-gray-400 ml-2", children: ["(", formatTimeWithEmphasis(report.usage.used).timeFormatted, ")"] }))] })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${usagePercentage > 90
                                                        ? 'bg-red-500'
                                                        : usagePercentage > 75
                                                            ? 'bg-yellow-500'
                                                            : 'bg-primary-500'}`, style: { width: `${Math.min(usagePercentage, 100)}%` } }) }), _jsxs("p", { className: "text-sm text-gray-500 mt-1", children: [formatPercentage(report.usage.used, report.usage.limit), " do limite"] })] })] }), _jsx("div", { className: "card p-6", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center", children: _jsx(Clock, { className: "w-6 h-6 text-green-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Restante" }), _jsxs("div", { className: "mt-1", children: [_jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: formatTimeWithEmphasis(report.usage.remaining).secondsOnly }), formatTimeWithEmphasis(report.usage.remaining).timeFormatted && (_jsxs("span", { className: "text-sm font-normal text-gray-500 dark:text-gray-400 ml-2", children: ["(", formatTimeWithEmphasis(report.usage.remaining).timeFormatted, ")"] }))] })] })] }) }), _jsxs("div", { className: "card p-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center", children: _jsx(FileText, { className: "w-6 h-6 text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: "Limite" }), _jsxs("div", { className: "mt-1", children: [_jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: formatTimeWithEmphasis(report.usage.limit).secondsOnly }), formatTimeWithEmphasis(report.usage.limit).timeFormatted && (_jsxs("span", { className: "text-sm font-normal text-gray-500 dark:text-gray-400 ml-2", children: ["(", formatTimeWithEmphasis(report.usage.limit).timeFormatted, ")"] }))] })] })] }), report.usage.rollover > 0 && (_jsxs("p", { className: "mt-4 text-sm text-gray-500", children: ["+", formatDuration(report.usage.rollover), " de rollover"] }))] })] }), _jsxs("div", { className: "card mt-8", children: [_jsxs("div", { className: "p-6 border-b border-gray-200 dark:border-gray-700", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Hist\u00F3rico de Relat\u00F3rios Exportados" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-1", children: "Gerencie os relat\u00F3rios que voc\u00EA j\u00E1 exportou" })] }), _jsx("div", { className: "p-6", children: isLoadingHistory ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(LoadingSpinner, { size: "lg" }) })) : history.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-500 dark:text-gray-400", children: [_jsx(FileText, { className: "w-16 h-16 mx-auto mb-4 opacity-50" }), _jsx("p", { className: "text-lg font-medium", children: "Nenhum relat\u00F3rio exportado ainda" }), _jsx("p", { className: "text-sm mt-2", children: "Os relat\u00F3rios exportados aparecer\u00E3o aqui" })] })) : (_jsx("div", { className: "space-y-3", children: history.map((report) => (_jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors", children: [_jsx("div", { className: "flex-1 min-w-0", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(FileText, { className: "w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 dark:text-white truncate", children: getReportTitle(report) }), _jsxs("div", { className: "flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3 h-3" }), formatDate(new Date(report.createdAt))] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), formatDuration(report.totalDuration)] }), _jsxs("span", { children: [report.totalVideos, " v\u00EDdeo(s)"] }), _jsx("span", { children: formatFileSize(report.fileSize) }), report.exporter && (_jsxs("span", { className: "text-gray-400 dark:text-gray-500", children: ["por ", report.exporter.name] }))] })] })] }) }), _jsxs("div", { className: "flex items-center gap-2 ml-4", children: [_jsx("a", { href: reportsApi.downloadHistory(report.id), download: true, className: "p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors", title: "Baixar relat\u00F3rio", children: _jsx(Download, { className: "w-5 h-5" }) }), _jsx("button", { onClick: () => handleDeleteReport(report.id), disabled: deletingId === report.id, className: "p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50", title: "Excluir relat\u00F3rio", children: deletingId === report.id ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsx(Trash2, { className: "w-5 h-5" })) })] })] }, report.id))) })) })] })] })) : (_jsx("div", { className: "card p-12 text-center", children: _jsx("p", { className: "text-gray-500", children: "Erro ao carregar relat\u00F3rio" }) })), _jsx(Modal, { isOpen: showExportModal, onClose: () => setShowExportModal(false), title: "Exportar Relat\u00F3rio", size: "lg", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Filtrar por" }), _jsxs("select", { className: "input", value: exportDateField, onChange: (e) => setExportDateField(e.target.value), children: [_jsx("option", { value: "requestDate", children: "Data de Solicita\u00E7\u00E3o" }), _jsx("option", { value: "completionDate", children: "Data de Conclus\u00E3o" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Per\u00EDodo" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-gray-500 mb-1 block", children: "Data Inicial" }), _jsxs("div", { className: "relative", children: [_jsx(DatePicker, { selected: exportStartDate, onChange: (date) => setExportStartDate(date), selectsStart: true, startDate: exportStartDate, endDate: exportEndDate, dateFormat: "dd/MM/yyyy", locale: ptBR, className: "input w-full", placeholderText: "DD/MM/AAAA", showMonthDropdown: true, showYearDropdown: true, dropdownMode: "select" }), _jsx(Calendar, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" })] })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-sm text-gray-500 mb-1 block", children: "Data Final" }), _jsxs("div", { className: "relative", children: [_jsx(DatePicker, { selected: exportEndDate, onChange: (date) => setExportEndDate(date), selectsEnd: true, startDate: exportStartDate, endDate: exportEndDate, minDate: exportStartDate || undefined, dateFormat: "dd/MM/yyyy", locale: ptBR, className: "input w-full", placeholderText: "DD/MM/AAAA", showMonthDropdown: true, showYearDropdown: true, dropdownMode: "select" }), _jsx(Calendar, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" })] })] })] })] }), exportStartDate && exportEndDate && (_jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Per\u00EDodo selecionado" }), _jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: [formatDateBR(exportStartDate), " a ", formatDateBR(exportEndDate)] }), isLoadingPreview ? (_jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsx(LoadingSpinner, { size: "sm" }), _jsx("span", { className: "text-sm text-gray-500", children: "Carregando..." })] })) : exportPreview && (_jsxs("div", { className: "mt-3 grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-white dark:bg-gray-700 rounded-lg p-3", children: [_jsx("p", { className: "text-xs text-gray-500 uppercase", children: "V\u00EDdeos encontrados" }), _jsxs("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: [exportPreview.parentVideosCount || exportPreview.totalVideos, " v\u00EDdeo", (exportPreview.parentVideosCount || exportPreview.totalVideos) !== 1 ? 's' : '', exportPreview.versionsCount && exportPreview.versionsCount > 0 && (_jsxs("span", { className: "text-sm font-normal text-primary-600 dark:text-primary-400 ml-1", children: ["+ ", exportPreview.versionsCount, " ", exportPreview.versionsCount === 1 ? 'versão' : 'versões'] }))] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-700 rounded-lg p-3", children: [_jsx("p", { className: "text-xs text-gray-500 uppercase", children: "Dura\u00E7\u00E3o total" }), _jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: formatDuration(exportPreview.totalDuration) })] })] }))] })), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { onClick: () => setShowExportModal(false), className: "btn-secondary", children: "Cancelar" }), _jsxs("button", { onClick: handleExport, disabled: !exportStartDate || !exportEndDate || !exportPreview || exportPreview.totalVideos === 0 || isExporting, className: "btn-primary flex items-center gap-2", children: [_jsx(Download, { className: "w-5 h-5" }), isExporting ? 'Exportando...' : 'Exportar PDF'] })] })] }) })] }));
}
