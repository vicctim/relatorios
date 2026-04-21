import { useEffect, useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Save, Play, Check } from 'lucide-react';
import { videosApi, professionalsApi } from '../services/api';
import { Video, Professional, Pagination } from '../types';
import { formatDuration } from '../utils/formatters';
import { LoadingSpinner, Modal } from '../components/ui';
import toast from 'react-hot-toast';

interface VideoDraft {
  title: string;
  professionalId: string;
  requestDate: string; // ISO date format YYYY-MM-DD
  customDurationSecondsStr: string;
  includeInReport: boolean;
  isCustomDurationSuggested: boolean; // Flag to show a visual hint
  isTv: boolean;
  tvTitle: string;
}

export default function Approval() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const selectedMonth = undefined;
  const selectedYear = undefined;
  const [page, setPage] = useState(1);

  // Drafts for editing
  const [drafts, setDrafts] = useState<Record<number, VideoDraft>>({});
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Player preview
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    loadVideos();
  }, [page, selectedProfessional, selectedMonth, selectedYear]);

  useEffect(() => {
    // Populate drafts when videos load
    const newDrafts = { ...drafts };
    let hasChanges = false;
    
    videos.forEach((video) => {
      if (!newDrafts[video.id]) {
        // Detect "stories" rule
        const isStories = video.title.toLowerCase().includes('stories') || video.title.toLowerCase().includes('story');
        let customDurationStr = video.customDurationSeconds !== null ? String(video.customDurationSeconds) : '';
        let isSuggested = false;
        
        if (isStories && video.customDurationSeconds === null && !video.parentId) {
          customDurationStr = String(Math.round(video.durationSeconds / 2));
          isSuggested = true;
        }

        const formattedDate = new Date(video.requestDate).toISOString().split('T')[0];

        newDrafts[video.id] = {
          title: video.title,
          professionalId: String(video.professionalId),
          requestDate: formattedDate,
          customDurationSecondsStr: customDurationStr,
          includeInReport: video.includeInReport !== undefined ? video.includeInReport : true,
          isCustomDurationSuggested: isSuggested,
          isTv: video.isTv || false,
          tvTitle: video.tvTitle || '',
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setDrafts(newDrafts);
    }
  }, [videos]);

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
    setVideos([]);
    try {
      const response = await videosApi.list({
        parentOnly: true,
        isApproved: false,
        professionalId: selectedProfessional ? parseInt(selectedProfessional) : undefined,
        search: search || undefined,
        month: selectedMonth,
        year: selectedYear,
        page,
        limit: 30, // show more per page for table
      });
      setVideos(response.data.videos);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadVideos();
  };

  const updateDraft = (videoId: number, field: keyof VideoDraft, value: any) => {
    setDrafts((prev) => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        [field]: value,
        // Optional: if user manually types in custom duration, override the suggested flag
        ...(field === 'customDurationSecondsStr' ? { isCustomDurationSuggested: false } : {})
      },
    }));
  };

  const handleSaveLine = async (video: Video) => {
    const draft = drafts[video.id];
    if (!draft) return;

    setSavingIds((prev) => new Set(prev).add(video.id));
    
    try {
      await videosApi.update(video.id, {
        title: draft.title,
        professionalId: parseInt(draft.professionalId),
        requestDate: new Date(draft.requestDate + 'T12:00:00').toISOString(),
        completionDate: new Date(draft.requestDate + 'T12:00:00').toISOString(), // Keep it synced
        includeInReport: draft.includeInReport,
        isApproved: true,
        customDurationSeconds: draft.customDurationSecondsStr ? parseInt(draft.customDurationSecondsStr) : undefined,
        isTv: draft.isTv,
        tvTitle: draft.isTv ? draft.tvTitle : null,
      });
      
      toast.success('Salvo e Aprovado!');
      
      // Remover o vídeo da lista já que ele foi aprovado
      setVideos((prev) => prev.filter(v => v.id !== video.id));
      
      // Atualizar o visual suggestion flag porque agora está efetivamente salvo
      setDrafts((prev) => ({
        ...prev,
        [video.id]: {
          ...prev[video.id],
          isCustomDurationSuggested: false,
        }
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar vídeo');
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
    }
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    let successCount = 0;
    
    // Save sequentially to avoid backend overload
    for (const video of videos) {
      const draft = drafts[video.id];
      if (!draft) continue;

      setSavingIds((prev) => new Set(prev).add(video.id));
      
      try {
        await videosApi.update(video.id, {
          title: draft.title,
          professionalId: parseInt(draft.professionalId),
          requestDate: new Date(draft.requestDate + 'T12:00:00').toISOString(),
          completionDate: new Date(draft.requestDate + 'T12:00:00').toISOString(),
          includeInReport: draft.includeInReport,
          isApproved: true,
          customDurationSeconds: draft.customDurationSecondsStr ? parseInt(draft.customDurationSecondsStr) : undefined,
          isTv: draft.isTv,
          tvTitle: draft.isTv ? draft.tvTitle : null,
        });
        
        successCount++;
        
        // Remove from list since it was approved
        setVideos((currentVideos) => currentVideos.filter(v => v.id !== video.id));
        
        setDrafts((prev) => ({
          ...prev,
          [video.id]: {
            ...prev[video.id],
            isCustomDurationSuggested: false,
          }
        }));
      } catch (error: any) {
        toast.error(`Erro ao salvar: ${draft.title}`);
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(video.id);
          return next;
        });
      }
    }
    
    setIsSavingAll(false);
    if (successCount > 0) {
      toast.success(`${successCount} vídeos aprovados com sucesso!`);
    }
  };

  const handlePreview = async (videoId: number) => {
    try {
      setIsLoadingVideo(true);
      const response = await videosApi.get(videoId);
      setPreviewVideo(response.data.video || response.data);
    } catch (error) {
      console.error('Error loading video:', error);
      toast.error('Erro ao carregar vídeo');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Análise e Aprovação em Massa</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Edite os campos preenchidos e aplique ajustes rapidamente com a tabela.
          </p>
        </div>
        
        {videos.length > 0 && !isLoading && (
          <button
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isSavingAll ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
            Aprovar Todos da Página
          </button>
        )}
      </div>

      <div className="card p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título..."
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
            <Filter className="w-5 h-5 mr-2" /> Filtrar
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>
      ) : videos.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">Nenhum vídeo pendente ou encontrado.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-16">Mídia</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Obrigado a Preencher</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-32">Data</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 w-48">Duração</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 w-24">Relatório</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {videos.map((video) => {
                const draft = drafts[video.id];
                if (!draft) return null;
                const isSaving = savingIds.has(video.id);

                return (
                  <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 align-top">
                      <button
                        onClick={() => handlePreview(video.id)}
                        className="w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded flex flex-col items-center justify-center relative group"
                        title="Ver vídeo"
                      >
                        {video.thumbnailPath ? (
                          <>
                            <img src={videosApi.getThumbnailUrl(video.id)} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <Play className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 space-y-2 align-top min-w-[280px]">
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => updateDraft(video.id, 'title', e.target.value)}
                        className="input font-medium text-gray-900 dark:text-white py-1.5"
                        placeholder="Título do Vídeo"
                      />
                      <select
                        value={draft.professionalId}
                        onChange={(e) => updateDraft(video.id, 'professionalId', e.target.value)}
                        className="input py-1.5 text-gray-600 dark:text-gray-300"
                      >
                        <option value="">Selecione o Editor...</option>
                        {professionals.map((prof) => (
                          <option key={prof.id} value={prof.id}>{prof.name}</option>
                        ))}
                      </select>
                      
                      <div className="flex flex-col gap-1.5 mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={draft.isTv}
                            onChange={(e) => updateDraft(video.id, 'isTv', e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">Vídeo para TV</span>
                        </label>
                        {draft.isTv && (
                          <div className="space-y-1 mt-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400 block">Título TV</label>
                            <input
                              type="text"
                              value={draft.tvTitle}
                              onChange={(e) => updateDraft(video.id, 'tvTitle', e.target.value)}
                              className="input text-sm py-1"
                              placeholder="Título do programa de TV"
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <input
                        type="date"
                        value={draft.requestDate}
                        onChange={(e) => updateDraft(video.id, 'requestDate', e.target.value)}
                        className="input py-1.5 min-w-[130px]"
                      />
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Original: <span className="font-mono text-gray-800 dark:text-gray-200">{formatDuration(video.durationSeconds)} ({video.durationSeconds}s)</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={draft.customDurationSecondsStr}
                            onChange={(e) => updateDraft(video.id, 'customDurationSecondsStr', e.target.value)}
                            className={`input py-1 w-20 text-center font-medium ${
                              draft.isCustomDurationSuggested
                                ? 'border-amber-400 dark:border-amber-500 ring-1 ring-amber-400/50 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                                : ''
                            }`}
                            placeholder="Auto"
                          />
                          <span className="text-gray-500 text-xs">seg.</span>
                        </div>
                        {draft.isCustomDurationSuggested && (
                          <span className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1 mt-0.5 animate-pulse">
                            <Check className="w-3 h-3" /> Regra 50%
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top text-center pt-5">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                          checked={draft.includeInReport}
                          onChange={(e) => updateDraft(video.id, 'includeInReport', e.target.checked)}
                        />
                      </label>
                    </td>

                    <td className="px-4 py-3 align-top text-right pt-4">
                      <button
                        onClick={() => handleSaveLine(video)}
                        disabled={isSaving}
                        className="btn-primary w-full shadow hover:shadow-md py-1.5 px-3 flex items-center justify-center gap-1"
                      >
                        {isSaving ? <LoadingSpinner size="sm" /> : <><Save className="w-4 h-4" /> Salvar</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost p-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            Página {page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="btn-ghost p-2"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <Modal
        isOpen={!!previewVideo || isLoadingVideo}
        onClose={() => {
          setPreviewVideo(null);
          setIsLoadingVideo(false);
        }}
        title=""
        size="xl"
      >
        {isLoadingVideo ? (
          <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
        ) : previewVideo ? (
          <div className="space-y-4">
            <div className="bg-black rounded-lg overflow-hidden relative w-full aspect-video">
              <video
                src={videosApi.getStreamUrl(previewVideo.id)}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{previewVideo.title}</h3>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
