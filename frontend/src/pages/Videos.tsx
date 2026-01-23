import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play, Download, Trash2, Filter, ChevronLeft, ChevronRight, Plus, Pencil, Smartphone, Tv, Clock, Share2, CheckSquare, Square, Calendar, Copy, User, Check, Film } from 'lucide-react';
import { videosApi, professionalsApi } from '../services/api';
import { Video, Professional, Pagination } from '../types';
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
  const { id: videoIdFromUrl } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [deleteVideo, setDeleteVideo] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMultipleVideos, setDeleteMultipleVideos] = useState<Video[]>([]);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [page, setPage] = useState(1);
  
  // Multi-selection and share
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(new Set());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareVideoIds, setShareVideoIds] = useState<number[]>([]);

  // Edit video state
  const [editVideo, setEditVideo] = useState<Video | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    requestDate: new Date(),
    completionDate: new Date(),
    professionalId: '',
    isTv: false,
    tvTitle: '',
    customDurationSeconds: '',
    includeInReport: true, // F-011
  });
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to get resolution icon
  const getResolutionIcon = (resolutionLabel: string) => {
    if (resolutionLabel === '1080x1920') {
      return <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    } else if (resolutionLabel === '1920x1080' || resolutionLabel === '3840x2160') {
      return <Tv className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    } else {
      return <Play className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  // Get considered duration (customDuration if set, else 100% for parent, 50% for version)
  const getConsideredDuration = (video: Video): number => {
    if (video.customDurationSeconds !== null && video.customDurationSeconds !== undefined) {
      return video.customDurationSeconds;
    }
    if (video.parentId) {
      return video.durationSeconds * 0.5;
    }
    return video.durationSeconds;
  };

  // Calculate total duration including versions (50%)
  const getVideoTotalDuration = (video: Video): number => {
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

  // Abrir modal automaticamente quando acessado via URL /videos/:id
  useEffect(() => {
    if (videoIdFromUrl) {
      const videoId = parseInt(videoIdFromUrl);
      if (!isNaN(videoId)) {
        handleVideoPreview(videoId);
      }
    }
  }, [videoIdFromUrl]);

  const handleVideoPreview = async (videoId: number) => {
    try {
      setIsLoadingVideo(true);
      const response = await videosApi.get(videoId);
      setPreviewVideo(response.data.video || response.data);
    } catch (error) {
      console.error('Error loading video:', error);
      toast.error('Erro ao carregar vídeo');
      // Se der erro, redirecionar para /videos
      navigate('/videos', { replace: true });
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const loadProfessionals = async () => {
    try {
      const response = await professionalsApi.list();
      setProfessionals(response.data.professionals);
    } catch (error) {
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
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const now = new Date();
    const currentMonth = selectedMonth || now.getMonth() + 1;
    const currentYear = selectedYear || now.getFullYear();

    let newMonth = currentMonth + (direction === 'next' ? 1 : -1);
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
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

  const toggleSelectVideo = (videoId: number) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map(v => v.id)));
    }
  };

  const handleShare = (ids: number[]) => {
    setShareVideoIds(ids);
    setIsShareModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadVideos();
  };

  const handleDelete = async () => {
    if (!deleteVideo) return;

    setIsDeleting(true);
    try {
      await videosApi.delete(deleteVideo.id);
      toast.success('Vídeo excluído com sucesso');
      setDeleteVideo(null);
      loadVideos();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir vídeo');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteMultiple = async () => {
    if (deleteMultipleVideos.length === 0) return;

    setIsDeletingMultiple(true);
    try {
      // Deletar vídeos em paralelo
      const deletePromises = deleteMultipleVideos.map(video => 
        videosApi.delete(video.id).catch(error => {
          console.error(`Error deleting video ${video.id}:`, error);
          return { error: true, videoId: video.id, title: video.title };
        })
      );

      const results = await Promise.all(deletePromises);
      const errors = results.filter(r => r && (r as any).error);
      const successCount = deleteMultipleVideos.length - errors.length;

      if (errors.length > 0) {
        toast.error(`${successCount} vídeo(s) excluído(s), ${errors.length} erro(s)`);
      } else {
        toast.success(`${successCount} vídeo(s) excluído(s) com sucesso`);
      }

      setDeleteMultipleVideos([]);
      setSelectedVideos(new Set());
      loadVideos();
    } catch (error: any) {
      toast.error('Erro ao excluir vídeos');
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const openDeleteMultipleModal = () => {
    const selectedVideoObjects = videos.filter(v => selectedVideos.has(v.id));
    setDeleteMultipleVideos(selectedVideoObjects);
  };

  const openEditModal = (video: Video) => {
    setEditVideo(video);
    setEditForm({
      title: video.title,
      requestDate: new Date(video.requestDate),
      completionDate: new Date(video.completionDate),
      professionalId: String(video.professionalId),
      isTv: video.isTv || false,
      tvTitle: video.tvTitle || '',
      customDurationSeconds: video.customDurationSeconds ? String(video.customDurationSeconds) : '',
      includeInReport: video.includeInReport !== undefined ? video.includeInReport : true, // F-011
    });
  };

  const handleSaveEdit = async () => {
    if (!editVideo) return;

    setIsSaving(true);
    try {
      await videosApi.update(editVideo.id, {
        title: editForm.title,
        requestDate: editForm.requestDate.toISOString(),
        completionDate: editForm.completionDate.toISOString(),
        professionalId: parseInt(editForm.professionalId),
        isTv: editForm.isTv,
        tvTitle: editForm.isTv ? editForm.tvTitle : null,
        customDurationSeconds: editForm.customDurationSeconds ? parseInt(editForm.customDurationSeconds) : undefined,
        includeInReport: editForm.includeInReport, // F-011
      });
      toast.success('Vídeo atualizado com sucesso');
      setEditVideo(null);
      loadVideos();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar vídeo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vídeos</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {pagination?.total || 0} vídeo{pagination?.total !== 1 ? 's' : ''} encontrado{pagination?.total !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          {user?.role === 'editor' && (
            <Link to="/upload" className="btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              Novo Vídeo
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        {/* Month/Year Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar por período:</span>
            {selectedMonth && selectedYear ? (
              <div className="flex items-center gap-2">
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
                <button
                  onClick={clearMonthFilter}
                  className="ml-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Limpar filtro
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth(now.getMonth() + 1);
                  setSelectedYear(now.getFullYear());
                  setPage(1);
                }}
                className="group relative px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Filtrar por mês</span>
                <div className="absolute inset-0 rounded-lg bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            )}
          </div>
        </div>

        {/* Search and Professional Filter */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <select
              className="input w-auto min-w-[200px]"
              value={selectedProfessional}
              onChange={(e) => {
                setSelectedProfessional(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos os profissionais</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>

            <button type="submit" className="btn-primary">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Selection Actions */}
      {selectedVideos.size > 0 && (
        <div className="card p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedVideos.size} vídeo{selectedVideos.size !== 1 ? 's' : ''} selecionado{selectedVideos.size !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleShare(Array.from(selectedVideos))}
                className="btn-primary flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar Selecionados
              </button>
              <button
                onClick={openDeleteMultipleModal}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Selecionados
              </button>
              <button
                onClick={() => setSelectedVideos(new Set())}
                className="btn-secondary"
              >
                Limpar Seleção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Videos List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : videos.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">Nenhum vídeo encontrado</p>
        </div>
      ) : (
        <>
          {/* Select All */}
          {videos.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
              >
                {selectedVideos.size === videos.length ? (
                  <CheckSquare className="w-5 h-5 text-primary-600" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
                Selecionar todos
              </button>
            </div>
          )}

          <div className="grid gap-4">
            {videos.map((video) => {
              const hasVersions = video.versions && video.versions.length > 0;
              const isSelected = selectedVideos.has(video.id);

              return (
                <div key={video.id} className={`card hover:shadow-md transition-shadow overflow-hidden ${isSelected ? 'ring-2 ring-primary-500' : ''}`}>
                  {/* Main video */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleSelectVideo(video.id)}
                        className="pt-1 hover:scale-110 transition-transform"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-6 h-6 text-primary-600" />
                        ) : (
                          <Square className="w-6 h-6 text-gray-400 hover:text-primary-600" />
                        )}
                      </button>

                      {/* Preview thumbnail */}
                      <button
                        onClick={() => {
                          navigate(`/videos/${video.id}`);
                        }}
                        className="w-32 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden relative group"
                      >
                        {video.thumbnailPath ? (
                          <>
                            <img
                              src={videosApi.getThumbnailUrl(video.id)}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 bg-gray-200 dark:bg-gray-700 items-center justify-center">
                              <Play className="w-8 h-8 text-gray-500" />
                            </div>
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </>
                        ) : (
                          <Play className="w-8 h-8 text-gray-500" />
                        )}
                      </button>

                      {/* Video info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {video.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <span>{video.resolutionLabel}</span>
                            {getResolutionIcon(video.resolutionLabel)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Total: {formatDuration(video.durationSeconds)}
                            </span>
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              Contabilizado: {formatDuration(getConsideredDuration(video))}
                              {hasVersions && (
                                <span>
                                  {' '}+ {video.versions!.length} versão = {formatDuration(getVideoTotalDuration(video))}
                                </span>
                              )}
                            </span>
                          </div>
                          <span>{formatDate(video.requestDate)}</span>
                        </div>
                        {video.professional && (
                          <p className="text-sm text-gray-500 mt-1">
                            Editor: {video.professional.name}
                          </p>
                        )}
                        {video.isTv && video.tvTitle && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            TV: {video.tvTitle}
                          </p>
                        )}
                      </div>

                      {/* Actions - Cores uniformes */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleShare([video.id])}
                          className="btn-ghost p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Compartilhar"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              setIsLoadingVideo(true);
                              const response = await videosApi.get(video.id);
                              setPreviewVideo(response.data.video || response.data);
                            } catch (error) {
                              console.error('Error loading video:', error);
                              toast.error('Erro ao carregar vídeo');
                            } finally {
                              setIsLoadingVideo(false);
                            }
                          }}
                          className="btn-ghost p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Preview"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <a
                          href={videosApi.getDownloadUrl(video.id)}
                          className="btn-ghost p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        {user?.role === 'editor' && (
                          <Link
                            to={`/videos/${video.id}/versions`}
                            className="btn-ghost p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Adicionar versão"
                          >
                            <Plus className="w-5 h-5" />
                          </Link>
                        )}
                        {(user?.role === 'admin' || user?.role === 'editor') && (
                          <button
                            onClick={() => openEditModal(video)}
                            className="btn-ghost p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Editar"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                        {(user?.role === 'admin' || user?.role === 'editor') && (
                          <button
                            onClick={() => setDeleteVideo(video)}
                            className="btn-ghost p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Versions - Sempre aninhadas abaixo do original */}
                  {hasVersions && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Versões ({video.versions!.length})
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {video.versions!.map((version, index) => (
                          <div
                            key={version.id}
                            className="px-4 py-3 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          >
                            {/* Version thumbnail */}
                            <button
                              onClick={async () => {
                                try {
                                  setIsLoadingVideo(true);
                                  const response = await videosApi.get(version.id);
                                  setPreviewVideo(response.data.video || response.data);
                                } catch (error) {
                                  console.error('Error loading video:', error);
                                  toast.error('Erro ao carregar vídeo');
                                } finally {
                                  setIsLoadingVideo(false);
                                }
                              }}
                              className="w-24 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden relative group ml-8"
                            >
                              {version.thumbnailPath ? (
                                <>
                                  <img
                                    src={videosApi.getThumbnailUrl(version.id)}
                                    alt={`Versão ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white" />
                                  </div>
                                </>
                              ) : (
                                <Play className="w-6 h-6 text-gray-500" />
                              )}
                            </button>

                            {/* Version info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Versão {index + 1}
                              </p>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 items-center">
                                <div className="flex items-center gap-1">
                                  <span>{version.resolutionLabel}</span>
                                  {getResolutionIcon(version.resolutionLabel)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-gray-500 dark:text-gray-400">
                                    Total: {formatDuration(version.durationSeconds)}
                                  </span>
                                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                                    Contabilizado: {formatDuration(getConsideredDuration(version))}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Version actions - Cores uniformes */}
                            <div className="flex gap-1">
                              <button
                                onClick={async () => {
                                try {
                                  setIsLoadingVideo(true);
                                  const response = await videosApi.get(version.id);
                                  setPreviewVideo(response.data.video || response.data);
                                } catch (error) {
                                  console.error('Error loading video:', error);
                                  toast.error('Erro ao carregar vídeo');
                                } finally {
                                  setIsLoadingVideo(false);
                                }
                              }}
                                className="btn-ghost p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Preview"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <a
                                href={videosApi.getDownloadUrl(version.id)}
                                className="btn-ghost p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              {(user?.role === 'admin' || user?.role === 'editor') && (
                                <button
                                  onClick={() => openEditModal(version)}
                                  className="btn-ghost p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="Editar versão"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {(user?.role === 'admin' || user?.role === 'editor') && (
                                <button
                                  onClick={() => setDeleteVideo(version)}
                                  className="btn-ghost p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="Excluir versão"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost p-2"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-600 dark:text-gray-400">
                Página {page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="btn-ghost p-2"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Video Preview Modal - Enhanced */}
      <Modal
        isOpen={!!previewVideo || isLoadingVideo}
        onClose={() => {
          setPreviewVideo(null);
          setIsLoadingVideo(false);
          // Limpar URL quando fechar o modal
          if (videoIdFromUrl) {
            navigate('/videos', { replace: true });
          }
        }}
        title=""
        size="xl"
      >
        {isLoadingVideo ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : previewVideo ? (
          <div className="space-y-4">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
              <video
                src={videosApi.getStreamUrl(previewVideo.id)}
                controls
                autoPlay
                className="w-full h-full"
                onError={(e) => {
                  console.error('Video playback error:', e);
                  toast.error('Erro ao reproduzir vídeo. Verifique se o arquivo existe.');
                }}
              >
                Seu navegador não suporta a reprodução de vídeo.
              </video>
            </div>

            {/* Video Info Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 space-y-4">
              {/* Title and TV Badge */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                    {previewVideo.title}
                  </h2>
                  {previewVideo.isTv && previewVideo.tvTitle && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      <Tv className="w-4 h-4" />
                      {previewVideo.tvTitle}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/videos/${previewVideo.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success('Link do vídeo copiado!');
                    }}
                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copiar link"
                  >
                    <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <a
                    href={videosApi.getDownloadUrl(previewVideo.id)}
                    className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Baixar vídeo"
                  >
                    <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </a>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Resolution */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    {previewVideo.resolutionLabel === '1080x1920' ? (
                      <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    ) : previewVideo.resolutionLabel === '1920x1080' || previewVideo.resolutionLabel === '3840x2160' ? (
                      <Tv className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    ) : (
                      <Play className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    )}
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Resolução</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center">
                    {previewVideo.resolutionLabel || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap text-center">
                    {previewVideo.widthPixels && previewVideo.heightPixels 
                      ? `${previewVideo.widthPixels}x${previewVideo.heightPixels}`
                      : 'N/A'}
                  </p>
                </div>

                {/* Duration */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Duração</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center">
                    {previewVideo.durationSeconds 
                      ? formatDuration(previewVideo.durationSeconds)
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap text-center">
                    {previewVideo.durationSeconds 
                      ? `${Math.round(previewVideo.durationSeconds)}s`
                      : 'N/A'}
                  </p>
                </div>

                {/* Request Date */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Solicitado</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center">
                    {previewVideo.requestDate 
                      ? formatDate(previewVideo.requestDate)
                      : '-'}
                  </p>
                </div>

                {/* Completion Date */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap">Concluído</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap text-center">
                    {previewVideo.completionDate 
                      ? formatDate(previewVideo.completionDate)
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Professional Info */}
              {previewVideo.professional && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Editor Responsável
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {previewVideo.professional.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Arquivo Original
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {previewVideo.originalFilename}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Tamanho
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    {previewVideo.fileSizeBytes 
                      ? `${(previewVideo.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Versions Info */}
              {previewVideo.versions && previewVideo.versions.length > 0 && (
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {previewVideo.versions.length} versão(ões) disponível(is)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewVideo.versions.map((version) => (
                      <span
                        key={version.id}
                        className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm"
                      >
                        {version.resolutionLabel} • {formatDuration(version.durationSeconds)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteVideo}
        onClose={() => setDeleteVideo(null)}
        title="Excluir Vídeo"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tem certeza que deseja excluir o vídeo <strong>{deleteVideo?.title}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteVideo(null)} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-danger flex items-center gap-2"
          >
            {isDeleting ? <LoadingSpinner size="sm" /> : <Trash2 className="w-4 h-4" />}
            Excluir
          </button>
        </div>
      </Modal>

      {/* Edit Video Modal */}
      <Modal
        isOpen={!!editVideo}
        onClose={() => setEditVideo(null)}
        title={editVideo?.parentId ? "Editar Versão" : "Editar Vídeo"}
        size="lg"
      >
        {editVideo?.parentId && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Film className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Editando uma Versão</p>
                <p className="text-xs">Esta é uma versão alternativa do vídeo principal. O tempo contabilizado padrão é 50% da duração.</p>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="label">Título</label>
            <input
              type="text"
              className="input"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data de Solicitação</label>
              <DatePicker
                selected={editForm.requestDate}
                onChange={(date: Date | null) => setEditForm({ ...editForm, requestDate: date || new Date() })}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Data de Conclusão</label>
              <DatePicker
                selected={editForm.completionDate}
                onChange={(date: Date | null) => setEditForm({ ...editForm, completionDate: date || new Date() })}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="label">Profissional</label>
            <select
              className="input"
              value={editForm.professionalId}
              onChange={(e) => setEditForm({ ...editForm, professionalId: e.target.value })}
            >
              <option value="">Selecione um profissional</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>

          {/* F-011: Include in Report Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIncludeInReport"
              checked={editForm.includeInReport}
              onChange={(e) => setEditForm({ ...editForm, includeInReport: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="editIncludeInReport" className="text-sm text-gray-700 dark:text-gray-300">
              Incluir este vídeo no relatório (contabilizar segundos)
            </label>
          </div>
          {!editForm.includeInReport && (
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
              Este vídeo ficará arquivado para consulta, mas não contará no relatório.
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsTv"
              checked={editForm.isTv}
              onChange={(e) => setEditForm({ ...editForm, isTv: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="editIsTv" className="text-sm text-gray-700 dark:text-gray-300">
              Vídeo para TV
            </label>
          </div>

          {editForm.isTv && (
            <div>
              <label className="label">Título TV</label>
              <input
                type="text"
                className="input"
                value={editForm.tvTitle}
                onChange={(e) => setEditForm({ ...editForm, tvTitle: e.target.value })}
                placeholder="Título do programa de TV"
              />
            </div>
          )}

          <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
            <label className="label">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span className="font-semibold">Duração Considerada para Contabilização</span>
              </div>
            </label>
            <input
              type="number"
              step="0.001"
              className="input mt-2"
              value={editForm.customDurationSeconds}
              onChange={(e) => setEditForm({ ...editForm, customDurationSeconds: e.target.value })}
              placeholder={editVideo?.parentId ? "Deixe vazio para 50% automático" : "Deixe vazio para 100% da duração"}
            />
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                📊 Duração total do arquivo: <span className="text-primary-600 dark:text-primary-400 font-bold">{editVideo ? formatDuration(editVideo.durationSeconds) : ''} ({editVideo?.durationSeconds.toFixed(3)}s)</span>
              </p>
              {editVideo?.parentId ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 <strong>Versão:</strong> Se deixar vazio, será contabilizado 50% da duração ({editVideo ? formatDuration(editVideo.durationSeconds * 0.5) : ''})
                </p>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 <strong>Vídeo Principal:</strong> Se deixar vazio, será contabilizado 100% da duração
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                Use este campo para definir manualmente quanto tempo será contabilizado nos relatórios (em segundos)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setEditVideo(null)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving || !editForm.title || !editForm.professionalId}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? <LoadingSpinner size="sm" /> : <Pencil className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        videoIds={shareVideoIds}
      />

      {/* Delete Multiple Videos Modal */}
      <Modal
        isOpen={deleteMultipleVideos.length > 0}
        onClose={() => setDeleteMultipleVideos([])}
        title="Excluir Vídeos Selecionados"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
              ⚠️ Tem certeza que deseja excluir {deleteMultipleVideos.length} vídeo(s)?
            </p>
            <p className="text-xs text-red-700 dark:text-red-400">
              Esta ação não pode ser desfeita. Os arquivos serão permanentemente removidos.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vídeos que serão excluídos:
            </p>
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {deleteMultipleVideos.map((video) => (
                  <li key={video.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {video.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{video.resolutionLabel}</span>
                          <span>•</span>
                          <span>{formatDuration(video.durationSeconds)}</span>
                          {video.isTv && video.tvTitle && (
                            <>
                              <span>•</span>
                              <span>TV: {video.tvTitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setDeleteMultipleVideos([])}
              className="btn-secondary"
              disabled={isDeletingMultiple}
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteMultiple}
              disabled={isDeletingMultiple}
              className="btn-danger flex items-center gap-2"
            >
              {isDeletingMultiple ? (
                <>
                  <LoadingSpinner size="sm" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Excluir {deleteMultipleVideos.length} vídeo(s)
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
