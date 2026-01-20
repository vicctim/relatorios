import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play, Download, Trash2, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Pencil, Smartphone, Tv, Clock } from 'lucide-react';
import { videosApi, professionalsApi } from '../services/api';
import { Video, Professional, Pagination } from '../types';
import { formatDuration, formatDate } from '../utils/formatters';
import { LoadingSpinner, Modal } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

export default function Videos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [deleteVideo, setDeleteVideo] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedVideos, setExpandedVideos] = useState<Set<number>>(new Set());

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
  });
  const [isSaving, setIsSaving] = useState(false);

  // Toggle version expansion for a video
  const toggleExpanded = (videoId: number) => {
    setExpandedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
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
  }, [page, selectedProfessional]);

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
        customDurationSeconds: editForm.customDurationSeconds ? parseInt(editForm.customDurationSeconds) : null,
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
            {pagination?.total || 0} vídeo{pagination?.total !== 1 ? 's' : ''} cadastrado{pagination?.total !== 1 ? 's' : ''}
          </p>
        </div>

        {user?.role === 'editor' && (
          <Link to="/upload" className="btn-primary">
            Novo Vídeo
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
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
              className="input w-auto"
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
          <div className="grid gap-4">
            {videos.map((video) => {
              const hasVersions = video.versions && video.versions.length > 0;
              const isExpanded = expandedVideos.has(video.id);

              return (
                <div key={video.id} className="card hover:shadow-md transition-shadow overflow-hidden">
                  {/* Main video */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Preview thumbnail */}
                      <button
                        onClick={() => setPreviewVideo(video)}
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
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span>{video.resolutionLabel}</span>
                              {video.resolutionLabel === '1080x1920' && (
                                <Smartphone className="w-4 h-4 text-gray-400" />
                              )}
                              {(video.resolutionLabel === '1920x1080' || video.resolutionLabel === '3840x2160') && (
                                <Tv className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            {video.versions?.map((v) => (
                              <div key={v.id} className="flex items-center gap-1 text-xs text-gray-400">
                                <span>{v.resolutionLabel}</span>
                                {v.resolutionLabel === '1080x1920' && (
                                  <Smartphone className="w-3 h-3" />
                                )}
                                {(v.resolutionLabel === '1920x1080' || v.resolutionLabel === '3840x2160') && (
                                  <Tv className="w-3 h-3" />
                                )}
                              </div>
                            ))}
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

                      {/* Actions */}
                      <div className="flex gap-2">
                        {hasVersions && (
                          <button
                            onClick={() => toggleExpanded(video.id)}
                            className="btn-ghost p-2"
                            title={isExpanded ? 'Recolher versões' : 'Expandir versões'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setPreviewVideo(video)}
                          className="btn-ghost p-2"
                          title="Preview"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <a
                          href={videosApi.getDownloadUrl(video.id)}
                          className="btn-ghost p-2"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                        {user?.role === 'editor' && (
                          <Link
                            to={`/videos/${video.id}/versions`}
                            className="btn-ghost p-2"
                            title="Adicionar versão"
                          >
                            <Plus className="w-5 h-5" />
                          </Link>
                        )}
                        {(user?.role === 'admin' || user?.role === 'editor') && (
                          <button
                            onClick={() => openEditModal(video)}
                            className="btn-ghost p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Editar"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                        )}
                        {(user?.role === 'admin' || user?.role === 'editor') && (
                          <button
                            onClick={() => setDeleteVideo(video)}
                            className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Versions (collapsed/expanded) */}
                  {hasVersions && isExpanded && (
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
                              onClick={() => setPreviewVideo(version)}
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
                              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span>{version.resolutionLabel}</span>
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

                            {/* Version actions */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => setPreviewVideo(version)}
                                className="btn-ghost p-1.5"
                                title="Preview"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <a
                                href={videosApi.getDownloadUrl(version.id)}
                                className="btn-ghost p-1.5"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              {(user?.role === 'admin' || user?.role === 'editor') && (
                                <button
                                  onClick={() => setDeleteVideo(version)}
                                  className="btn-ghost p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
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

                  {/* Collapsed versions indicator */}
                  {hasVersions && !isExpanded && (
                    <button
                      onClick={() => toggleExpanded(video.id)}
                      className="w-full px-4 py-2 text-sm text-primary-600 dark:text-primary-400 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Ver {video.versions!.length} versão(ões)
                    </button>
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

      {/* Video Preview Modal */}
      <Modal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        title={previewVideo?.title}
        size="auto"
      >
        {previewVideo && (() => {
          const videoWidth = previewVideo.widthPixels || 1280;
          const videoHeight = previewVideo.heightPixels || 720;
          const aspectRatio = videoWidth / videoHeight;
          const maxWidth = Math.min(videoWidth, window.innerWidth * 0.9 - 48);
          const maxHeight = Math.min(videoHeight, window.innerHeight * 0.8 - 100);

          let width, height;
          if (maxWidth / aspectRatio <= maxHeight) {
            width = maxWidth;
            height = maxWidth / aspectRatio;
          } else {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          }

          return (
            <div
              className="bg-black rounded-lg overflow-hidden"
              style={{ width, height }}
            >
              <video
                src={videosApi.getStreamUrl(previewVideo.id)}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          );
        })()}
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
        title="Editar Vídeo"
        size="lg"
      >
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
                onChange={(date) => setEditForm({ ...editForm, requestDate: date || new Date() })}
                dateFormat="dd/MM/yyyy"
                locale={ptBR}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Data de Conclusão</label>
              <DatePicker
                selected={editForm.completionDate}
                onChange={(date) => setEditForm({ ...editForm, completionDate: date || new Date() })}
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

          <div>
            <label className="label">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Duração Considerada (segundos)</span>
              </div>
            </label>
            <input
              type="number"
              className="input"
              value={editForm.customDurationSeconds}
              onChange={(e) => setEditForm({ ...editForm, customDurationSeconds: e.target.value })}
              placeholder={editVideo?.parentId ? "Deixe vazio para 50% automático" : "Deixe vazio para 100% da duração"}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Duração total do vídeo: {editVideo ? formatDuration(editVideo.durationSeconds) : ''}
              {editVideo?.parentId && ' (este é uma versão)'}
            </p>
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
    </div>
  );
}
