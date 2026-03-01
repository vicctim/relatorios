import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileVideo, Calendar, AlertCircle, Archive, Loader2, User, Clock } from 'lucide-react';
import { sharesApi, videosApi } from '../services/api';
import { formatDuration, formatFileSize, formatDate } from '../utils/formatters';
import { LoadingSpinner } from '../components/ui';
import toast from 'react-hot-toast';
export default function PublicShare() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingIds, setDownloadingIds] = useState([]);
    const [downloadingZip, setDownloadingZip] = useState(false);
    useEffect(() => {
        if (token) {
            loadShare();
        }
    }, [token]);
    // Update page title when data loads
    useEffect(() => {
        if (data) {
            const title = data.name
                ? `${data.name} - Pix Filmes`
                : `${data.videos.length} Arquivo${data.videos.length !== 1 ? 's' : ''} Compartilhado${data.videos.length !== 1 ? 's' : ''} - Pix Filmes`;
            document.title = title;
        }
    }, [data]);
    const loadShare = async () => {
        try {
            setLoading(true);
            if (!token)
                return;
            const response = await sharesApi.get(token);
            setData(response.data);
        }
        catch (err) {
            console.error('Error loading share:', err);
            if (err.response?.status === 404) {
                setError('Link não encontrado ou expirado.');
            }
            else if (err.response?.status === 410) {
                setError('Este link expirou.');
            }
            else {
                setError('Erro ao carregar arquivos compartilhados.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleDownload = async (video) => {
        if (!token)
            return;
        try {
            setDownloadingIds(prev => [...prev, video.id]);
            const response = await sharesApi.download(token, [video.id]);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', video.originalFilename || `${video.title}.mp4`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        }
        catch (error) {
            console.error('Download error:', error);
            toast.error('Erro ao baixar vídeo');
        }
        finally {
            setDownloadingIds(prev => prev.filter(id => id !== video.id));
        }
    };
    const handleDownloadAll = async () => {
        if (!token || !data)
            return;
        try {
            setDownloadingZip(true);
            const response = await sharesApi.download(token); // No videoIds = all
            // Create friendly filename
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const baseName = data.name
                ? data.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
                : 'videos-compartilhados';
            const filename = `${baseName}-${dateStr}.zip`;
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Download iniciado');
        }
        catch (error) {
            console.error('Zip download error:', error);
            toast.error('Erro ao baixar arquivos');
        }
        finally {
            setDownloadingZip(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (error || !data) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center p-4", children: _jsxs("div", { className: "bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(AlertCircle, { className: "w-8 h-8 text-red-600" }) }), _jsx("h1", { className: "text-xl font-bold text-gray-900 mb-2", children: "Acesso Indispon\u00EDvel" }), _jsx("p", { className: "text-gray-600", children: error || 'Link inválido' })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("div", { className: "text-center space-y-3", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: "Pix Filmes" }), _jsxs("div", { className: "flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400", children: [_jsx(FileVideo, { className: "w-5 h-5" }), _jsx("p", { children: "Arquivos Compartilhados" })] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden", children: _jsxs("div", { className: "p-6 md:p-8", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-3", children: data.name || 'Arquivos Compartilhados' }), data.message && (_jsx("p", { className: "mt-2 mb-3 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600", children: data.message })), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx(User, { className: "w-4 h-4 text-primary-600 dark:text-primary-400" }), _jsx("span", { className: "font-medium", children: "Compartilhado por:" }), " ", data.creator?.name || 'Pix Filmes'] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx(Clock, { className: "w-4 h-4 text-primary-600 dark:text-primary-400" }), _jsx("span", { className: "font-medium", children: "Em:" }), " ", formatDate(data.createdAt)] }), data.expiresAt && (_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx(Calendar, { className: "w-4 h-4 text-orange-600 dark:text-orange-400" }), _jsx("span", { className: "font-medium", children: "Expira:" }), " ", formatDate(data.expiresAt)] })), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx(FileVideo, { className: "w-4 h-4 text-primary-600 dark:text-primary-400" }), _jsxs("span", { className: "font-medium", children: [data.videos.length, " arquivo", data.videos.length !== 1 ? 's' : ''] })] })] })] }), data.videos.length > 1 && (_jsxs("button", { onClick: handleDownloadAll, disabled: downloadingZip, className: "btn-primary flex items-center gap-2 whitespace-nowrap", children: [downloadingZip ? _jsx(Loader2, { className: "w-4 h-4 animate-spin" }) : _jsx(Archive, { className: "w-4 h-4" }), "Baixar Tudo (.zip)"] }))] }), _jsx("div", { className: "space-y-3", children: data.videos.map((video) => (_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-4", children: [_jsxs("div", { className: "w-full sm:w-40 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden relative", children: [video.thumbnailPath ? (_jsx("img", { src: videosApi.getThumbnailUrl(video.id), alt: video.title, className: "w-full h-full object-cover", onError: (e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    } })) : null, _jsx("div", { className: `${video.thumbnailPath ? 'hidden' : ''} flex items-center justify-center absolute inset-0 text-gray-400`, children: _jsx(FileVideo, { className: "w-8 h-8" }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white text-base mb-1", title: video.originalFilename || video.title, children: video.originalFilename || video.title }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mb-2", children: ["Adicionado em ", formatDate(video.createdAt)] }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap text-sm text-gray-600 dark:text-gray-400", children: [_jsx("span", { className: "inline-flex items-center bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-md text-xs font-medium", children: video.resolutionLabel }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3.5 h-3.5" }), formatDuration(video.durationSeconds)] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Archive, { className: "w-3.5 h-3.5" }), formatFileSize(video.fileSizeBytes)] })] })] }), _jsxs("button", { onClick: () => handleDownload(video), disabled: downloadingIds.includes(video.id), className: "sm:self-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors flex items-center gap-2 justify-center", children: [downloadingIds.includes(video.id) ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Download, { className: "w-4 h-4" })), "Baixar"] })] }, video.id))) })] }) }), _jsxs("div", { className: "text-center text-sm text-gray-500 dark:text-gray-400", children: ["\u00A9 ", new Date().getFullYear(), " Pix Filmes. Pix Relat\u00F3rios."] })] }) }));
}
