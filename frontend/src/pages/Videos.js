import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play, Download, Trash2, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Pencil, Smartphone, Tv, Clock, Share2, CheckSquare, Square, Calendar, Copy, User, Check, Film } from 'lucide-react';
import { videosApi, professionalsApi } from '../services/api';
import { formatDuration, formatDate, formatMonthYear } from '../utils/formatters';
import { LoadingSpinner, Modal } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
export default function Videos() {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProfessional, setSelectedProfessional] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(undefined);
    const [selectedYear, setSelectedYear] = useState(undefined);
    const [previewVideo, setPreviewVideo] = useState(null);
    const [isLoadingVideo, setIsLoadingVideo] = useState(false);
    const [deleteVideo, setDeleteVideo] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMultipleVideos, setDeleteMultipleVideos] = useState([]);
    const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
    const [page, setPage] = useState(1);
    const [expandedVideos, setExpandedVideos] = useState(new Set());
    // Multi-selection and share
    const [selectedVideos, setSelectedVideos] = useState(new Set());
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareVideoIds, setShareVideoIds] = useState([]);
    // Edit video state
    const [editVideo, setEditVideo] = useState(null);
    const [editForm, setEditForm] = useState({
        title: '',
        requestDate: new Date(),
        completionDate: new Date(),
        professionalId: '',
        isTv: false,
        tvTitle: '',
        customDurationSeconds: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    // Toggle version expansion for a video
    const toggleExpanded = (videoId) => {
        setExpandedVideos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(videoId)) {
                newSet.delete(videoId);
            }
            else {
                newSet.add(videoId);
            }
            return newSet;
        });
    };
    // Get considered duration (customDuration if set, else 100% for parent, 50% for version)
    const getConsideredDuration = (video) => {
        if (video.customDurationSeconds !== null && video.customDurationSeconds !== undefined) {
            return video.customDurationSeconds;
        }
        if (video.parentId) {
            return video.durationSeconds * 0.5;
        }
        return video.durationSeconds;
    };
    // Calculate total duration including versions (50%)
    const getVideoTotalDuration = (video) => {
        let total = getConsideredDuration(video);
        if (video.versions && video.versions.length > 0) {
            total += video.versions.reduce((sum, v) => sum + getConsideredDuration(v), 0);
        }
        return total;
    };
    useEffect(() => {
        loadProfessionals();
    }, []);
    useEffect(() => {
        loadVideos();
    }, [page, selectedProfessional, selectedMonth, selectedYear]);
    const loadProfessionals = async () => {
        try {
            const response = await professionalsApi.list();
            setProfessionals(response.data.professionals);
        }
        catch (error) {
            console.error('Error loading professionals:', error);
        }
    };
    const loadVideos = async () => {
        setIsLoading(true);
        try {
            const response = await videosApi.list({
                parentOnly: true,
                professionalId: selectedProfessional ? parseInt(selectedProfessional) : undefined,
                search: search || undefined,
                month: selectedMonth,
                year: selectedYear,
                page,
                limit: 20,
            });
            setVideos(response.data.videos);
            setPagination(response.data.pagination);
        }
        catch (error) {
            console.error('Error loading videos:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const navigateMonth = (direction) => {
        const now = new Date();
        const currentMonth = selectedMonth || now.getMonth() + 1;
        const currentYear = selectedYear || now.getFullYear();
        let newMonth = currentMonth + (direction === 'next' ? 1 : -1);
        let newYear = currentYear;
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
        setPage(1);
    };
    const clearMonthFilter = () => {
        setSelectedMonth(undefined);
        setSelectedYear(undefined);
        setPage(1);
    };
    const toggleSelectVideo = (videoId) => {
        setSelectedVideos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(videoId)) {
                newSet.delete(videoId);
            }
            else {
                newSet.add(videoId);
            }
            return newSet;
        });
    };
    const toggleSelectAll = () => {
        if (selectedVideos.size === videos.length) {
            setSelectedVideos(new Set());
        }
        else {
            setSelectedVideos(new Set(videos.map(v => v.id)));
        }
    };
    const handleShare = (ids) => {
        setShareVideoIds(ids);
        setIsShareModalOpen(true);
    };
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadVideos();
    };
    const handleDelete = async () => {
        if (!deleteVideo)
            return;
        setIsDeleting(true);
        try {
            await videosApi.delete(deleteVideo.id);
            toast.success('Vídeo excluído com sucesso');
            setDeleteVideo(null);
            loadVideos();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao excluir vídeo');
        }
        finally {
            setIsDeleting(false);
        }
    };
    const handleDeleteMultiple = async () => {
        if (deleteMultipleVideos.length === 0)
            return;
        setIsDeletingMultiple(true);
        try {
            // Deletar vídeos em paralelo
            const deletePromises = deleteMultipleVideos.map(video => videosApi.delete(video.id).catch(error => {
                console.error(`Error deleting video ${video.id}:`, error);
                return { error: true, videoId: video.id, title: video.title };
            }));
            const results = await Promise.all(deletePromises);
            const errors = results.filter(r => r && r.error);
            const successCount = deleteMultipleVideos.length - errors.length;
            if (errors.length > 0) {
                toast.error(`${successCount} vídeo(s) excluído(s), ${errors.length} erro(s)`);
            }
            else {
                toast.success(`${successCount} vídeo(s) excluído(s) com sucesso`);
            }
            setDeleteMultipleVideos([]);
            setSelectedVideos(new Set());
            loadVideos();
        }
        catch (error) {
            toast.error('Erro ao excluir vídeos');
        }
        finally {
            setIsDeletingMultiple(false);
        }
    };
    const openDeleteMultipleModal = () => {
        const selectedVideoObjects = videos.filter(v => selectedVideos.has(v.id));
        setDeleteMultipleVideos(selectedVideoObjects);
    };
    const openEditModal = (video) => {
        setEditVideo(video);
        setEditForm({
            title: video.title,
            requestDate: new Date(video.requestDate),
            completionDate: new Date(video.completionDate),
            professionalId: String(video.professionalId),
            isTv: video.isTv || false,
            tvTitle: video.tvTitle || '',
            customDurationSeconds: video.customDurationSeconds ? String(video.customDurationSeconds) : '',
        });
    };
    const handleSaveEdit = async () => {
        if (!editVideo)
            return;
        setIsSaving(true);
        try {
            await videosApi.update(editVideo.id, {
                title: editForm.title,
                requestDate: editForm.requestDate.toISOString(),
                completionDate: editForm.completionDate.toISOString(),
                professionalId: parseInt(editForm.professionalId),
                isTv: editForm.isTv,
                tvTitle: editForm.isTv ? editForm.tvTitle : null,
                customDurationSeconds: editForm.customDurationSeconds ? parseInt(editForm.customDurationSeconds) : null,
            });
            toast.success('Vídeo atualizado com sucesso');
            setEditVideo(null);
            loadVideos();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao atualizar vídeo');
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "V\u00EDdeos" }), _jsxs("p", { className: "text-gray-500 dark:text-gray-400", children: [pagination?.total || 0, " v\u00EDdeo", pagination?.total !== 1 ? 's' : '', " encontrado", pagination?.total !== 1 ? 's' : ''] })] }), _jsx("div", { className: "flex gap-2", children: user?.role === 'editor' && (_jsxs(Link, { to: "/upload", className: "btn-primary", children: [_jsx(Plus, { className: "w-5 h-5 mr-2" }), "Novo V\u00EDdeo"] })) })] }), _jsxs("div", { className: "card p-4 space-y-4", children: [_jsx("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Filtrar por per\u00EDodo:" }), selectedMonth && selectedYear ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => navigateMonth('prev'), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", title: "M\u00EAs anterior", children: _jsx(ChevronLeft, { className: "w-5 h-5" }) }), _jsx("span", { className: "text-lg font-medium text-gray-900 dark:text-white min-w-[180px] text-center capitalize", children: formatMonthYear(selectedMonth, selectedYear) }), _jsx("button", { onClick: () => navigateMonth('next'), className: "p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Pr\u00F3ximo m\u00EAs", children: _jsx(ChevronRight, { className: "w-5 h-5" }) }), _jsx("button", { onClick: clearMonthFilter, className: "ml-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors", children: "Limpar filtro" })] })) : (_jsxs("button", { onClick: () => {
                                        const now = new Date();
                                        setSelectedMonth(now.getMonth() + 1);
                                        setSelectedYear(now.getFullYear());
                                        setPage(1);
                                    }, className: "group relative px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2", children: [_jsx(Calendar, { className: "w-5 h-5 group-hover:rotate-12 transition-transform duration-300" }), _jsx("span", { children: "Filtrar por m\u00EAs" }), _jsx("div", { className: "absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" })] }))] }) }), _jsxs("form", { onSubmit: handleSearch, className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Buscar por t\u00EDtulo...", className: "input pl-10", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { className: "input w-auto min-w-[200px]", value: selectedProfessional, onChange: (e) => {
                                            setSelectedProfessional(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "Todos os profissionais" }), professionals.map((prof) => (_jsx("option", { value: prof.id, children: prof.name }, prof.id)))] }), _jsx("button", { type: "submit", className: "btn-primary", children: _jsx(Filter, { className: "w-5 h-5" }) })] })] })] }), selectedVideos.size > 0 && (_jsx("div", { className: "card p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [selectedVideos.size, " v\u00EDdeo", selectedVideos.size !== 1 ? 's' : '', " selecionado", selectedVideos.size !== 1 ? 's' : ''] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => handleShare(Array.from(selectedVideos)), className: "btn-primary flex items-center gap-2", children: [_jsx(Share2, { className: "w-4 h-4" }), "Compartilhar Selecionados"] }), _jsxs("button", { onClick: openDeleteMultipleModal, className: "btn-danger flex items-center gap-2", children: [_jsx(Trash2, { className: "w-4 h-4" }), "Excluir Selecionados"] }), _jsx("button", { onClick: () => setSelectedVideos(new Set()), className: "btn-secondary", children: "Limpar Sele\u00E7\u00E3o" })] })] }) })), isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) })) : videos.length === 0 ? (_jsx("div", { className: "card p-12 text-center", children: _jsx("p", { className: "text-gray-500", children: "Nenhum v\u00EDdeo encontrado" }) })) : (_jsxs(_Fragment, { children: [videos.length > 0 && (_jsx("div", { className: "flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg", children: _jsxs("button", { onClick: toggleSelectAll, className: "flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400", children: [selectedVideos.size === videos.length ? (_jsx(CheckSquare, { className: "w-5 h-5 text-primary-600" })) : (_jsx(Square, { className: "w-5 h-5" })), "Selecionar todos"] }) })), _jsx("div", { className: "grid gap-4", children: videos.map((video) => {
                            const hasVersions = video.versions && video.versions.length > 0;
                            const isExpanded = expandedVideos.has(video.id);
                            const isSelected = selectedVideos.has(video.id);
                            return (_jsxs("div", { className: `card hover:shadow-md transition-shadow overflow-hidden ${isSelected ? 'ring-2 ring-primary-500' : ''}`, children: [_jsx("div", { className: "p-4", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("button", { onClick: () => toggleSelectVideo(video.id), className: "pt-1 hover:scale-110 transition-transform", children: isSelected ? (_jsx(CheckSquare, { className: "w-6 h-6 text-primary-600" })) : (_jsx(Square, { className: "w-6 h-6 text-gray-400 hover:text-primary-600" })) }), _jsx("button", { onClick: async () => {
                                                        try {
                                                            setIsLoadingVideo(true);
                                                            const response = await videosApi.get(video.id);
                                                            setPreviewVideo(response.data.video || response.data);
                                                        }
                                                        catch (error) {
                                                            console.error('Error loading video:', error);
                                                            toast.error('Erro ao carregar vídeo');
                                                        }
                                                        finally {
                                                            setIsLoadingVideo(false);
                                                        }
                                                    }, className: "w-32 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden relative group", children: video.thumbnailPath ? (_jsxs(_Fragment, { children: [_jsx("img", { src: videosApi.getThumbnailUrl(video.id), alt: video.title, className: "w-full h-full object-cover", onError: (e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                                } }), _jsx("div", { className: "hidden absolute inset-0 bg-gray-200 dark:bg-gray-700 items-center justify-center", children: _jsx(Play, { className: "w-8 h-8 text-gray-500" }) }), _jsx("div", { className: "absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx(Play, { className: "w-8 h-8 text-white" }) })] })) : (_jsx(Play, { className: "w-8 h-8 text-gray-500" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-semibold text-gray-900 dark:text-white truncate", children: video.title }), _jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500", children: [_jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { children: video.resolutionLabel }), video.resolutionLabel === '1080x1920' && (_jsx(Smartphone, { className: "w-4 h-4 text-gray-400" })), (video.resolutionLabel === '1920x1080' || video.resolutionLabel === '3840x2160') && (_jsx(Tv, { className: "w-4 h-4 text-gray-400" }))] }), video.versions?.map((v) => (_jsxs("div", { className: "flex items-center gap-1 text-xs text-gray-400", children: [_jsx("span", { children: v.resolutionLabel }), v.resolutionLabel === '1080x1920' && (_jsx(Smartphone, { className: "w-3 h-3" })), (v.resolutionLabel === '1920x1080' || v.resolutionLabel === '3840x2160') && (_jsx(Tv, { className: "w-3 h-3" }))] }, v.id)))] }), _jsxs("div", { className: "flex flex-col", children: [_jsxs("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: ["Total: ", formatDuration(video.durationSeconds)] }), _jsxs("span", { className: "text-sm font-medium text-primary-600 dark:text-primary-400", children: ["Contabilizado: ", formatDuration(getConsideredDuration(video)), hasVersions && (_jsxs("span", { children: [' ', "+ ", video.versions.length, " vers\u00E3o = ", formatDuration(getVideoTotalDuration(video))] }))] })] }), _jsx("span", { children: formatDate(video.requestDate) })] }), video.professional && (_jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Editor: ", video.professional.name] })), video.isTv && video.tvTitle && (_jsxs("p", { className: "text-sm text-blue-600 dark:text-blue-400 mt-1", children: ["TV: ", video.tvTitle] }))] }), _jsxs("div", { className: "flex gap-2", children: [hasVersions && (_jsx("button", { onClick: () => toggleExpanded(video.id), className: "btn-ghost p-2", title: isExpanded ? 'Recolher versões' : 'Expandir versões', children: isExpanded ? (_jsx(ChevronUp, { className: "w-5 h-5" })) : (_jsx(ChevronDown, { className: "w-5 h-5" })) })), _jsx("button", { onClick: () => handleShare([video.id]), className: "btn-ghost p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20", title: "Compartilhar", children: _jsx(Share2, { className: "w-5 h-5" }) }), _jsx("button", { onClick: async () => {
                                                                try {
                                                                    setIsLoadingVideo(true);
                                                                    const response = await videosApi.get(video.id);
                                                                    setPreviewVideo(response.data.video || response.data);
                                                                }
                                                                catch (error) {
                                                                    console.error('Error loading video:', error);
                                                                    toast.error('Erro ao carregar vídeo');
                                                                }
                                                                finally {
                                                                    setIsLoadingVideo(false);
                                                                }
                                                            }, className: "btn-ghost p-2", title: "Preview", children: _jsx(Play, { className: "w-5 h-5" }) }), _jsx("a", { href: videosApi.getDownloadUrl(video.id), className: "btn-ghost p-2", title: "Download", children: _jsx(Download, { className: "w-5 h-5" }) }), user?.role === 'editor' && (_jsx(Link, { to: `/videos/${video.id}/versions`, className: "btn-ghost p-2", title: "Adicionar vers\u00E3o", children: _jsx(Plus, { className: "w-5 h-5" }) })), (user?.role === 'admin' || user?.role === 'editor') && (_jsx("button", { onClick: () => openEditModal(video), className: "btn-ghost p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20", title: "Editar", children: _jsx(Pencil, { className: "w-5 h-5" }) })), (user?.role === 'admin' || user?.role === 'editor') && (_jsx("button", { onClick: () => setDeleteVideo(video), className: "btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20", title: "Excluir", children: _jsx(Trash2, { className: "w-5 h-5" }) }))] })] }) }), hasVersions && isExpanded && (_jsxs("div", { className: "border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50", children: [_jsxs("div", { className: "px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider", children: ["Vers\u00F5es (", video.versions.length, ")"] }), _jsx("div", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: video.versions.map((version, index) => (_jsxs("div", { className: "px-4 py-3 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700/50", children: [_jsx("button", { onClick: async () => {
                                                                try {
                                                                    setIsLoadingVideo(true);
                                                                    const response = await videosApi.get(version.id);
                                                                    setPreviewVideo(response.data.video || response.data);
                                                                }
                                                                catch (error) {
                                                                    console.error('Error loading video:', error);
                                                                    toast.error('Erro ao carregar vídeo');
                                                                }
                                                                finally {
                                                                    setIsLoadingVideo(false);
                                                                }
                                                            }, className: "w-24 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden relative group ml-8", children: version.thumbnailPath ? (_jsxs(_Fragment, { children: [_jsx("img", { src: videosApi.getThumbnailUrl(version.id), alt: `Versão ${index + 1}`, className: "w-full h-full object-cover", onError: (e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                        } }), _jsx("div", { className: "absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx(Play, { className: "w-6 h-6 text-white" }) })] })) : (_jsx(Play, { className: "w-6 h-6 text-gray-500" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: ["Vers\u00E3o ", index + 1] }), _jsxs("div", { className: "flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500", children: [_jsx("span", { children: version.resolutionLabel }), _jsxs("div", { className: "flex flex-col", children: [_jsxs("span", { className: "text-gray-500 dark:text-gray-400", children: ["Total: ", formatDuration(version.durationSeconds)] }), _jsxs("span", { className: "text-primary-600 dark:text-primary-400 font-medium", children: ["Contabilizado: ", formatDuration(getConsideredDuration(version))] })] })] })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: async () => {
                                                                        try {
                                                                            setIsLoadingVideo(true);
                                                                            const response = await videosApi.get(version.id);
                                                                            setPreviewVideo(response.data.video || response.data);
                                                                        }
                                                                        catch (error) {
                                                                            console.error('Error loading video:', error);
                                                                            toast.error('Erro ao carregar vídeo');
                                                                        }
                                                                        finally {
                                                                            setIsLoadingVideo(false);
                                                                        }
                                                                    }, className: "btn-ghost p-1.5", title: "Preview", children: _jsx(Play, { className: "w-4 h-4" }) }), _jsx("a", { href: videosApi.getDownloadUrl(version.id), className: "btn-ghost p-1.5", title: "Download", children: _jsx(Download, { className: "w-4 h-4" }) }), (user?.role === 'admin' || user?.role === 'editor') && (_jsx("button", { onClick: () => openEditModal(version), className: "btn-ghost p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20", title: "Editar vers\u00E3o", children: _jsx(Pencil, { className: "w-4 h-4" }) })), (user?.role === 'admin' || user?.role === 'editor') && (_jsx("button", { onClick: () => setDeleteVideo(version), className: "btn-ghost p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20", title: "Excluir vers\u00E3o", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] })] }, version.id))) })] })), hasVersions && !isExpanded && (_jsxs("button", { onClick: () => toggleExpanded(video.id), className: "w-full px-4 py-2 text-sm text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2", children: [_jsx(ChevronDown, { className: "w-4 h-4" }), "Ver ", video.versions.length, " vers\u00E3o(\u00F5es)"] }))] }, video.id));
                        }) }), pagination && pagination.totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("button", { onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1, className: "btn-ghost p-2", children: _jsx(ChevronLeft, { className: "w-5 h-5" }) }), _jsxs("span", { className: "text-gray-600 dark:text-gray-400", children: ["P\u00E1gina ", page, " de ", pagination.totalPages] }), _jsx("button", { onClick: () => setPage((p) => Math.min(pagination.totalPages, p + 1)), disabled: page === pagination.totalPages, className: "btn-ghost p-2", children: _jsx(ChevronRight, { className: "w-5 h-5" }) })] }))] })), _jsx(Modal, { isOpen: !!previewVideo || isLoadingVideo, onClose: () => {
                    setPreviewVideo(null);
                    setIsLoadingVideo(false);
                }, title: "", size: "xl", children: isLoadingVideo ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) })) : previewVideo ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "aspect-video bg-black rounded-lg overflow-hidden relative group", children: _jsx("video", { src: videosApi.getStreamUrl(previewVideo.id), controls: true, autoPlay: true, className: "w-full h-full", onError: (e) => {
                                    console.error('Video playback error:', e);
                                    toast.error('Erro ao reproduzir vídeo. Verifique se o arquivo existe.');
                                }, children: "Seu navegador n\u00E3o suporta a reprodu\u00E7\u00E3o de v\u00EDdeo." }) }), _jsxs("div", { className: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 space-y-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words", children: previewVideo.title }), previewVideo.isTv && previewVideo.tvTitle && (_jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium", children: [_jsx(Tv, { className: "w-4 h-4" }), previewVideo.tvTitle] }))] }), _jsxs("div", { className: "flex gap-2 flex-shrink-0", children: [_jsx("button", { onClick: () => {
                                                        const url = `${window.location.origin}/videos/${previewVideo.id}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast.success('Link do vídeo copiado!');
                                                    }, className: "p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Copiar link", children: _jsx(Copy, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }) }), _jsx("a", { href: videosApi.getDownloadUrl(previewVideo.id), className: "p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors", title: "Baixar v\u00EDdeo", children: _jsx(Download, { className: "w-5 h-5 text-gray-600 dark:text-gray-400" }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [previewVideo.resolutionLabel === '1080x1920' ? (_jsx(Smartphone, { className: "w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" })) : (_jsx(Tv, { className: "w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" })), _jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap", children: "Resolu\u00E7\u00E3o" })] }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center", children: previewVideo.resolutionLabel || 'N/A' }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap text-center", children: previewVideo.widthPixels && previewVideo.heightPixels
                                                        ? `${previewVideo.widthPixels}x${previewVideo.heightPixels}`
                                                        : 'N/A' })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Clock, { className: "w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" }), _jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap", children: "Dura\u00E7\u00E3o" })] }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center", children: previewVideo.durationSeconds
                                                        ? formatDuration(previewVideo.durationSeconds)
                                                        : 'N/A' }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap text-center", children: previewVideo.durationSeconds
                                                        ? `${Math.round(previewVideo.durationSeconds)}s`
                                                        : 'N/A' })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Calendar, { className: "w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" }), _jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap", children: "Solicitado" })] }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center", children: previewVideo.requestDate
                                                        ? formatDate(previewVideo.requestDate)
                                                        : '-' })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Check, { className: "w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" }), _jsx("span", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap", children: "Conclu\u00EDdo" })] }), _jsx("p", { className: "text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center", children: previewVideo.completionDate
                                                        ? formatDate(previewVideo.completionDate)
                                                        : '-' })] })] }), previewVideo.professional && (_jsx("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0", children: _jsx(User, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase", children: "Editor Respons\u00E1vel" }), _jsx("p", { className: "text-base font-semibold text-gray-900 dark:text-white truncate", children: previewVideo.professional.name })] })] }) })), _jsxs("div", { className: "grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1", children: "Arquivo Original" }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 truncate", children: previewVideo.originalFilename })] }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1", children: "Tamanho" }), _jsx("p", { className: "text-sm text-gray-700 dark:text-gray-300 break-words", children: previewVideo.fileSizeBytes
                                                        ? `${(previewVideo.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                                                        : 'N/A' })] })] }), previewVideo.versions && previewVideo.versions.length > 0 && (_jsxs("div", { className: "bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Film, { className: "w-5 h-5 text-primary-600 dark:text-primary-400" }), _jsxs("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: [previewVideo.versions.length, " vers\u00E3o(\u00F5es) dispon\u00EDvel(is)"] })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: previewVideo.versions.map((version) => (_jsxs("span", { className: "px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm", children: [version.resolutionLabel, " \u2022 ", formatDuration(version.durationSeconds)] }, version.id))) })] }))] })] })) : null }), _jsxs(Modal, { isOpen: !!deleteVideo, onClose: () => setDeleteVideo(null), title: "Excluir V\u00EDdeo", children: [_jsxs("p", { className: "text-gray-600 dark:text-gray-400 mb-6", children: ["Tem certeza que deseja excluir o v\u00EDdeo ", _jsx("strong", { children: deleteVideo?.title }), "? Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita."] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { onClick: () => setDeleteVideo(null), className: "btn-secondary", children: "Cancelar" }), _jsxs("button", { onClick: handleDelete, disabled: isDeleting, className: "btn-danger flex items-center gap-2", children: [isDeleting ? _jsx(LoadingSpinner, { size: "sm" }) : _jsx(Trash2, { className: "w-4 h-4" }), "Excluir"] })] })] }), _jsxs(Modal, { isOpen: !!editVideo, onClose: () => setEditVideo(null), title: editVideo?.parentId ? "Editar Versão" : "Editar Vídeo", size: "lg", children: [editVideo?.parentId && (_jsx("div", { className: "mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-2 text-blue-700 dark:text-blue-300", children: [_jsx(Film, { className: "w-5 h-5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: "Editando uma Vers\u00E3o" }), _jsx("p", { className: "text-xs", children: "Esta \u00E9 uma vers\u00E3o alternativa do v\u00EDdeo principal. O tempo contabilizado padr\u00E3o \u00E9 50% da dura\u00E7\u00E3o." })] })] }) })), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "T\u00EDtulo" }), _jsx("input", { type: "text", className: "input", value: editForm.title, onChange: (e) => setEditForm({ ...editForm, title: e.target.value }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Data de Solicita\u00E7\u00E3o" }), _jsx(DatePicker, { selected: editForm.requestDate, onChange: (date) => setEditForm({ ...editForm, requestDate: date || new Date() }), dateFormat: "dd/MM/yyyy", locale: ptBR, className: "input w-full" })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Data de Conclus\u00E3o" }), _jsx(DatePicker, { selected: editForm.completionDate, onChange: (date) => setEditForm({ ...editForm, completionDate: date || new Date() }), dateFormat: "dd/MM/yyyy", locale: ptBR, className: "input w-full" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Profissional" }), _jsxs("select", { className: "input", value: editForm.professionalId, onChange: (e) => setEditForm({ ...editForm, professionalId: e.target.value }), children: [_jsx("option", { value: "", children: "Selecione um profissional" }), professionals.map((prof) => (_jsx("option", { value: prof.id, children: prof.name }, prof.id)))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "editIsTv", checked: editForm.isTv, onChange: (e) => setEditForm({ ...editForm, isTv: e.target.checked }), className: "w-4 h-4 text-primary-600 rounded" }), _jsx("label", { htmlFor: "editIsTv", className: "text-sm text-gray-700 dark:text-gray-300", children: "V\u00EDdeo para TV" })] }), editForm.isTv && (_jsxs("div", { children: [_jsx("label", { className: "label", children: "T\u00EDtulo TV" }), _jsx("input", { type: "text", className: "input", value: editForm.tvTitle, onChange: (e) => setEditForm({ ...editForm, tvTitle: e.target.value }), placeholder: "T\u00EDtulo do programa de TV" })] })), _jsxs("div", { className: "bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800", children: [_jsx("label", { className: "label", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-5 h-5 text-primary-600 dark:text-primary-400" }), _jsx("span", { className: "font-semibold", children: "Dura\u00E7\u00E3o Considerada para Contabiliza\u00E7\u00E3o" })] }) }), _jsx("input", { type: "number", step: "0.001", className: "input mt-2", value: editForm.customDurationSeconds, onChange: (e) => setEditForm({ ...editForm, customDurationSeconds: e.target.value }), placeholder: editVideo?.parentId ? "Deixe vazio para 50% automático" : "Deixe vazio para 100% da duração" }), _jsxs("div", { className: "mt-2 space-y-1", children: [_jsxs("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: ["\uD83D\uDCCA Dura\u00E7\u00E3o total do arquivo: ", _jsxs("span", { className: "text-primary-600 dark:text-primary-400 font-bold", children: [editVideo ? formatDuration(editVideo.durationSeconds) : '', " (", editVideo?.durationSeconds.toFixed(3), "s)"] })] }), editVideo?.parentId ? (_jsxs("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Vers\u00E3o:" }), " Se deixar vazio, ser\u00E1 contabilizado 50% da dura\u00E7\u00E3o (", editVideo ? formatDuration(editVideo.durationSeconds * 0.5) : '', ")"] })) : (_jsxs("p", { className: "text-xs text-gray-600 dark:text-gray-400", children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "V\u00EDdeo Principal:" }), " Se deixar vazio, ser\u00E1 contabilizado 100% da dura\u00E7\u00E3o"] })), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-500 italic", children: "Use este campo para definir manualmente quanto tempo ser\u00E1 contabilizado nos relat\u00F3rios (em segundos)" })] })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx("button", { onClick: () => setEditVideo(null), className: "btn-secondary", children: "Cancelar" }), _jsxs("button", { onClick: handleSaveEdit, disabled: isSaving || !editForm.title || !editForm.professionalId, className: "btn-primary flex items-center gap-2", children: [isSaving ? _jsx(LoadingSpinner, { size: "sm" }) : _jsx(Pencil, { className: "w-4 h-4" }), "Salvar"] })] })] })] }), _jsx(ShareModal, { isOpen: isShareModalOpen, onClose: () => setIsShareModalOpen(false), videoIds: shareVideoIds }), _jsx(Modal, { isOpen: deleteMultipleVideos.length > 0, onClose: () => setDeleteMultipleVideos([]), title: "Excluir V\u00EDdeos Selecionados", size: "lg", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4", children: [_jsxs("p", { className: "text-sm text-red-800 dark:text-red-300 font-medium mb-2", children: ["\u26A0\uFE0F Tem certeza que deseja excluir ", deleteMultipleVideos.length, " v\u00EDdeo(s)?"] }), _jsx("p", { className: "text-xs text-red-700 dark:text-red-400", children: "Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita. Os arquivos ser\u00E3o permanentemente removidos." })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "V\u00EDdeos que ser\u00E3o exclu\u00EDdos:" }), _jsx("div", { className: "max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg", children: _jsx("ul", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: deleteMultipleVideos.map((video) => (_jsx("li", { className: "p-3 hover:bg-gray-50 dark:hover:bg-gray-800", children: _jsx("div", { className: "flex items-start gap-3", children: _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: video.title }), _jsxs("div", { className: "flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400", children: [_jsx("span", { children: video.resolutionLabel }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: formatDuration(video.durationSeconds) }), video.isTv && video.tvTitle && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u2022" }), _jsxs("span", { children: ["TV: ", video.tvTitle] })] }))] })] }) }) }, video.id))) }) })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700", children: [_jsx("button", { onClick: () => setDeleteMultipleVideos([]), className: "btn-secondary", disabled: isDeletingMultiple, children: "Cancelar" }), _jsx("button", { onClick: handleDeleteMultiple, disabled: isDeletingMultiple, className: "btn-danger flex items-center gap-2", children: isDeletingMultiple ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm" }), "Excluindo..."] })) : (_jsxs(_Fragment, { children: [_jsx(Trash2, { className: "w-4 h-4" }), "Excluir ", deleteMultipleVideos.length, " v\u00EDdeo(s)"] })) })] })] }) })] }));
}
