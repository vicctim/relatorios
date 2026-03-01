import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X, Check, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { videosApi } from '../services/api';
import { LoadingSpinner } from '../components/ui';
import { formatFileSize, formatDuration } from '../utils/formatters';
export default function UploadVersion() {
    const { id } = useParams();
    const [parentVideo, setParentVideo] = useState(null);
    const [file, setFile] = useState(null);
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
        }
        catch (error) {
            toast.error('Vídeo não encontrado');
            navigate('/videos');
        }
        finally {
            setIsLoading(false);
        }
    };
    const onDrop = useCallback((acceptedFiles) => {
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
        if (!file || !id)
            return;
        setIsUploading(true);
        try {
            const response = await videosApi.uploadVersion(parseInt(id), file);
            toast.success(response.data.message || 'Versão adicional enviada com sucesso!');
            setUploadSuccess(true);
        }
        catch (error) {
            const message = error.response?.data?.error || 'Erro ao enviar versão';
            toast.error(message);
        }
        finally {
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
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (!parentVideo) {
        return null;
    }
    // Success screen
    if (uploadSuccess) {
        return (_jsx("div", { className: "max-w-2xl mx-auto animate-fade-in", children: _jsxs("div", { className: "card p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4", children: _jsx(Check, { className: "w-8 h-8 text-green-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "Vers\u00E3o Enviada!" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 mb-6", children: "A vers\u00E3o adicional foi processada e salva com sucesso." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 justify-center", children: [_jsx("button", { onClick: handleAddAnother, className: "btn-primary", children: "Adicionar Outra Vers\u00E3o" }), _jsx("button", { onClick: handleFinish, className: "btn-secondary", children: "Concluir" })] })] }) }));
    }
    return (_jsxs("div", { className: "max-w-2xl mx-auto animate-fade-in", children: [_jsxs("button", { onClick: () => navigate(-1), className: "flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4", children: [_jsx(ArrowLeft, { className: "w-5 h-5" }), "Voltar"] }), _jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Adicionar Vers\u00E3o" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Envie uma vers\u00E3o adicional do v\u00EDdeo" })] }), _jsxs("div", { className: "card p-4 mb-6 bg-gray-50 dark:bg-gray-800/50", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 dark:text-gray-400 mb-2", children: "V\u00EDdeo Original" }), _jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: parentVideo.title }), _jsxs("div", { className: "flex gap-4 mt-1 text-sm text-gray-500", children: [_jsx("span", { children: parentVideo.resolutionLabel }), _jsx("span", { children: formatDuration(parentVideo.durationSeconds) })] }), parentVideo.versions && parentVideo.versions.length > 0 && (_jsxs("p", { className: "text-sm text-primary-600 dark:text-primary-400 mt-2", children: [parentVideo.versions.length, " vers\u00E3o(\u00F5es) j\u00E1 adicionada(s)"] }))] }), _jsx("div", { className: "card p-6", children: !file ? (_jsxs("div", { ...getRootProps(), className: `
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}
            `, children: [_jsx("input", { ...getInputProps() }), _jsx(UploadIcon, { className: "w-12 h-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-2", children: isDragActive
                                ? 'Solte o arquivo aqui...'
                                : 'Arraste o vídeo aqui ou clique para selecionar' }), _jsx("p", { className: "text-sm text-gray-500", children: "Formatos aceitos: MP4, MOV (m\u00E1x. 500MB)" }), _jsx("p", { className: "text-sm text-primary-600 dark:text-primary-400 mt-2", children: "Vers\u00F5es contam como 50% da dura\u00E7\u00E3o original" })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl", children: [_jsx("div", { className: "w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center", children: _jsx(UploadIcon, { className: "w-6 h-6 text-primary-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white truncate", children: file.name }), _jsx("p", { className: "text-sm text-gray-500", children: formatFileSize(file.size) })] }), _jsx("button", { type: "button", onClick: removeFile, className: "p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { onClick: removeFile, className: "btn-secondary", children: "Cancelar" }), _jsx("button", { onClick: handleUpload, disabled: isUploading, className: "btn-primary flex items-center gap-2", children: isUploading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm" }), _jsx("span", { children: "Enviando..." })] })) : (_jsxs(_Fragment, { children: [_jsx(UploadIcon, { className: "w-5 h-5" }), _jsx("span", { children: "Enviar Vers\u00E3o" })] })) })] })] })) })] }));
}
