import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileVideo, TrendingUp, Calendar, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { reportsApi, sharesApi } from '../services/api';
import { formatMonthYear, formatTimeWithEmphasis } from '../utils/formatters';
import { LoadingSpinner } from '../components/ui';
import toast from 'react-hot-toast';
export default function Dashboard() {
    const [stats, setStats] = useState(null);
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
        }
        catch (error) {
            console.error('Error loading stats:', error);
            toast.error('Erro ao carregar estatísticas');
        }
        finally {
            setIsLoading(false);
        }
    };
    const loadShares = async () => {
        try {
            const response = await sharesApi.list();
            setTotalShares(response.data.length);
        }
        catch (error) {
            console.error('Error loading shares:', error);
        }
    };
    const navigateMonth = (direction) => {
        let newMonth = selectedMonth + (direction === 'next' ? 1 : -1);
        let newYear = selectedYear;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }
        else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (!stats) {
        return (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-gray-500", children: "Erro ao carregar estat\u00EDsticas" }) }));
    }
    const usagePercentage = (stats.currentMonth.used / stats.currentMonth.limit) * 100;
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Dashboard" }), _jsxs("p", { className: "text-gray-500 dark:text-gray-400", children: ["Vis\u00E3o geral de ", formatMonthYear(selectedMonth, selectedYear)] })] }), _jsxs("div", { className: "flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700", children: [_jsx("button", { onClick: () => navigateMonth('prev'), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", title: "M\u00EAs anterior", children: _jsx(ChevronLeft, { className: "w-5 h-5" }) }), _jsx("span", { className: "text-lg font-medium text-gray-900 dark:text-white min-w-[180px] text-center capitalize", children: formatMonthYear(selectedMonth, selectedYear) }), _jsx("button", { onClick: () => navigateMonth('next'), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Pr\u00F3ximo m\u00EAs", children: _jsx(ChevronRight, { className: "w-5 h-5" }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: [_jsxs("div", { className: "card p-6 hover:shadow-lg transition-all duration-300", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("div", { className: "w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center", children: _jsx(Clock, { className: "w-6 h-6 text-primary-600 dark:text-primary-400" }) }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Tempo Utilizado" }), _jsxs("div", { className: "mb-3", children: [_jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: formatTimeWithEmphasis(stats.currentMonth.used).secondsOnly }), formatTimeWithEmphasis(stats.currentMonth.used).timeFormatted && (_jsxs("span", { className: "text-base font-normal text-gray-500 dark:text-gray-400 ml-2", children: ["(", formatTimeWithEmphasis(stats.currentMonth.used).timeFormatted, ")"] }))] }), _jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsx("span", { className: "text-gray-500", children: "Progresso" }), _jsxs("span", { className: "text-gray-700 dark:text-gray-300 font-medium", children: [Math.round(usagePercentage), "%"] })] }), _jsx("div", { className: "w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full transition-all duration-500 ${usagePercentage > 90
                                                ? 'bg-red-500'
                                                : usagePercentage > 75
                                                    ? 'bg-yellow-500'
                                                    : 'bg-primary-500'}`, style: { width: `${Math.min(usagePercentage, 100)}%` } }) })] })] }), _jsxs("div", { className: "card p-6 hover:shadow-lg transition-all duration-300", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("div", { className: "w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center", children: _jsx(TrendingUp, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Limite do M\u00EAs" }), _jsxs("div", { children: [_jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: formatTimeWithEmphasis(stats.currentMonth.limit).secondsOnly }), formatTimeWithEmphasis(stats.currentMonth.limit).timeFormatted && (_jsxs("span", { className: "text-base font-normal text-gray-500 dark:text-gray-400 ml-2", children: ["(", formatTimeWithEmphasis(stats.currentMonth.limit).timeFormatted, ")"] }))] })] }), _jsxs("div", { className: "card p-6 hover:shadow-lg transition-all duration-300", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("div", { className: "w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center", children: _jsx(Calendar, { className: "w-6 h-6 text-green-600 dark:text-green-400" }) }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Tempo Restante" }), _jsxs("div", { children: [_jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: formatTimeWithEmphasis(stats.currentMonth.remaining).secondsOnly }), formatTimeWithEmphasis(stats.currentMonth.remaining).timeFormatted && (_jsxs("span", { className: "text-base font-normal text-gray-500 dark:text-gray-400 ml-2", children: ["(", formatTimeWithEmphasis(stats.currentMonth.remaining).timeFormatted, ")"] }))] })] }), _jsxs(Link, { to: "/videos", className: "card p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("div", { className: "w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform", children: _jsx(FileVideo, { className: "w-6 h-6 text-purple-600 dark:text-purple-400" }) }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Total de V\u00EDdeos" }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: stats.totalVideos }), _jsx("p", { className: "mt-2 text-xs text-gray-500", children: "Clique para ver todos" })] }), _jsxs(Link, { to: "/shares", className: "card p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group", children: [_jsx("div", { className: "flex items-center justify-between mb-4", children: _jsx("div", { className: "w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform", children: _jsx(Share2, { className: "w-6 h-6 text-orange-600 dark:text-orange-400" }) }) }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Compartilhamentos" }), _jsx("p", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: totalShares }), _jsx("p", { className: "mt-2 text-xs text-gray-500", children: "Links criados" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs(Link, { to: "/videos", className: "card p-6 hover:shadow-lg transition-all duration-300 group flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform", children: _jsx(FileVideo, { className: "w-6 h-6 text-primary-600 dark:text-primary-400" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: "Gerenciar V\u00EDdeos" }), _jsx("p", { className: "text-sm text-gray-500", children: "Ver, editar e compartilhar" })] })] }), _jsxs(Link, { to: "/reports", className: "card p-6 hover:shadow-lg transition-all duration-300 group flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform", children: _jsx(TrendingUp, { className: "w-6 h-6 text-blue-600 dark:text-blue-400" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: "Relat\u00F3rios" }), _jsx("p", { className: "text-sm text-gray-500", children: "Visualizar e exportar" })] })] }), _jsxs(Link, { to: "/shares", className: "card p-6 hover:shadow-lg transition-all duration-300 group flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform", children: _jsx(Share2, { className: "w-6 h-6 text-orange-600 dark:text-orange-400" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: "Compartilhamentos" }), _jsx("p", { className: "text-sm text-gray-500", children: "Gerenciar links" })] })] })] })] }));
}
