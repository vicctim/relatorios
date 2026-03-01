import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Copy, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import Modal from './ui/Modal';
import { sharesApi, videosApi } from '../services/api';
import toast from 'react-hot-toast';
export default function ShareModal({ isOpen, onClose, videoIds }) {
    const [loading, setLoading] = useState(false);
    const [checkingExisting, setCheckingExisting] = useState(false);
    const [generatedLink, setGeneratedLink] = useState(null);
    const [copied, setCopied] = useState(false);
    const [existingShare, setExistingShare] = useState(null);
    const [versionsCount, setVersionsCount] = useState(0);
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    // Form state - apenas um campo
    const [linkName, setLinkName] = useState('');
    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setGeneratedLink(null);
            setLinkName('');
            setCopied(false);
            setExistingShare(null);
            setVersionsCount(0);
            checkForExistingShare();
            loadVersionsCount();
        }
    }, [isOpen, videoIds]);
    const loadVersionsCount = async () => {
        if (!videoIds.length)
            return;
        try {
            setIsLoadingVersions(true);
            // Buscar informações de todos os vídeos em paralelo
            const videoPromises = videoIds.map(videoId => videosApi.get(videoId).catch(error => {
                console.error(`Error loading video ${videoId}:`, error);
                return null;
            }));
            const responses = await Promise.all(videoPromises);
            let totalVersions = 0;
            responses.forEach(response => {
                if (response && response.data) {
                    const video = response.data.video || response.data;
                    if (video.versions && Array.isArray(video.versions)) {
                        totalVersions += video.versions.length;
                    }
                }
            });
            setVersionsCount(totalVersions);
        }
        catch (error) {
            console.error('Error loading versions count:', error);
        }
        finally {
            setIsLoadingVersions(false);
        }
    };
    const checkForExistingShare = async () => {
        if (!videoIds.length)
            return;
        try {
            setCheckingExisting(true);
            const response = await sharesApi.checkExisting(videoIds);
            if (response.data.existing) {
                setExistingShare(response.data.existing);
            }
        }
        catch (error) {
            console.error('Error checking existing share:', error);
        }
        finally {
            setCheckingExisting(false);
        }
    };
    const handleUseExisting = () => {
        if (!existingShare)
            return;
        const slug = existingShare.customSlug || existingShare.token;
        const link = `${window.location.origin}/s/${slug}`;
        setGeneratedLink(link);
    };
    const handleCreate = async () => {
        if (!videoIds.length)
            return;
        try {
            setLoading(true);
            const response = await sharesApi.create({
                videoIds,
                name: linkName || undefined,
                customSlug: linkName || undefined,
            });
            const slug = response.data.customSlug || response.data.token;
            const link = `${window.location.origin}/s/${slug}`;
            setGeneratedLink(link);
            toast.success('Link criado com sucesso!');
        }
        catch (error) {
            console.error('Error creating share link:', error);
            if (error.response?.status === 400) {
                toast.error('Nome já está em uso. Tente outro.');
            }
            else {
                toast.error('Erro ao criar link');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleCopy = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Link copiado!');
        }
    };
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: "Compartilhar V\u00EDdeos", children: !generatedLink ? (_jsxs("div", { className: "space-y-5", children: [checkingExisting ? (_jsx("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" }), _jsx("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: "Verificando compartilhamentos existentes..." })] }) })) : existingShare ? (_jsx("div", { className: "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4", children: _jsxs("div", { className: "flex gap-3", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1", children: "Link j\u00E1 existe para estes v\u00EDdeos" }), _jsxs("p", { className: "text-sm text-yellow-700 dark:text-yellow-400 mb-3", children: [existingShare.name || 'Compartilhamento', " \u2022 ", existingShare.downloads, " download(s)"] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { onClick: handleUseExisting, className: "px-4 py-2 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors", children: "Usar link existente" }), _jsx("button", { onClick: () => setExistingShare(null), className: "px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors", children: "Criar novo" })] })] })] }) })) : (_jsx("div", { className: "text-center py-2", children: _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: isLoadingVersions ? (_jsx("span", { children: "Carregando informa\u00E7\u00F5es..." })) : (_jsxs(_Fragment, { children: ["Compartilhando ", _jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: videoIds.length }), " v\u00EDdeo", videoIds.length !== 1 ? 's' : '', versionsCount > 0 && (_jsxs("span", { className: "ml-1", children: [' ', "+ ", _jsx("span", { className: "font-semibold text-primary-600 dark:text-primary-400", children: versionsCount }), " ", versionsCount === 1 ? 'versão' : 'versões'] }))] })) }) })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2", children: "Nome do Link" }), _jsx("input", { type: "text", value: linkName, onChange: (e) => setLinkName(e.target.value), placeholder: "Ex: Entrega Projeto X", className: "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors", autoFocus: true }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-2", children: "Deixe vazio para gerar automaticamente a partir do nome do v\u00EDdeo" })] }), _jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [_jsx("button", { onClick: onClose, className: "px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", children: "Cancelar" }), _jsx("button", { onClick: handleCreate, disabled: loading, className: "px-5 py-2.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" }), "Gerando..."] })) : (_jsxs(_Fragment, { children: [_jsx(LinkIcon, { className: "w-4 h-4" }), "Gerar Link"] })) })] })] })) : (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "text-center py-6", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Check, { className: "w-8 h-8 text-green-600 dark:text-green-400" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: "Link Gerado com Sucesso!" }), _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "Compartilhe este link para dar acesso aos v\u00EDdeos" })] }), _jsx("div", { className: "bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "text", readOnly: true, value: generatedLink, className: "flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono", onClick: (e) => e.currentTarget.select() }), _jsx("button", { onClick: handleCopy, className: "flex items-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium", title: "Copiar", children: copied ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: "w-5 h-5" }), "Copiado"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "w-5 h-5" }), "Copiar"] })) })] }) }), _jsx("div", { className: "flex justify-center pt-2", children: _jsx("button", { onClick: onClose, className: "px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors", children: "Fechar" }) })] })) }));
}
