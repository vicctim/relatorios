import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X, Tv, ChevronDown, ChevronUp, Check, Clock, GitBranch, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { videosApi, professionalsApi } from '../services/api';
import { Professional } from '../types';
import { LoadingSpinner, DateInput } from '../components/ui';
import { formatFileSize } from '../utils/formatters';

interface VideoFormData {
  file: File;
  title: string;
  requestDate: string;
  completionDate: string;
  professionalId: string;
  isTv: boolean;
  tvTitle: string;
  isOpen: boolean;
  isVersion: boolean;
  originalVideoIndex: number | null;
  customDurationSeconds: string;
}


export default function Upload() {
  const [videos, setVideos] = useState<VideoFormData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1);
  const [currentProgress, setCurrentProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      const response = await professionalsApi.list();
      setProfessionals(response.data.professionals);
    } catch (error) {
      console.error('Error loading professionals:', error);
    }
  };

  // Função para detectar se o nome do arquivo indica que é uma versão
  const detectVersionByKeywords = (filename: string): boolean => {
    const lowerFilename = filename.toLowerCase();
    const versionKeywords = ['stories', '1x1', '9x16', 'feed', 'vertical'];
    return versionKeywords.some(keyword => lowerFilename.includes(keyword));
  };

  // Função para encontrar o vídeo original correspondente
  const findOriginalVideoIndex = (filename: string, allVideos: VideoFormData[], currentIndex: number): number | null => {
    const cleanName = (name: string) => name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
    const currentClean = cleanName(filename);
    
    // Remover palavras-chave de versão para encontrar o original
    const versionKeywords = ['stories', '1x1', '9x16', 'feed', 'vertical'];
    let baseName = currentClean;
    for (const keyword of versionKeywords) {
      baseName = baseName.replace(new RegExp(keyword, 'gi'), '').trim();
      // Remover espaços extras e caracteres especiais
      baseName = baseName.replace(/\s+/g, ' ').trim();
    }
    
    // Procurar vídeo original que não seja versão e tenha nome similar
    for (let i = 0; i < allVideos.length; i++) {
      if (i === currentIndex) continue;
      if (allVideos[i].isVersion) continue;
      
      const otherClean = cleanName(allVideos[i].file.name);
      // Verificar se o nome base corresponde ou se o outro nome está contido no atual
      // Exemplo: "inauguracao franca stories" -> baseName = "inauguracao franca"
      //          "inauguracao franca" -> match!
      if (baseName && (otherClean === baseName || otherClean.includes(baseName) || baseName.includes(otherClean))) {
        return i;
      }
    }
    
    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setVideos((prev) => {
    const newVideos: VideoFormData[] = acceptedFiles.map((file, index) => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const isVersionAuto = detectVersionByKeywords(file.name);
        
        // Tentar encontrar o vídeo original nos vídeos já existentes
        let originalIndex: number | null = null;
        if (isVersionAuto) {
          originalIndex = findOriginalVideoIndex(file.name, prev, prev.length + index);
        }

      return {
        file,
        title: nameWithoutExt.toUpperCase(),
        requestDate: '',
        completionDate: '',
        professionalId: '',
        isTv: false,
        tvTitle: '',
        isOpen: index === 0,
          isVersion: isVersionAuto, // Detectar automaticamente por palavras-chave
          originalVideoIndex: originalIndex,
        customDurationSeconds: '',
      };
    });

      return [...prev, ...newVideos];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: true,
  });

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const addVersionToOriginal = (originalIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/quicktime';
    input.multiple = false;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const newVideo: VideoFormData = {
        file,
        title: nameWithoutExt.toUpperCase(),
        requestDate: '',
        completionDate: '',
        professionalId: '',
        isTv: false,
        tvTitle: '',
        isOpen: false,
        isVersion: true,
        originalVideoIndex: originalIndex,
        customDurationSeconds: '',
      };

      setVideos((prev) => [...prev, newVideo]);
      toast.success('Versão adicionada com sucesso!');
    };
    input.click();
  };

  const toggleAccordion = (index: number) => {
    setVideos((prev) =>
      prev.map((video, i) => ({
        ...video,
        isOpen: i === index ? !video.isOpen : video.isOpen,
      }))
    );
  };

  const updateVideo = (index: number, field: keyof VideoFormData, value: any) => {
    setVideos((prev) => {
      const video = prev[index];
      
      // Sincronização de datas: se alterar data de solicitação ou conclusão,
      // sincroniza com original/versões (unilateral - altera todos relacionados)
      if (field === 'requestDate' || field === 'completionDate') {
        const updated = prev.map((v, i) => {
          if (i === index) {
            return { ...v, [field]: value };
          }
          
          // Se é o original sendo alterado, atualiza todas as versões
          if (!video.isVersion && v.isVersion && v.originalVideoIndex === index) {
            return { ...v, [field]: value };
          }
          
          // Se é uma versão sendo alterada, atualiza o original e outras versões do mesmo original
          if (video.isVersion && video.originalVideoIndex !== null) {
            // Atualiza o original
            if (i === video.originalVideoIndex) {
              return { ...v, [field]: value };
            }
            // Atualiza outras versões do mesmo original
            if (v.isVersion && v.originalVideoIndex === video.originalVideoIndex) {
              return { ...v, [field]: value };
            }
          }
          
          return v;
        });
        
        return updated;
      }

      // Fields that should NOT be propagated from first video
      const excludedFields: (keyof VideoFormData)[] = ['title', 'file', 'isOpen'];

      // If updating the first video (index 0) and field should be propagated
      if (index === 0 && !excludedFields.includes(field)) {
        // Special handling for tvTitle - only apply if isTv is true
        if (field === 'tvTitle') {
          return prev.map((video) => ({
            ...video,
            tvTitle: video.isTv ? value : video.tvTitle,
          }));
        }

        // Apply to all videos
        return prev.map((video) => ({
          ...video,
          [field]: value,
        }));
      }

      // Otherwise, just update the specific video
      return prev.map((video, i) => (i === index ? { ...video, [field]: value } : video));
    });
  };

  const handleSubmitAll = async () => {
    // Validate all videos
    const errors: string[] = [];
    videos.forEach((video, index) => {
      if (!video.title) errors.push(`Vídeo ${index + 1}: Título é obrigatório`);
      if (!video.requestDate) errors.push(`Vídeo ${index + 1}: Data de solicitação é obrigatória`);
      if (!video.completionDate) errors.push(`Vídeo ${index + 1}: Data de conclusão é obrigatória`);
      if (!video.professionalId) errors.push(`Vídeo ${index + 1}: Profissional é obrigatório`);
      if (video.isTv && !video.tvTitle) errors.push(`Vídeo ${index + 1}: Título TV é obrigatório`);
    });

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return;
    }

    setIsUploading(true);
    setCurrentUploadIndex(0);
    setCurrentProgress(0);

    try {
      let successCount = 0;
      const uploadedVideoIds: { [index: number]: number } = {}; // Mapear índice do vídeo para ID retornado

      // Primeiro, fazer upload dos vídeos que NÃO são versões (pais)
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        
        // Pular versões na primeira passada
        if (video.isVersion && video.originalVideoIndex !== null) {
          continue;
        }

        setCurrentUploadIndex(i);
        setCurrentProgress(0);

        try {
          const response = await videosApi.upload(video.file, {
            title: video.title,
            requestDate: video.requestDate,
            completionDate: video.completionDate,
            professionalId: parseInt(video.professionalId),
            isTv: video.isTv,
            tvTitle: video.isTv ? video.tvTitle : undefined,
            customDurationSeconds: video.customDurationSeconds
              ? parseInt(video.customDurationSeconds)
              : undefined,
          }, (progress) => {
            setCurrentProgress(progress);
          });
          
          // Armazenar o ID do vídeo criado
          if (response.data && response.data.video && response.data.video.id) {
            uploadedVideoIds[i] = response.data.video.id;
          }
          
          successCount++;
        } catch (error: any) {
          const message = error.response?.data?.error || `Erro ao enviar ${video.file.name}`;
          toast.error(message);
        }
      }

      // Depois, fazer upload das versões usando o ID do vídeo original
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        
        // Processar apenas versões
        if (!video.isVersion || video.originalVideoIndex === null) {
          continue;
        }

        // Verificar se o vídeo original foi enviado com sucesso
        const originalId = uploadedVideoIds[video.originalVideoIndex];
        if (!originalId) {
          toast.error(`Erro: Vídeo original de "${video.file.name}" não foi enviado. Pulando versão.`);
          continue;
        }

        setCurrentUploadIndex(i);
        setCurrentProgress(0);

        try {
          // Usar a API de upload de versão com customDurationSeconds
          await videosApi.uploadVersion(
            originalId, 
            video.file, 
            video.customDurationSeconds ? parseInt(video.customDurationSeconds) : undefined,
            (progress) => {
              setCurrentProgress(progress);
            }
          );
          
          successCount++;
        } catch (error: any) {
          const message = error.response?.data?.error || `Erro ao enviar versão ${video.file.name}`;
          toast.error(message);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} vídeo(s) enviado(s) com sucesso!`);
        setUploadSuccess(true);
      }
    } finally {
      setIsUploading(false);
      setCurrentUploadIndex(-1);
      setCurrentProgress(0);
    }
  };

  const handleFinish = () => {
    navigate('/videos');
  };

  // Show success screen after upload
  if (uploadSuccess) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Vídeos Enviados!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Os vídeos foram processados e salvos com sucesso.
          </p>

          <div className="flex justify-center">
            <button onClick={handleFinish} className="btn-primary">
              Concluir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload de Vídeos</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Envie um ou mais vídeos para o sistema
        </p>
      </div>

      {/* Dropzone */}
      <div className="card p-6 mb-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
            }
          `}
        >
          <input {...getInputProps()} />
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {isDragActive
              ? 'Solte os arquivos aqui...'
              : 'Arraste os vídeos aqui ou clique para selecionar'}
          </p>
          <p className="text-sm text-gray-500">
            Formatos aceitos: MP4, MOV (máx. 500MB por arquivo)
          </p>
        </div>
      </div>

      {/* Video List - Grouped by Original/Versions */}
      {videos.length > 0 && (() => {
        // Agrupar vídeos: originais e suas versões
        const originalVideos: { video: VideoFormData; index: number; versions: { video: VideoFormData; index: number }[] }[] = [];
        const versionIndices = new Set<number>();

        // Primeiro, identificar todos os vídeos originais
        videos.forEach((video, index) => {
          if (!video.isVersion || video.originalVideoIndex === null) {
            originalVideos.push({
              video,
              index,
              versions: []
            });
          } else {
            versionIndices.add(index);
          }
        });

        // Depois, associar versões aos seus originais
        videos.forEach((video, index) => {
          if (video.isVersion && video.originalVideoIndex !== null) {
            const originalGroup = originalVideos.find(g => g.index === video.originalVideoIndex);
            if (originalGroup) {
              originalGroup.versions.push({ video, index });
            }
          }
        });

        return (
          <div className="space-y-6">
            {originalVideos.map((group) => (
              <div key={group.index} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Vídeo Original - Lado Esquerdo */}
                <div className="lg:col-span-1">
                  {(() => {
                    const video = group.video;
                    const index = group.index;
                    return (
                      <div className="card overflow-visible h-full" style={{ overflowY: 'auto' }}>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                <UploadIcon className="w-4 h-4 text-primary-600" />
                              </div>
                              <span className="text-xs font-medium text-primary-600 dark:text-primary-400">ORIGINAL</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {video.file.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(video.file.size)}</p>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                          {/* Title */}
                          <div>
                            <label className="label text-xs">Título</label>
                            <input
                              type="text"
                              className="input text-sm"
                              value={video.title}
                              onChange={(e) => updateVideo(index, 'title', e.target.value)}
                            />
                          </div>

                          {/* Dates */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label text-xs">Solicitação</label>
                              <DateInput
                                value={video.requestDate}
                                onChange={(value) => updateVideo(index, 'requestDate', value)}
                                placeholder="DD/MM/AAAA"
                              />
                            </div>
                            <div>
                              <label className="label text-xs">Conclusão</label>
                              <DateInput
                                value={video.completionDate}
                                onChange={(value) => updateVideo(index, 'completionDate', value)}
                                placeholder="DD/MM/AAAA"
                              />
                            </div>
                          </div>

                          {/* Professional */}
                          <div>
                            <label className="label text-xs">Profissional</label>
                            <select
                              className="input text-sm"
                              value={video.professionalId}
                              onChange={(e) => updateVideo(index, 'professionalId', e.target.value)}
                            >
                              <option value="">Selecione</option>
                              {professionals.map((prof) => (
                                <option key={prof.id} value={prof.id}>
                                  {prof.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="label text-xs">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Duração (segundos)
                            </label>
                            <input
                              type="number"
                              step="0.001"
                              className="input text-sm"
                              value={video.customDurationSeconds}
                              onChange={(e) => updateVideo(index, 'customDurationSeconds', e.target.value)}
                              placeholder="Deixe vazio para 100%"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Padrão: 100% da duração
                            </p>
                          </div>

                          {/* Version Checkbox - Para permitir marcar/desmarcar */}
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <input
                              id={`isVersion-original-${index}`}
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-primary-500"
                              checked={video.isVersion}
                              onChange={(e) => {
                                updateVideo(index, 'isVersion', e.target.checked);
                                if (!e.target.checked) {
                                  updateVideo(index, 'originalVideoIndex', null);
                                } else {
                                  // Tentar encontrar original automaticamente
                                  const originalIndex = findOriginalVideoIndex(video.file.name, videos, index);
                                  if (originalIndex !== null && originalIndex !== index) {
                                    updateVideo(index, 'originalVideoIndex', originalIndex);
                                  }
                                }
                              }}
                            />
                            <label htmlFor={`isVersion-original-${index}`} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer">
                              <GitBranch className="w-3 h-3" />
                              Marcar como versão
                            </label>
                          </div>

                          {video.isVersion && (
                            <div>
                              <label className="label text-xs">Vídeo Original</label>
                              <select
                                className="input text-sm"
                                value={video.originalVideoIndex !== null ? video.originalVideoIndex : ''}
                                onChange={(e) => {
                                  const selectedIndex = e.target.value === '' ? null : parseInt(e.target.value);
                                  updateVideo(index, 'originalVideoIndex', selectedIndex);
                                }}
                              >
                                <option value="">Selecione o vídeo original</option>
                                {videos.map((v, i) => {
                                  if (i === index) return null;
                                  if (v.isVersion) return null;
                                  return (
                                    <option key={i} value={i}>
                                      {v.file.name} - {v.title}
                                    </option>
                                  );
                                })}
                              </select>
                              {video.originalVideoIndex !== null && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Versão de: <strong>{videos[video.originalVideoIndex]?.title}</strong>
                                </p>
                              )}
                            </div>
                          )}

                          {/* TV Checkbox */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-primary-500"
                              checked={video.isTv}
                              onChange={(e) => updateVideo(index, 'isTv', e.target.checked)}
                            />
                            <label className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <Tv className="w-3 h-3" />
                              Exibição em TV
                            </label>
                          </div>

                          {video.isTv && (
                            <div>
                              <label className="label text-xs">Título TV</label>
                              <input
                                type="text"
                                className="input text-sm"
                                value={video.tvTitle}
                                onChange={(e) => updateVideo(index, 'tvTitle', e.target.value)}
                                placeholder="Título na TV"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Versões - Lado Direito */}
                <div className="lg:col-span-2" style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
                  {group.versions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.versions.map((versionGroup) => {
                        const video = versionGroup.video;
                        const index = versionGroup.index;
                        return (
                          <div key={index} className="card overflow-visible scale-90 origin-top-left" style={{ overflowY: 'auto', position: 'relative', zIndex: 1 }}>
                            {/* Header */}
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                  <GitBranch className="w-2.5 h-2.5 text-orange-600" />
                                  <span className="text-[10px] font-medium text-orange-600 dark:text-orange-400">VERSÃO</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVideo(index)}
                                  className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                >
                                  <X className="w-2.5 h-2.5 text-gray-500" />
                                </button>
                              </div>
                              <p className="text-[10px] font-medium text-gray-900 dark:text-white truncate">
                                {video.file.name}
                              </p>
                              <p className="text-[9px] text-gray-500">{formatFileSize(video.file.size)}</p>
                            </div>

                            {/* Content */}
                            <div className="p-2 space-y-1.5">
                              {/* Title */}
                              <div>
                                <label className="label text-xs">Título</label>
                                <input
                                  type="text"
                                  className="input text-sm"
                                  value={video.title}
                                  onChange={(e) => updateVideo(index, 'title', e.target.value)}
                                />
                              </div>

                              {/* Dates */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="label text-xs">Solicitação</label>
                                  <DateInput
                                    value={video.requestDate}
                                    onChange={(value) => updateVideo(index, 'requestDate', value)}
                                    placeholder="DD/MM/AAAA"
                                  />
                                </div>
                                <div>
                                  <label className="label text-xs">Conclusão</label>
                                  <DateInput
                                    value={video.completionDate}
                                    onChange={(value) => updateVideo(index, 'completionDate', value)}
                                    placeholder="DD/MM/AAAA"
                                  />
                                </div>
                              </div>

                              {/* Professional */}
                              <div>
                                <label className="label text-xs">Profissional</label>
                                <select
                                  className="input text-sm"
                                  value={video.professionalId}
                                  onChange={(e) => updateVideo(index, 'professionalId', e.target.value)}
                                >
                                  <option value="">Selecione</option>
                                  {professionals.map((prof) => (
                                    <option key={prof.id} value={prof.id}>
                                      {prof.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Duration */}
                              <div>
                                <label className="label text-xs">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Duração (segundos)
                                </label>
                                <input
                                  type="number"
                                  step="0.001"
                                  className="input text-sm"
                                  value={video.customDurationSeconds}
                                  onChange={(e) => updateVideo(index, 'customDurationSeconds', e.target.value)}
                                  placeholder="Deixe vazio para 50%"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Padrão: 50% da duração
                                </p>
                              </div>

                              {/* TV Checkbox */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-gray-300 text-primary-500"
                                  checked={video.isTv}
                                  onChange={(e) => updateVideo(index, 'isTv', e.target.checked)}
                                />
                                <label className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                  <Tv className="w-3 h-3" />
                                  Exibição em TV
                                </label>
                              </div>

                              {video.isTv && (
                                <div>
                                  <label className="label text-xs">Título TV</label>
                                  <input
                                    type="text"
                                    className="input text-sm"
                                    value={video.tvTitle}
                                    onChange={(e) => updateVideo(index, 'tvTitle', e.target.value)}
                                    placeholder="Título na TV"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Botão para adicionar nova versão */}
                      <button
                        type="button"
                        onClick={() => addVersionToOriginal(group.index)}
                        className="card p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col items-center justify-center gap-2 scale-90 origin-top-left min-h-[180px]"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Adicionar Versão
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Clique para selecionar
                        </p>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addVersionToOriginal(group.index)}
                      className="card p-4 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors w-full scale-90 origin-top-left"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Adicionar Versão
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          Clique para selecionar um arquivo
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
      
      {/* Vídeos não agrupados (fallback para vídeos que não são originais nem versões) */}
      {videos.length > 0 && (() => {
        // Recriar a lógica de agrupamento para identificar índices agrupados
        const groupedIndices = new Set<number>();
        
        // Identificar vídeos originais
        videos.forEach((video, index) => {
          if (!video.isVersion || video.originalVideoIndex === null) {
            groupedIndices.add(index);
          }
        });
        
        // Identificar versões
        videos.forEach((video, index) => {
          if (video.isVersion && video.originalVideoIndex !== null) {
            groupedIndices.add(index);
            groupedIndices.add(video.originalVideoIndex);
          }
        });

        const ungroupedVideos = videos.filter((_, i) => !groupedIndices.has(i));
        
        if (ungroupedVideos.length === 0) return null;

        return (
          <div className="space-y-4">
            {videos.map((video, index) => {
              if (groupedIndices.has(index)) return null;
              
              return (
                <div key={index} className="card overflow-hidden">
                  {/* Accordion Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggleAccordion(index)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <UploadIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {video.file.name}
                        </p>
                        <p className="text-sm text-gray-500">{formatFileSize(video.file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVideo(index);
                        }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                      {video.isOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {video.isOpen && (
                    <div className="p-6 pt-0 space-y-5 border-t border-gray-200 dark:border-gray-700">
                      {/* Title */}
                      <div>
                        <label htmlFor={`title-${index}`} className="label">
                          Título
                        </label>
                        <input
                          id={`title-${index}`}
                          type="text"
                          className="input"
                          placeholder="Título do vídeo"
                          value={video.title}
                          onChange={(e) => updateVideo(index, 'title', e.target.value)}
                        />
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`requestDate-${index}`} className="label">
                            Data de Solicitação
                          </label>
                          <DateInput
                            id={`requestDate-${index}`}
                            value={video.requestDate}
                            onChange={(value) => updateVideo(index, 'requestDate', value)}
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                        <div>
                          <label htmlFor={`completionDate-${index}`} className="label">
                            Data de Conclusão
                          </label>
                          <DateInput
                            id={`completionDate-${index}`}
                            value={video.completionDate}
                            onChange={(value) => updateVideo(index, 'completionDate', value)}
                            placeholder="DD/MM/AAAA"
                          />
                        </div>
                      </div>

                      {/* Professional */}
                      <div>
                        <label htmlFor={`professionalId-${index}`} className="label">
                          Profissional
                        </label>
                        <select
                          id={`professionalId-${index}`}
                          className="input"
                          value={video.professionalId}
                          onChange={(e) => updateVideo(index, 'professionalId', e.target.value)}
                        >
                          <option value="">Selecione o profissional</option>
                          {professionals.map((prof) => (
                            <option key={prof.id} value={prof.id}>
                              {prof.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Duration */}
                      <div>
                        <label htmlFor={`customDuration-${index}`} className="label">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Duração Considerada (segundos)</span>
                          </div>
                        </label>
                        <input
                          id={`customDuration-${index}`}
                          type="number"
                          min="0"
                          step="1"
                          className="input"
                          placeholder="Deixe vazio para 100% da duração"
                          value={video.customDurationSeconds}
                          onChange={(e) => updateVideo(index, 'customDurationSeconds', e.target.value)}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Padrão: 100% da duração do vídeo. Personalize se necessário.
                        </p>
                      </div>

                      {/* Version Checkbox and Selector */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            id={`isVersion-${index}`}
                            type="checkbox"
                            className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                            checked={video.isVersion}
                            onChange={(e) => {
                              updateVideo(index, 'isVersion', e.target.checked);
                              if (!e.target.checked) {
                                updateVideo(index, 'originalVideoIndex', null);
                              }
                            }}
                          />
                          <label htmlFor={`isVersion-${index}`} className="flex items-center gap-2 cursor-pointer">
                            <GitBranch className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300">Marcar como versão</span>
                          </label>
                        </div>

                        {video.isVersion && (
                          <div className="pl-8">
                            <label className="label">Vídeo Original</label>
                            <select
                              className="input"
                              value={video.originalVideoIndex !== null ? video.originalVideoIndex : ''}
                              onChange={(e) => {
                                const selectedIndex = e.target.value === '' ? null : parseInt(e.target.value);
                                updateVideo(index, 'originalVideoIndex', selectedIndex);
                              }}
                            >
                              <option value="">Selecione o vídeo original</option>
                              {videos.map((v, i) => {
                                if (i === index) return null; // Não pode ser versão de si mesmo
                                if (v.isVersion) return null; // Não pode selecionar outra versão como original
                                return (
                                  <option key={i} value={i}>
                                    {v.file.name} - {v.title}
                                  </option>
                                );
                              })}
                            </select>
                            {video.originalVideoIndex !== null && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Este vídeo será vinculado como versão de: <strong>{videos[video.originalVideoIndex]?.title}</strong>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* TV Checkbox */}
                      <div className="flex items-center gap-3">
                        <input
                          id={`isTv-${index}`}
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                          checked={video.isTv}
                          onChange={(e) => updateVideo(index, 'isTv', e.target.checked)}
                        />
                        <label htmlFor={`isTv-${index}`} className="flex items-center gap-2 cursor-pointer">
                          <Tv className="w-5 h-5 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">Exibição em TV</span>
                        </label>
                      </div>

                      {/* TV Title */}
                      {video.isTv && (
                        <div>
                          <label htmlFor={`tvTitle-${index}`} className="label">
                            Título na TV
                          </label>
                          <input
                            id={`tvTitle-${index}`}
                            type="text"
                            className="input"
                            placeholder="Título que aparece na programação da TV"
                            value={video.tvTitle}
                            onChange={(e) => updateVideo(index, 'tvTitle', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
      
      {/* Submit Button - Sempre visível quando há vídeos */}
      {videos.length > 0 && (
        <div className="card p-6 mt-6">
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">
                  Enviando vídeo {currentUploadIndex + 1} de {videos.length}...
                </span>
                <span className="text-gray-600 dark:text-gray-300">{currentProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={isUploading || videos.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" />
                  <span>Enviar Todos ({videos.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Código antigo removido */}
      {false && videos.length > 0 && (
        <div className="space-y-4">
          {videos.map((video, index) => (
            <div key={index} className="card overflow-hidden">
              {/* Accordion Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleAccordion(index)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <UploadIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {video.file.name}
                    </p>
                    <p className="text-sm text-gray-500">{formatFileSize(video.file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeVideo(index);
                    }}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                  {video.isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Accordion Content */}
              {video.isOpen && (
                <div className="p-6 pt-0 space-y-5 border-t border-gray-200 dark:border-gray-700">
                  {/* Title */}
                  <div>
                    <label htmlFor={`title-${index}`} className="label">
                      Título
                    </label>
                    <input
                      id={`title-${index}`}
                      type="text"
                      className="input"
                      placeholder="Título do vídeo"
                      value={video.title}
                      onChange={(e) => updateVideo(index, 'title', e.target.value)}
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`requestDate-${index}`} className="label">
                        Data de Solicitação
                      </label>
                      <DateInput
                        id={`requestDate-${index}`}
                        value={video.requestDate}
                        onChange={(value) => updateVideo(index, 'requestDate', value)}
                        placeholder="DD/MM/AAAA"
                      />
                    </div>

                    <div>
                      <label htmlFor={`completionDate-${index}`} className="label">
                        Data de Conclusão
                      </label>
                      <DateInput
                        id={`completionDate-${index}`}
                        value={video.completionDate}
                        onChange={(value) => updateVideo(index, 'completionDate', value)}
                        placeholder="DD/MM/AAAA"
                      />
                    </div>
                  </div>

                  {/* Professional */}
                  <div>
                    <label htmlFor={`professionalId-${index}`} className="label">
                      Profissional
                    </label>
                    <select
                      id={`professionalId-${index}`}
                      className="input"
                      value={video.professionalId}
                      onChange={(e) => updateVideo(index, 'professionalId', e.target.value)}
                    >
                      <option value="">Selecione o profissional</option>
                      {professionals.map((prof) => (
                        <option key={prof.id} value={prof.id}>
                          {prof.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Duration */}
                  <div>
                    <label htmlFor={`customDuration-${index}`} className="label">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Duração Considerada (segundos)</span>
                        {video.isVersion && (
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            (Versão - padrão 50%)
                          </span>
                        )}
                      </div>
                    </label>
                    <input
                      id={`customDuration-${index}`}
                      type="number"
                      min="0"
                      step="1"
                      className="input"
                      placeholder={
                        video.isVersion
                          ? "Deixe vazio para 50% automático"
                          : "Deixe vazio para 100% da duração"
                      }
                      value={video.customDurationSeconds}
                      onChange={(e) => updateVideo(index, 'customDurationSeconds', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {video.isVersion
                        ? "Padrão: 50% da duração do vídeo. Digite apenas o tempo alterado (ex: 6 segundos)."
                        : "Padrão: 100% da duração do vídeo. Personalize se necessário."}
                    </p>
                  </div>

                  {/* Version Checkbox and Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        id={`isVersion-${index}`}
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        checked={video.isVersion}
                        onChange={(e) => {
                          updateVideo(index, 'isVersion', e.target.checked);
                          if (!e.target.checked) {
                            updateVideo(index, 'originalVideoIndex', null);
                          }
                        }}
                      />
                      <label htmlFor={`isVersion-${index}`} className="flex items-center gap-2 cursor-pointer">
                        <GitBranch className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">Marcar como versão</span>
                      </label>
                    </div>

                    {video.isVersion && (
                      <div className="pl-8">
                        <label className="label">Vídeo Original</label>
                        <select
                          className="input"
                          value={video.originalVideoIndex !== null ? video.originalVideoIndex : ''}
                          onChange={(e) => {
                            const selectedIndex = e.target.value === '' ? null : parseInt(e.target.value);
                            updateVideo(index, 'originalVideoIndex', selectedIndex);
                          }}
                        >
                          <option value="">Selecione o vídeo original</option>
                          {videos.map((v, i) => {
                            if (i === index) return null; // Não pode ser versão de si mesmo
                            return (
                              <option key={i} value={i}>
                                {v.file.name} - {v.title}
                              </option>
                            );
                          })}
                        </select>
                        {video.originalVideoIndex !== null && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Este vídeo será vinculado como versão de: <strong>{videos[video.originalVideoIndex]?.title}</strong>
                          </p>
                        )}
                    </div>
                  )}
                  </div>

                  {/* TV Checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      id={`isTv-${index}`}
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      checked={video.isTv}
                      onChange={(e) => updateVideo(index, 'isTv', e.target.checked)}
                    />
                    <label htmlFor={`isTv-${index}`} className="flex items-center gap-2 cursor-pointer">
                      <Tv className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">Exibição em TV</span>
                    </label>
                  </div>

                  {/* TV Title */}
                  {video.isTv && (
                    <div className="animate-slide-down">
                      <label htmlFor={`tvTitle-${index}`} className="label">
                        Título na TV
                      </label>
                      <input
                        id={`tvTitle-${index}`}
                        type="text"
                        className="input"
                        placeholder="Título que aparece na programação da TV"
                        value={video.tvTitle}
                        onChange={(e) => updateVideo(index, 'tvTitle', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
