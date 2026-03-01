import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link2, Copy, ExternalLink, Calendar, Download, Check, Trash2, Eye, Play, Clock, Film, User, Tv, Smartphone } from 'lucide-react';
import { sharesApi, videosApi } from '../services/api';
import { LoadingSpinner, Modal } from '../components/ui';
import { formatDate, formatDuration } from '../utils/formatters';
import toast from 'react-hot-toast';
export default function Shares() {
    const [shares, setShares] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [deleteShare, setDeleteShare] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    useEffect(() => {
        loadShares();
    }, []);
    const loadShares = async () => {
        try {
            setIsLoading(true);
            const response = await sharesApi.list();
            setShares(response.data);
        }
        catch (error) {
            console.error('Error loading shares:', error);
            toast.error('Erro ao carregar compartilhamentos');
        }
        finally {
            setIsLoading(false);
        }
    };
    const getShareUrl = (share) => {
        const slug = share.customSlug || share.token;
        return `${window.location.origin}/s/${slug}`;
    };
    const handleCopy = (share) => {
        const url = getShareUrl(share);
        navigator.clipboard.writeText(url);
        setCopiedId(share.id);
        setTimeout(() => setCopiedId(null), 2000);
        toast.success('Link copiado!');
    };
    const isExpired = (share) => {
        if (!share.expiresAt)
            return false;
        return new Date(share.expiresAt) < new Date();
    };
    const isLimitReached = (share) => {
        if (!share.maxDownloads)
            return false;
        return share.downloads >= share.maxDownloads;
    };
    const handleDelete = async () => {
        if (!deleteShare)
            return;
        setIsDeleting(true);
        try {
            await sharesApi.delete(deleteShare.id);
            toast.success('Compartilhamento excluído com sucesso');
            setDeleteShare(null);
            loadShares();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao excluir compartilhamento');
        }
        finally {
            setIsDeleting(false);
        }
    };
    const handleVideoPreview = async (videoId) => {
        try {
            setIsLoadingVideo(true);
            const response = await videosApi.get(videoId);
            // A API retorna { video, totalCalculatedDuration }, precisamos extrair o video
            setPreviewVideo(response.data.video || response.data);
        }
        catch (error) {
            console.error('Error loading video:', error);
            toast.error('Erro ao carregar vídeo');
        }
        finally {
            setIsLoadingVideo(false);
        }
    };
    const handleCopyVideoLink = () => {
        if (!previewVideo)
            return;
        const url = `${window.location.origin}/videos/${previewVideo.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link do vídeo copiado!');
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Compartilhamentos" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Gerencie todos os links de compartilhamento criados" })] }), shares.length === 0 ? (_jsxs("div", { className: "card p-12 text-center", children: [_jsx(Link2, { className: "w-12 h-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-500", children: "Nenhum compartilhamento criado ainda" })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: shares.map((share) => {
                    const expired = isExpired(share);
                    const limitReached = isLimitReached(share);
                    const isInactive = expired || limitReached;
                    return (_jsxs("div", { className: `card p-5 hover:shadow-lg transition-all duration-300 ${isInactive ? 'opacity-60' : ''}`, children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-3", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [_jsx(Link2, { className: "w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" }), _jsx("h3", { className: "font-semibold text-gray-900 dark:text-white truncate", children: share.name || 'Compartilhamento sem nome' })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => handleCopy(share), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors", title: "Copiar link", children: copiedId === share.id ? (_jsx(Check, { className: "w-4 h-4 text-green-600" })) : (_jsx(Copy, { className: "w-4 h-4 text-gray-600 dark:text-gray-400" })) }), _jsx("a", { href: getShareUrl(share), target: "_blank", rel: "noopener noreferrer", className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors", title: "Abrir link", children: _jsx(ExternalLink, { className: "w-4 h-4 text-gray-600 dark:text-gray-400" }) }), _jsx("button", { onClick: () => setDeleteShare(share), className: "p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors", title: "Excluir", children: _jsx(Trash2, { className: "w-4 h-4 text-red-600 dark:text-red-400" }) })] })] }), isInactive && (_jsx("div", { className: "mb-3", children: _jsx("span", { className: "inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded", children: expired ? 'Expirado' : 'Limite atingido' }) })), _jsx("div", { className: "mb-3", children: _jsx("code", { className: "block text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded truncate", children: getShareUrl(share) }) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 mb-3 text-sm", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-gray-500 dark:text-gray-400", children: [_jsx(Calendar, { className: "w-4 h-4 flex-shrink-0" }), _jsx("span", { className: "truncate text-xs", children: formatDate(share.createdAt) })] }), share.expiresAt && (_jsxs("div", { className: "flex items-center gap-1.5 text-gray-500 dark:text-gray-400", children: [_jsx(Calendar, { className: "w-4 h-4 flex-shrink-0" }), _jsxs("span", { className: "truncate text-xs", children: ["Exp: ", formatDate(share.expiresAt)] })] })), _jsxs("div", { className: "flex items-center gap-1.5 text-gray-500 dark:text-gray-400", children: [_jsx(Download, { className: "w-4 h-4 flex-shrink-0" }), _jsxs("span", { className: "text-xs", children: [share.downloads, share.maxDownloads && ` / ${share.maxDownloads}`] })] }), _jsxs("div", { className: "flex items-center gap-1.5 text-gray-500 dark:text-gray-400", children: [_jsx(Eye, { className: "w-4 h-4 flex-shrink-0" }), _jsxs("span", { className: "text-xs", children: [share.videos?.length || 0, " v\u00EDdeo(s)"] })] })] }), share.videos && share.videos.length > 0 && (_jsxs("div", { className: "mt-3 flex gap-2 overflow-x-auto pb-1", children: [share.videos.slice(0, 4).map((video) => (_jsxs("button", { onClick: () => handleVideoPreview(video.id), className: "relative w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all", title: video.title, children: [video.thumbnailPath ? (_jsx("img", { src: videosApi.getThumbnailUrl(video.id), alt: video.title, className: "w-full h-full object-cover", onError: (e) => {
                                                    e.currentTarget.style.display = 'none';
                                                } })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(Eye, { className: "w-4 h-4 text-gray-400" }) })), _jsx("div", { className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx(Play, { className: "w-5 h-5 text-white" }) })] }, video.id))), share.videos.length > 4 && (_jsx("div", { className: "w-16 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0", children: _jsxs("span", { className: "text-xs font-medium text-gray-500", children: ["+", share.videos.length - 4] }) }))] }))] }, share.id));
                }) })), _jsx(Modal, { isOpen: !!previewVideo || isLoadingVideo, onClose: () => setPreviewVideo(null), title: "", size: "xl", children: isLoadingVideo ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) })) : previewVideo ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "aspect-video bg-black rounded-lg overflow-hidden relative group", children: _jsx("video", { src: videosApi.getStreamUrl(previewVideo.id), controls: true, autoPlay: true, className: "w-full h-full", onError: (e) => {
                                    console.error('Video playback error:', e);
                                    toast.error('Erro ao reproduzir vídeo. Verifique se o arquivo existe.');
                                }, onLoadedMetadata: () => {
                                    console.log('Video metadata loaded');
                                }, children: "Seu navegador n\u00E3o suporta a reprodu\u00E7\u00E3o de v\u00EDdeo." }) }), _jsxs("div", { className: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 space-y-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: previewVideo.title }), previewVideo.isTv && previewVideo.tvTitle && (_jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium", children: [_jsx(Tv, { className: "w-4 h-4" }), previewVideo.tvTitle] }))] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: handleCopyVideoLink, className: "p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Copiar link", children: _jsx(Copy, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }) }), _jsx("a", { href: videosApi.getDownloadUrl(previewVideo.id), className: "p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Baixar v\u00EDdeo", children: _jsx(Download, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [previewVideo.resolutionLabel === '1080x1920' ? (_jsx(Smartphone, { className: "w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" })) : (_jsx(Tv, { className: "w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" })), _jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap", children: "Resolu\u00E7\u00E3o" })] }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center", children: previewVideo.resolutionLabel || 'N/A' }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap text-center", children: previewVideo.widthPixels && previewVideo.heightPixels
                                                        ? `${previewVideo.widthPixels}x${previewVideo.heightPixels}`
                                                        : 'N/A' })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Clock, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" }), _jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap", children: "Dura\u00E7\u00E3o" })] }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center", children: previewVideo.durationSeconds
                                                        ? formatDuration(previewVideo.durationSeconds)
                                                        : 'N/A' }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap text-center", children: previewVideo.durationSeconds
                                                        ? `${Math.round(previewVideo.durationSeconds)}s`
                                                        : 'N/A' })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Calendar, { className: "w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" }), _jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap", children: "Solicitado" })] }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center", children: previewVideo.requestDate
                                                        ? formatDate(previewVideo.requestDate)
                                                        : '-' })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Check, { className: "w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" }), _jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap", children: "Conclu\u00EDdo" })] }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center", children: previewVideo.completionDate
                                                        ? formatDate(previewVideo.completionDate)
                                                        : '-' })] })] }), previewVideo.professional && (_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center", children: _jsx(User, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: "Editor Respons\u00E1vel" }), _jsx("p", { className: "text-base font-semibold text-gray-900 dark:text-white", children: previewVideo.professional.name })] })] }) })), _jsxs("div", { className: "grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1", children: "Arquivo Original" }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 truncate", children: previewVideo.originalFilename })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1", children: "Tamanho" }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300", children: previewVideo.fileSizeBytes
                                                        ? `${(previewVideo.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                                                        : 'N/A' })] })] }), previewVideo.versions && previewVideo.versions.length > 0 && (_jsxs("div", { className: "bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Film, { className: "w-5 h-5 text-primary-600 dark:text-primary-400" }), _jsxs("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [previewVideo.versions.length, " vers\u00E3o(\u00F5es) dispon\u00EDvel(is)"] })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: previewVideo.versions.map((version, index) => (_jsxs("span", { className: "px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm", children: [version.resolutionLabel, " \u2022 ", formatDuration(version.durationSeconds)] }, version.id))) })] }))] })] })) : null }), _jsxs(Modal, { isOpen: !!deleteShare, onClose: () => setDeleteShare(null), title: "Excluir Compartilhamento", children: [_jsxs("p", { className: "text-gray-600 dark:text-gray-400 mb-6", children: ["Tem certeza que deseja excluir o compartilhamento ", _jsx("strong", { children: deleteShare?.name || 'sem nome' }), "? Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita e o link ficar\u00E1 inv\u00E1lido."] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { onClick: () => setDeleteShare(null), className: "btn-secondary", disabled: isDeleting, children: "Cancelar" }), _jsxs("button", { onClick: handleDelete, disabled: isDeleting, className: "btn-danger flex items-center gap-2", children: [isDeleting ? _jsx(LoadingSpinner, { size: "sm" }) : _jsx(Trash2, { className: "w-4 h-4" }), "Excluir"] })] })] })] }));
}
