import { useEffect, useState } from 'react';
import { Link2, Copy, ExternalLink, Calendar, Download, Check, Trash2, Eye, Play, Clock, Film, User, Tv, Smartphone } from 'lucide-react';
import { sharesApi, videosApi } from '../services/api';
import { LoadingSpinner, Modal } from '../components/ui';
import { formatDate, formatDuration } from '../utils/formatters';
import { Video } from '../types';
import toast from 'react-hot-toast';

interface ShareLink {
  id: number;
  token: string;
  customSlug: string | null;
  name: string | null;
  expiresAt: string | null;
  downloads: number;
  maxDownloads: number | null;
  active: boolean;
  createdAt: string;
  videos?: Array<{
    id: number;
    title: string;
    thumbnailPath: string | null;
  }>;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function Shares() {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteShare, setDeleteShare] = useState<ShareLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      setIsLoading(true);
      const response = await sharesApi.list();
      setShares(response.data);
    } catch (error) {
      console.error('Error loading shares:', error);
      toast.error('Erro ao carregar compartilhamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const getShareUrl = (share: ShareLink) => {
    const slug = share.customSlug || share.token;
    return `${window.location.origin}/s/${slug}`;
  };

  const handleCopy = (share: ShareLink) => {
    const url = getShareUrl(share);
    navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Link copiado!');
  };

  const isExpired = (share: ShareLink) => {
    if (!share.expiresAt) return false;
    return new Date(share.expiresAt) < new Date();
  };

  const isLimitReached = (share: ShareLink) => {
    if (!share.maxDownloads) return false;
    return share.downloads >= share.maxDownloads;
  };

  const handleDelete = async () => {
    if (!deleteShare) return;

    setIsDeleting(true);
    try {
      await sharesApi.delete(deleteShare.id);
      toast.success('Compartilhamento excluído com sucesso');
      setDeleteShare(null);
      loadShares();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir compartilhamento');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVideoPreview = async (videoId: number) => {
    try {
      setIsLoadingVideo(true);
      const response = await videosApi.get(videoId);
      // A API retorna { video, totalCalculatedDuration }, precisamos extrair o video
      setPreviewVideo(response.data.video || response.data);
    } catch (error) {
      console.error('Error loading video:', error);
      toast.error('Erro ao carregar vídeo');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleCopyVideoLink = () => {
    if (!previewVideo) return;
    const url = `${window.location.origin}/videos/${previewVideo.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do vídeo copiado!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compartilhamentos</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gerencie todos os links de compartilhamento criados
        </p>
      </div>

      {/* Share Links List - 3 Columns Grid */}
      {shares.length === 0 ? (
        <div className="card p-12 text-center">
          <Link2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhum compartilhamento criado ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shares.map((share) => {
            const expired = isExpired(share);
            const limitReached = isLimitReached(share);
            const isInactive = expired || limitReached;

            return (
              <div
                key={share.id}
                className={`card p-5 hover:shadow-lg transition-all duration-300 ${isInactive ? 'opacity-60' : ''}`}
              >
                {/* Header com nome e ações */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Link2 className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {share.name || 'Compartilhamento sem nome'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(share)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copiar link"
                    >
                      {copiedId === share.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    <a
                      href={getShareUrl(share)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Abrir link"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </a>
                    <button
                      onClick={() => setDeleteShare(share)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                {isInactive && (
                  <div className="mb-3">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded">
                      {expired ? 'Expirado' : 'Limite atingido'}
                    </span>
                  </div>
                )}

                {/* URL */}
                <div className="mb-3">
                  <code className="block text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded truncate">
                    {getShareUrl(share)}
                  </code>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate text-xs">
                      {formatDate(share.createdAt)}
                    </span>
                  </div>
                  {share.expiresAt && (
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate text-xs">
                        Exp: {formatDate(share.expiresAt)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs">
                      {share.downloads}
                      {share.maxDownloads && ` / ${share.maxDownloads}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Eye className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs">{share.videos?.length || 0} vídeo(s)</span>
                  </div>
                </div>

                {/* Videos thumbnails */}
                {share.videos && share.videos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {share.videos.slice(0, 4).map((video) => (
                      <button
                        key={video.id}
                        onClick={() => handleVideoPreview(video.id)}
                        className="relative w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
                        title={video.title}
                      >
                        {video.thumbnailPath ? (
                          <img
                            src={videosApi.getThumbnailUrl(video.id)}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                      </button>
                    ))}
                    {share.videos.length > 4 && (
                      <div className="w-16 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-500">
                          +{share.videos.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video Preview Modal - Enhanced */}
      <Modal
        isOpen={!!previewVideo || isLoadingVideo}
        onClose={() => setPreviewVideo(null)}
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
                onLoadedMetadata={() => {
                  console.log('Video metadata loaded');
                }}
              >
                Seu navegador não suporta a reprodução de vídeo.
              </video>
            </div>

            {/* Video Info Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 space-y-4">
              {/* Title and TV Badge */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
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
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyVideoLink}
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
                    ) : (
                      <Tv className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Editor Responsável
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">
                        {previewVideo.professional.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Arquivo Original
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {previewVideo.originalFilename}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                    Tamanho
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
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
        isOpen={!!deleteShare}
        onClose={() => setDeleteShare(null)}
        title="Excluir Compartilhamento"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tem certeza que deseja excluir o compartilhamento <strong>{deleteShare?.name || 'sem nome'}</strong>?
          Esta ação não pode ser desfeita e o link ficará inválido.
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => setDeleteShare(null)} 
            className="btn-secondary"
            disabled={isDeleting}
          >
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
    </div>
  );
}
