import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X, Tv, ChevronDown, ChevronUp, Check, Clock, GitBranch, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { videosApi, professionalsApi } from '../services/api';
import { LoadingSpinner, DateInput } from '../components/ui';
import { formatFileSize } from '../utils/formatters';
export default function Upload() {
    const [videos, setVideos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [professionals, setProfessionals] = useState([]);
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
        }
        catch (error) {
            console.error('Error loading professionals:', error);
        }
    };
    // Função para detectar se o nome do arquivo indica que é uma versão
    const detectVersionByKeywords = (filename) => {
        const lowerFilename = filename.toLowerCase();
        const versionKeywords = ['stories', '1x1', '9x16', 'feed', 'vertical'];
        return versionKeywords.some(keyword => lowerFilename.includes(keyword));
    };
    // Função para encontrar o vídeo original correspondente
    const findOriginalVideoIndex = (filename, allVideos, currentIndex) => {
        const cleanName = (name) => name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
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
            if (i === currentIndex)
                continue;
            if (allVideos[i].isVersion)
                continue;
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
    const onDrop = useCallback((acceptedFiles) => {
        setVideos((prev) => {
            const newVideos = acceptedFiles.map((file, index) => {
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                const isVersionAuto = detectVersionByKeywords(file.name);
                // Tentar encontrar o vídeo original nos vídeos já existentes
                let originalIndex = null;
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
    const removeVideo = (index) => {
        setVideos((prev) => prev.filter((_, i) => i !== index));
    };
    const addVersionToOriginal = (originalIndex) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/mp4,video/quicktime';
        input.multiple = false;
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            const newVideo = {
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
    const toggleAccordion = (index) => {
        setVideos((prev) => prev.map((video, i) => ({
            ...video,
            isOpen: i === index ? !video.isOpen : video.isOpen,
        })));
    };
    const updateVideo = (index, field, value) => {
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
            const excludedFields = ['title', 'file', 'isOpen'];
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
        const errors = [];
        videos.forEach((video, index) => {
            if (!video.title)
                errors.push(`Vídeo ${index + 1}: Título é obrigatório`);
            if (!video.requestDate)
                errors.push(`Vídeo ${index + 1}: Data de solicitação é obrigatória`);
            if (!video.completionDate)
                errors.push(`Vídeo ${index + 1}: Data de conclusão é obrigatória`);
            if (!video.professionalId)
                errors.push(`Vídeo ${index + 1}: Profissional é obrigatório`);
            if (video.isTv && !video.tvTitle)
                errors.push(`Vídeo ${index + 1}: Título TV é obrigatório`);
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
            const uploadedVideoIds = {}; // Mapear índice do vídeo para ID retornado
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
                }
                catch (error) {
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
                    await videosApi.uploadVersion(originalId, video.file, video.customDurationSeconds ? parseInt(video.customDurationSeconds) : undefined, (progress) => {
                        setCurrentProgress(progress);
                    });
                    successCount++;
                }
                catch (error) {
                    const message = error.response?.data?.error || `Erro ao enviar versão ${video.file.name}`;
                    toast.error(message);
                }
            }
            if (successCount > 0) {
                toast.success(`${successCount} vídeo(s) enviado(s) com sucesso!`);
                setUploadSuccess(true);
            }
        }
        finally {
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
        return (_jsx("div", { className: "max-w-2xl mx-auto animate-fade-in", children: _jsxs("div", { className: "card p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4", children: _jsx(Check, { className: "w-8 h-8 text-green-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 dark:text-white mb-2", children: "V\u00EDdeos Enviados!" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 mb-6", children: "Os v\u00EDdeos foram processados e salvos com sucesso." }), _jsx("div", { className: "flex justify-center", children: _jsx("button", { onClick: handleFinish, className: "btn-primary", children: "Concluir" }) })] }) }));
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto animate-fade-in", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Upload de V\u00EDdeos" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Envie um ou mais v\u00EDdeos para o sistema" })] }), _jsx("div", { className: "card p-6 mb-6", children: _jsxs("div", { ...getRootProps(), className: `
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'}
          `, children: [_jsx("input", { ...getInputProps() }), _jsx(UploadIcon, { className: "w-12 h-12 mx-auto text-gray-400 mb-4" }), _jsx("p", { className: "text-gray-600 dark:text-gray-300 mb-2", children: isDragActive
                                ? 'Solte os arquivos aqui...'
                                : 'Arraste os vídeos aqui ou clique para selecionar' }), _jsx("p", { className: "text-sm text-gray-500", children: "Formatos aceitos: MP4, MOV (m\u00E1x. 500MB por arquivo)" })] }) }), videos.length > 0 && (() => {
                // Agrupar vídeos: originais e suas versões
                const originalVideos = [];
                const versionIndices = new Set();
                // Primeiro, identificar todos os vídeos originais
                videos.forEach((video, index) => {
                    if (!video.isVersion || video.originalVideoIndex === null) {
                        originalVideos.push({
                            video,
                            index,
                            versions: []
                        });
                    }
                    else {
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
                return (_jsx("div", { className: "space-y-6", children: originalVideos.map((group) => (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsx("div", { className: "lg:col-span-1", children: (() => {
                                    const video = group.video;
                                    const index = group.index;
                                    return (_jsxs("div", { className: "card overflow-visible h-full", style: { overflowY: 'auto' }, children: [_jsxs("div", { className: "p-4 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center", children: _jsx(UploadIcon, { className: "w-4 h-4 text-primary-600" }) }), _jsx("span", { className: "text-xs font-medium text-primary-600 dark:text-primary-400", children: "ORIGINAL" })] }), _jsx("button", { type: "button", onClick: () => removeVideo(index), className: "p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded", children: _jsx(X, { className: "w-4 h-4 text-gray-500" }) })] }), _jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: video.file.name }), _jsx("p", { className: "text-xs text-gray-500", children: formatFileSize(video.file.size) })] }), _jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "T\u00EDtulo" }), _jsx("input", { type: "text", className: "input text-sm", value: video.title, onChange: (e) => updateVideo(index, 'title', e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "Solicita\u00E7\u00E3o" }), _jsx(DateInput, { value: video.requestDate, onChange: (value) => updateVideo(index, 'requestDate', value), placeholder: "DD/MM/AAAA" })] }), _jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "Conclus\u00E3o" }), _jsx(DateInput, { value: video.completionDate, onChange: (value) => updateVideo(index, 'completionDate', value), placeholder: "DD/MM/AAAA" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "Profissional" }), _jsxs("select", { className: "input text-sm", value: video.professionalId, onChange: (e) => updateVideo(index, 'professionalId', e.target.value), children: [_jsx("option", { value: "", children: "Selecione" }), professionals.map((prof) => (_jsx("option", { value: prof.id, children: prof.name }, prof.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "label text-xs", children: [_jsx(Clock, { className: "w-3 h-3 inline mr-1" }), "Dura\u00E7\u00E3o (segundos)"] }), _jsx("input", { type: "number", step: "0.001", className: "input text-sm", value: video.customDurationSeconds, onChange: (e) => updateVideo(index, 'customDurationSeconds', e.target.value), placeholder: "Deixe vazio para 100%" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Padr\u00E3o: 100% da dura\u00E7\u00E3o" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700", children: [_jsx("input", { id: `isVersion-original-${index}`, type: "checkbox", className: "w-4 h-4 rounded border-gray-300 text-primary-500", checked: video.isVersion, onChange: (e) => {
                                                                    updateVideo(index, 'isVersion', e.target.checked);
                                                                    if (!e.target.checked) {
                                                                        updateVideo(index, 'originalVideoIndex', null);
                                                                    }
                                                                    else {
                                                                        // Tentar encontrar original automaticamente
                                                                        const originalIndex = findOriginalVideoIndex(video.file.name, videos, index);
                                                                        if (originalIndex !== null && originalIndex !== index) {
                                                                            updateVideo(index, 'originalVideoIndex', originalIndex);
                                                                        }
                                                                    }
                                                                } }), _jsxs("label", { htmlFor: `isVersion-original-${index}`, className: "text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer", children: [_jsx(GitBranch, { className: "w-3 h-3" }), "Marcar como vers\u00E3o"] })] }), video.isVersion && (_jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "V\u00EDdeo Original" }), _jsxs("select", { className: "input text-sm", value: video.originalVideoIndex !== null ? video.originalVideoIndex : '', onChange: (e) => {
                                                                    const selectedIndex = e.target.value === '' ? null : parseInt(e.target.value);
                                                                    updateVideo(index, 'originalVideoIndex', selectedIndex);
                                                                }, children: [_jsx("option", { value: "", children: "Selecione o v\u00EDdeo original" }), videos.map((v, i) => {
                                                                        if (i === index)
                                                                            return null;
                                                                        if (v.isVersion)
                                                                            return null;
                                                                        return (_jsxs("option", { value: i, children: [v.file.name, " - ", v.title] }, i));
                                                                    })] }), video.originalVideoIndex !== null && (_jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: ["Vers\u00E3o de: ", _jsx("strong", { children: videos[video.originalVideoIndex]?.title })] }))] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "w-4 h-4 rounded border-gray-300 text-primary-500", checked: video.isTv, onChange: (e) => updateVideo(index, 'isTv', e.target.checked) }), _jsxs("label", { className: "text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1", children: [_jsx(Tv, { className: "w-3 h-3" }), "Exibi\u00E7\u00E3o em TV"] })] }), video.isTv && (_jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "T\u00EDtulo TV" }), _jsx("input", { type: "text", className: "input text-sm", value: video.tvTitle, onChange: (e) => updateVideo(index, 'tvTitle', e.target.value), placeholder: "T\u00EDtulo na TV" })] }))] })] }));
                                })() }), _jsx("div", { className: "lg:col-span-2", style: { position: 'relative', zIndex: 1, overflow: 'visible' }, children: group.versions.length > 0 ? (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [group.versions.map((versionGroup) => {
                                            const video = versionGroup.video;
                                            const index = versionGroup.index;
                                            return (_jsxs("div", { className: "card overflow-visible scale-90 origin-top-left", style: { overflowY: 'auto', position: 'relative', zIndex: 1 }, children: [_jsxs("div", { className: "p-2 border-b border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(GitBranch, { className: "w-2.5 h-2.5 text-orange-600" }), _jsx("span", { className: "text-[10px] font-medium text-orange-600 dark:text-orange-400", children: "VERS\u00C3O" })] }), _jsx("button", { type: "button", onClick: () => removeVideo(index), className: "p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded", children: _jsx(X, { className: "w-2.5 h-2.5 text-gray-500" }) })] }), _jsx("p", { className: "text-[10px] font-medium text-gray-900 dark:text-white truncate", children: video.file.name }), _jsx("p", { className: "text-[9px] text-gray-500", children: formatFileSize(video.file.size) })] }), _jsxs("div", { className: "p-2 space-y-1.5", children: [_jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "T\u00EDtulo" }), _jsx("input", { type: "text", className: "input text-sm", value: video.title, onChange: (e) => updateVideo(index, 'title', e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "Solicita\u00E7\u00E3o" }), _jsx(DateInput, { value: video.requestDate, onChange: (value) => updateVideo(index, 'requestDate', value), placeholder: "DD/MM/AAAA" })] }), _jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "Conclus\u00E3o" }), _jsx(DateInput, { value: video.completionDate, onChange: (value) => updateVideo(index, 'completionDate', value), placeholder: "DD/MM/AAAA" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "Profissional" }), _jsxs("select", { className: "input text-sm", value: video.professionalId, onChange: (e) => updateVideo(index, 'professionalId', e.target.value), children: [_jsx("option", { value: "", children: "Selecione" }), professionals.map((prof) => (_jsx("option", { value: prof.id, children: prof.name }, prof.id)))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "label text-xs", children: [_jsx(Clock, { className: "w-3 h-3 inline mr-1" }), "Dura\u00E7\u00E3o (segundos)"] }), _jsx("input", { type: "number", step: "0.001", className: "input text-sm", value: video.customDurationSeconds, onChange: (e) => updateVideo(index, 'customDurationSeconds', e.target.value), placeholder: "Deixe vazio para 50%" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Padr\u00E3o: 50% da dura\u00E7\u00E3o" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", className: "w-4 h-4 rounded border-gray-300 text-primary-500", checked: video.isTv, onChange: (e) => updateVideo(index, 'isTv', e.target.checked) }), _jsxs("label", { className: "text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1", children: [_jsx(Tv, { className: "w-3 h-3" }), "Exibi\u00E7\u00E3o em TV"] })] }), video.isTv && (_jsxs("div", { children: [_jsx("label", { className: "label text-xs", children: "T\u00EDtulo TV" }), _jsx("input", { type: "text", className: "input text-sm", value: video.tvTitle, onChange: (e) => updateVideo(index, 'tvTitle', e.target.value), placeholder: "T\u00EDtulo na TV" })] }))] })] }, index));
                                        }), _jsxs("button", { type: "button", onClick: () => addVersionToOriginal(group.index), className: "card p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col items-center justify-center gap-2 scale-90 origin-top-left min-h-[180px]", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center", children: _jsx(Plus, { className: "w-5 h-5 text-primary-600 dark:text-primary-400" }) }), _jsx("p", { className: "text-xs font-medium text-gray-700 dark:text-gray-300", children: "Adicionar Vers\u00E3o" }), _jsx("p", { className: "text-[10px] text-gray-500 dark:text-gray-400", children: "Clique para selecionar" })] })] })) : (_jsx("button", { type: "button", onClick: () => addVersionToOriginal(group.index), className: "card p-4 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors w-full scale-90 origin-top-left", children: _jsxs("div", { className: "flex flex-col items-center justify-center gap-2", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center", children: _jsx(Plus, { className: "w-5 h-5 text-primary-600 dark:text-primary-400" }) }), _jsx("p", { className: "text-xs font-medium text-gray-700 dark:text-gray-300", children: "Adicionar Vers\u00E3o" }), _jsx("p", { className: "text-[10px] text-gray-500 dark:text-gray-400", children: "Clique para selecionar um arquivo" })] }) })) })] }, group.index))) }));
            })(), videos.length > 0 && (() => {
                // Recriar a lógica de agrupamento para identificar índices agrupados
                const groupedIndices = new Set();
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
                if (ungroupedVideos.length === 0)
                    return null;
                return (_jsx("div", { className: "space-y-4", children: videos.map((video, index) => {
                        if (groupedIndices.has(index))
                            return null;
                        return (_jsxs("div", { className: "card overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors", onClick: () => toggleAccordion(index), children: [_jsxs("div", { className: "flex items-center gap-4 flex-1 min-w-0", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0", children: _jsx(UploadIcon, { className: "w-5 h-5 text-primary-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white truncate", children: video.file.name }), _jsx("p", { className: "text-sm text-gray-500", children: formatFileSize(video.file.size) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: (e) => {
                                                        e.stopPropagation();
                                                        removeVideo(index);
                                                    }, className: "p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) }), video.isOpen ? (_jsx(ChevronUp, { className: "w-5 h-5 text-gray-500" })) : (_jsx(ChevronDown, { className: "w-5 h-5 text-gray-500" }))] })] }), video.isOpen && (_jsxs("div", { className: "p-6 pt-0 space-y-5 border-t border-gray-200 dark:border-gray-700", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: `title-${index}`, className: "label", children: "T\u00EDtulo" }), _jsx("input", { id: `title-${index}`, type: "text", className: "input", placeholder: "T\u00EDtulo do v\u00EDdeo", value: video.title, onChange: (e) => updateVideo(index, 'title', e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: `requestDate-${index}`, className: "label", children: "Data de Solicita\u00E7\u00E3o" }), _jsx(DateInput, { id: `requestDate-${index}`, value: video.requestDate, onChange: (value) => updateVideo(index, 'requestDate', value), placeholder: "DD/MM/AAAA" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `completionDate-${index}`, className: "label", children: "Data de Conclus\u00E3o" }), _jsx(DateInput, { id: `completionDate-${index}`, value: video.completionDate, onChange: (value) => updateVideo(index, 'completionDate', value), placeholder: "DD/MM/AAAA" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `professionalId-${index}`, className: "label", children: "Profissional" }), _jsxs("select", { id: `professionalId-${index}`, className: "input", value: video.professionalId, onChange: (e) => updateVideo(index, 'professionalId', e.target.value), children: [_jsx("option", { value: "", children: "Selecione o profissional" }), professionals.map((prof) => (_jsx("option", { value: prof.id, children: prof.name }, prof.id)))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `customDuration-${index}`, className: "label", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("span", { children: "Dura\u00E7\u00E3o Considerada (segundos)" })] }) }), _jsx("input", { id: `customDuration-${index}`, type: "number", min: "0", step: "1", className: "input", placeholder: "Deixe vazio para 100% da dura\u00E7\u00E3o", value: video.customDurationSeconds, onChange: (e) => updateVideo(index, 'customDurationSeconds', e.target.value) }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: "Padr\u00E3o: 100% da dura\u00E7\u00E3o do v\u00EDdeo. Personalize se necess\u00E1rio." })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { id: `isVersion-${index}`, type: "checkbox", className: "w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500", checked: video.isVersion, onChange: (e) => {
                                                                updateVideo(index, 'isVersion', e.target.checked);
                                                                if (!e.target.checked) {
                                                                    updateVideo(index, 'originalVideoIndex', null);
                                                                }
                                                            } }), _jsxs("label", { htmlFor: `isVersion-${index}`, className: "flex items-center gap-2 cursor-pointer", children: [_jsx(GitBranch, { className: "w-5 h-5 text-gray-500" }), _jsx("span", { className: "text-gray-700 dark:text-gray-300", children: "Marcar como vers\u00E3o" })] })] }), video.isVersion && (_jsxs("div", { className: "pl-8", children: [_jsx("label", { className: "label", children: "V\u00EDdeo Original" }), _jsxs("select", { className: "input", value: video.originalVideoIndex !== null ? video.originalVideoIndex : '', onChange: (e) => {
                                                                const selectedIndex = e.target.value === '' ? null : parseInt(e.target.value);
                                                                updateVideo(index, 'originalVideoIndex', selectedIndex);
                                                            }, children: [_jsx("option", { value: "", children: "Selecione o v\u00EDdeo original" }), videos.map((v, i) => {
                                                                    if (i === index)
                                                                        return null; // Não pode ser versão de si mesmo
                                                                    if (v.isVersion)
                                                                        return null; // Não pode selecionar outra versão como original
                                                                    return (_jsxs("option", { value: i, children: [v.file.name, " - ", v.title] }, i));
                                                                })] }), video.originalVideoIndex !== null && (_jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: ["Este v\u00EDdeo ser\u00E1 vinculado como vers\u00E3o de: ", _jsx("strong", { children: videos[video.originalVideoIndex]?.title })] }))] }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { id: `isTv-${index}`, type: "checkbox", className: "w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500", checked: video.isTv, onChange: (e) => updateVideo(index, 'isTv', e.target.checked) }), _jsxs("label", { htmlFor: `isTv-${index}`, className: "flex items-center gap-2 cursor-pointer", children: [_jsx(Tv, { className: "w-5 h-5 text-gray-500" }), _jsx("span", { className: "text-gray-700 dark:text-gray-300", children: "Exibi\u00E7\u00E3o em TV" })] })] }), video.isTv && (_jsxs("div", { children: [_jsx("label", { htmlFor: `tvTitle-${index}`, className: "label", children: "T\u00EDtulo na TV" }), _jsx("input", { id: `tvTitle-${index}`, type: "text", className: "input", placeholder: "T\u00EDtulo que aparece na programa\u00E7\u00E3o da TV", value: video.tvTitle, onChange: (e) => updateVideo(index, 'tvTitle', e.target.value) })] }))] }))] }, index));
                    }) }));
            })(), videos.length > 0 && (_jsxs("div", { className: "card p-6 mt-6", children: [isUploading && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsxs("span", { className: "text-gray-600 dark:text-gray-300", children: ["Enviando v\u00EDdeo ", currentUploadIndex + 1, " de ", videos.length, "..."] }), _jsxs("span", { className: "text-gray-600 dark:text-gray-300", children: [currentProgress, "%"] })] }), _jsx("div", { className: "w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-primary-500 transition-all duration-300", style: { width: `${currentProgress}%` } }) })] })), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "button", onClick: handleSubmitAll, disabled: isUploading || videos.length === 0, className: "btn-primary flex items-center gap-2", children: isUploading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm" }), _jsx("span", { children: "Processando..." })] })) : (_jsxs(_Fragment, { children: [_jsx(UploadIcon, { className: "w-5 h-5" }), _jsxs("span", { children: ["Enviar Todos (", videos.length, ")"] })] })) }) })] })), false && videos.length > 0 && (_jsx("div", { className: "space-y-4", children: videos.map((video, index) => (_jsxs("div", { className: "card overflow-hidden", children: [_jsxs("div", { className: "flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors", onClick: () => toggleAccordion(index), children: [_jsxs("div", { className: "flex items-center gap-4 flex-1 min-w-0", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0", children: _jsx(UploadIcon, { className: "w-5 h-5 text-primary-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-gray-900 dark:text-white truncate", children: video.file.name }), _jsx("p", { className: "text-sm text-gray-500", children: formatFileSize(video.file.size) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: (e) => {
                                                e.stopPropagation();
                                                removeVideo(index);
                                            }, className: "p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg", children: _jsx(X, { className: "w-5 h-5 text-gray-500" }) }), video.isOpen ? (_jsx(ChevronUp, { className: "w-5 h-5 text-gray-500" })) : (_jsx(ChevronDown, { className: "w-5 h-5 text-gray-500" }))] })] }), video.isOpen && (_jsxs("div", { className: "p-6 pt-0 space-y-5 border-t border-gray-200 dark:border-gray-700", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: `title-${index}`, className: "label", children: "T\u00EDtulo" }), _jsx("input", { id: `title-${index}`, type: "text", className: "input", placeholder: "T\u00EDtulo do v\u00EDdeo", value: video.title, onChange: (e) => updateVideo(index, 'title', e.target.value) })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: `requestDate-${index}`, className: "label", children: "Data de Solicita\u00E7\u00E3o" }), _jsx(DateInput, { id: `requestDate-${index}`, value: video.requestDate, onChange: (value) => updateVideo(index, 'requestDate', value), placeholder: "DD/MM/AAAA" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `completionDate-${index}`, className: "label", children: "Data de Conclus\u00E3o" }), _jsx(DateInput, { id: `completionDate-${index}`, value: video.completionDate, onChange: (value) => updateVideo(index, 'completionDate', value), placeholder: "DD/MM/AAAA" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `professionalId-${index}`, className: "label", children: "Profissional" }), _jsxs("select", { id: `professionalId-${index}`, className: "input", value: video.professionalId, onChange: (e) => updateVideo(index, 'professionalId', e.target.value), children: [_jsx("option", { value: "", children: "Selecione o profissional" }), professionals.map((prof) => (_jsx("option", { value: prof.id, children: prof.name }, prof.id)))] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: `customDuration-${index}`, className: "label", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("span", { children: "Dura\u00E7\u00E3o Considerada (segundos)" }), video.isVersion && (_jsx("span", { className: "text-xs text-orange-600 dark:text-orange-400", children: "(Vers\u00E3o - padr\u00E3o 50%)" }))] }) }), _jsx("input", { id: `customDuration-${index}`, type: "number", min: "0", step: "1", className: "input", placeholder: video.isVersion
                                                ? "Deixe vazio para 50% automático"
                                                : "Deixe vazio para 100% da duração", value: video.customDurationSeconds, onChange: (e) => updateVideo(index, 'customDurationSeconds', e.target.value) }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: video.isVersion
                                                ? "Padrão: 50% da duração do vídeo. Digite apenas o tempo alterado (ex: 6 segundos)."
                                                : "Padrão: 100% da duração do vídeo. Personalize se necessário." })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { id: `isVersion-${index}`, type: "checkbox", className: "w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500", checked: video.isVersion, onChange: (e) => {
                                                        updateVideo(index, 'isVersion', e.target.checked);
                                                        if (!e.target.checked) {
                                                            updateVideo(index, 'originalVideoIndex', null);
                                                        }
                                                    } }), _jsxs("label", { htmlFor: `isVersion-${index}`, className: "flex items-center gap-2 cursor-pointer", children: [_jsx(GitBranch, { className: "w-5 h-5 text-gray-500" }), _jsx("span", { className: "text-gray-700 dark:text-gray-300", children: "Marcar como vers\u00E3o" })] })] }), video.isVersion && (_jsxs("div", { className: "pl-8", children: [_jsx("label", { className: "label", children: "V\u00EDdeo Original" }), _jsxs("select", { className: "input", value: video.originalVideoIndex !== null ? video.originalVideoIndex : '', onChange: (e) => {
                                                        const selectedIndex = e.target.value === '' ? null : parseInt(e.target.value);
                                                        updateVideo(index, 'originalVideoIndex', selectedIndex);
                                                    }, children: [_jsx("option", { value: "", children: "Selecione o v\u00EDdeo original" }), videos.map((v, i) => {
                                                            if (i === index)
                                                                return null; // Não pode ser versão de si mesmo
                                                            return (_jsxs("option", { value: i, children: [v.file.name, " - ", v.title] }, i));
                                                        })] }), video.originalVideoIndex !== null && (_jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: ["Este v\u00EDdeo ser\u00E1 vinculado como vers\u00E3o de: ", _jsx("strong", { children: videos[video.originalVideoIndex]?.title })] }))] }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { id: `isTv-${index}`, type: "checkbox", className: "w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500", checked: video.isTv, onChange: (e) => updateVideo(index, 'isTv', e.target.checked) }), _jsxs("label", { htmlFor: `isTv-${index}`, className: "flex items-center gap-2 cursor-pointer", children: [_jsx(Tv, { className: "w-5 h-5 text-gray-500" }), _jsx("span", { className: "text-gray-700 dark:text-gray-300", children: "Exibi\u00E7\u00E3o em TV" })] })] }), video.isTv && (_jsxs("div", { className: "animate-slide-down", children: [_jsx("label", { htmlFor: `tvTitle-${index}`, className: "label", children: "T\u00EDtulo na TV" }), _jsx("input", { id: `tvTitle-${index}`, type: "text", className: "input", placeholder: "T\u00EDtulo que aparece na programa\u00E7\u00E3o da TV", value: video.tvTitle, onChange: (e) => updateVideo(index, 'tvTitle', e.target.value) })] }))] }))] }, index))) }))] }));
}
