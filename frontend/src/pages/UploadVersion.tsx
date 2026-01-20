import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { videosApi } from '../services/api';
import { Video } from '../types';
import { LoadingSpinner } from '../components/ui';
import { formatFileSize, formatDuration } from '../utils/formatters';

export default function UploadVersion() {
  const { id } = useParams<{ id: string }>();
  const [parentVideo, setParentVideo] = useState<Video | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadParentVideo();
  }, [id]);

  const loadParentVideo = async () => {
    if (!id) {
      navigate('/videos');
      return;
    }

    try {
      const response = await videosApi.get(parseInt(id));
      const video = response.data.video;

      // Check if it's a parent video (not a version)
      if (video.parentId) {
        toast.error('Não é possível adicionar versão a uma versão');
        navigate('/videos');
        return;
      }

      setParentVideo(video);
    } catch (error) {
      toast.error('Vídeo não encontrado');
      navigate('/videos');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const handleUpload = async () => {
    if (!file || !id) return;

    setIsUploading(true);

    try {
      const response = await videosApi.uploadVersion(parseInt(id), file);
      toast.success(response.data.message || 'Versão adicional enviada com sucesso!');
      setUploadSuccess(true);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao enviar versão';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAnother = () => {
    setFile(null);
    setUploadSuccess(false);
  };

  const handleFinish = () => {
    navigate('/videos');
  };

  const removeFile = () => {
    setFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!parentVideo) {
    return null;
  }

  // Success screen
  if (uploadSuccess) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Versão Enviada!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            A versão adicional foi processada e salva com sucesso.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleAddAnother} className="btn-primary">
              Adicionar Outra Versão
            </button>
            <button onClick={handleFinish} className="btn-secondary">
              Concluir
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Adicionar Versão
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Envie uma versão adicional do vídeo
        </p>
      </div>

      {/* Parent video info */}
      <div className="card p-4 mb-6 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Vídeo Original
        </h3>
        <p className="font-semibold text-gray-900 dark:text-white">
          {parentVideo.title}
        </p>
        <div className="flex gap-4 mt-1 text-sm text-gray-500">
          <span>{parentVideo.resolutionLabel}</span>
          <span>{formatDuration(parentVideo.durationSeconds)}</span>
        </div>
        {parentVideo.versions && parentVideo.versions.length > 0 && (
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-2">
            {parentVideo.versions.length} versão(ões) já adicionada(s)
          </p>
        )}
      </div>

      {/* Dropzone */}
      <div className="card p-6">
        {!file ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-colors duration-200
              ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {isDragActive
                ? 'Solte o arquivo aqui...'
                : 'Arraste o vídeo aqui ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-500">
              Formatos aceitos: MP4, MOV (máx. 500MB)
            </p>
            <p className="text-sm text-primary-600 dark:text-primary-400 mt-2">
              Versões contam como 50% da duração original
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <UploadIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={removeFile} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="btn-primary flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-5 h-5" />
                    <span>Enviar Versão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
