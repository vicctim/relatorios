import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileVideo, Calendar, AlertCircle, Archive, Loader2, User, Clock, Play } from 'lucide-react';
import { sharesApi, videosApi } from '../services/api';
import { formatDuration, formatFileSize, formatDate, getVideoAspectRatioStyle } from '../utils/formatters';
import { LoadingSpinner, Modal } from '../components/ui';
import toast from 'react-hot-toast';

interface SharedVideo {
    id: number;
    title: string;
    durationSeconds: number;
    resolutionLabel: string;
    fileSizeBytes: number;
    thumbnailPath: string | null;
    createdAt: string;
    originalFilename: string;
    widthPixels?: number;
    heightPixels?: number;
}

interface ShareLinkData {
    id: number;
    token: string;
    name: string | null;
    message: string | null;
    expiresAt: string | null;
    downloads: number;
    maxDownloads: number | null;
    videos: SharedVideo[];
    createdAt: string;
    creator: {
        name: string;
    };
}

export default function PublicShare() {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<ShareLinkData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingIds, setDownloadingIds] = useState<number[]>([]);
    const [downloadingZip, setDownloadingZip] = useState(false);
    const [playingVideo, setPlayingVideo] = useState<SharedVideo | null>(null);

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
            if (!token) return;
            const response = await sharesApi.get(token);
            setData(response.data);
        } catch (err: any) {
            console.error('Error loading share:', err);
            if (err.response?.status === 404) {
                setError('Link não encontrado ou expirado.');
            } else if (err.response?.status === 410) {
                setError('Este link expirou.');
            } else {
                setError('Erro ao carregar arquivos compartilhados.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (video: SharedVideo) => {
        if (!token) return;
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
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Erro ao baixar vídeo');
        } finally {
            setDownloadingIds(prev => prev.filter(id => id !== video.id));
        }
    };

    const handleDownloadAll = async () => {
        if (!token || !data) return;
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
        } catch (error) {
            console.error('Zip download error:', error);
            toast.error('Erro ao baixar arquivos');
        } finally {
            setDownloadingZip(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Indisponível</h1>
                    <p className="text-gray-600">{error || 'Link inválido'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pix Filmes</h1>
                    <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileVideo className="w-5 h-5" />
                        <p>Arquivos Compartilhados</p>
                    </div>
                </div>

                {/* Share Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    {data.name || 'Arquivos Compartilhados'}
                                </h2>
                                {data.message && (
                                    <p className="mt-2 mb-3 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                        {data.message}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        <span className="font-medium">Compartilhado por:</span> {data.creator?.name || 'Pix Filmes'}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        <span className="font-medium">Em:</span> {formatDate(data.createdAt)}
                                    </span>
                                    {data.expiresAt && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            <span className="font-medium">Expira:</span> {formatDate(data.expiresAt)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <FileVideo className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                        <span className="font-medium">{data.videos.length} arquivo{data.videos.length !== 1 ? 's' : ''}</span>
                                    </span>
                                </div>
                            </div>

                            {data.videos.length > 1 && (
                                <button
                                    onClick={handleDownloadAll}
                                    disabled={downloadingZip}
                                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                                >
                                    {downloadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                                    Baixar Tudo (.zip)
                                </button>
                            )}
                        </div>

                        {/* Video List */}
                        <div className="space-y-3">
                            {data.videos.map((video) => (
                                <div
                                    key={video.id}
                                    className="flex flex-col sm:flex-row sm:items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-4"
                                >
                                    {/* Thumbnail */}
                                    <button
                                        onClick={() => setPlayingVideo(video)}
                                        className="w-full sm:w-40 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden relative group cursor-pointer"
                                    >
                                        {video.thumbnailPath ? (
                                            <>
                                                <img
                                                    src={token ? `/api/shares/${token}/thumbnail/${video.id}` : videosApi.getThumbnailUrl(video.id)}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Play className="w-8 h-8 text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center justify-center absolute inset-0 text-gray-400">
                                                <FileVideo className="w-8 h-8" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1" title={video.originalFilename || video.title}>
                                            {video.originalFilename || video.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            Adicionado em {formatDate(video.createdAt)}
                                        </p>
                                        <div className="flex items-center gap-3 flex-wrap text-sm text-gray-600 dark:text-gray-400">
                                            <span className="inline-flex items-center bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-md text-xs font-medium">
                                                {video.resolutionLabel}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDuration(video.durationSeconds)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Archive className="w-3.5 h-3.5" />
                                                {formatFileSize(video.fileSizeBytes)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="sm:self-center flex gap-2">
                                        <button
                                            onClick={() => setPlayingVideo(video)}
                                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center gap-2 justify-center"
                                        >
                                            <Play className="w-4 h-4" />
                                            Reproduzir
                                        </button>
                                        <button
                                            onClick={() => handleDownload(video)}
                                            disabled={downloadingIds.includes(video.id)}
                                            className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors flex items-center gap-2 justify-center"
                                        >
                                            {downloadingIds.includes(video.id) ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            Baixar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} Pix Filmes. Pix Relatórios.
                </div>
            </div>

            {/* Video Player Modal */}
            <Modal
                isOpen={!!playingVideo}
                onClose={() => setPlayingVideo(null)}
                title={playingVideo?.originalFilename || playingVideo?.title || ''}
                size="xl"
            >
                {playingVideo && token && (
                    <div className="space-y-4">
                        <div 
                            className="bg-black rounded-lg overflow-hidden w-full"
                            style={getVideoAspectRatioStyle(playingVideo.widthPixels, playingVideo.heightPixels)}
                        >
                            <video
                                src={`/api/shares/${token}/stream/${playingVideo.id}`}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    console.error('Video playback error:', e);
                                    toast.error('Erro ao reproduzir vídeo. Verifique se o arquivo existe.');
                                }}
                            >
                                Seu navegador não suporta a reprodução de vídeo.
                            </video>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="inline-flex items-center bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-md text-xs font-medium">
                                {playingVideo.resolutionLabel}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDuration(playingVideo.durationSeconds)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Archive className="w-3.5 h-3.5" />
                                {formatFileSize(playingVideo.fileSizeBytes)}
                            </span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
