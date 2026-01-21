import { useState, useEffect } from 'react';
import { Copy, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import Modal from './ui/Modal';
import { sharesApi, videosApi } from '../services/api';
import toast from 'react-hot-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoIds: number[];
}

interface ExistingShare {
    id: number;
    token: string;
    customSlug: string | null;
    name: string | null;
    expiresAt: string | null;
    downloads: number;
    maxDownloads: number | null;
    createdAt: string;
}

export default function ShareModal({ isOpen, onClose, videoIds }: ShareModalProps) {
    const [loading, setLoading] = useState(false);
    const [checkingExisting, setCheckingExisting] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [existingShare, setExistingShare] = useState<ExistingShare | null>(null);
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
        if (!videoIds.length) return;

        try {
            setIsLoadingVersions(true);
            
            // Buscar informações de todos os vídeos em paralelo
            const videoPromises = videoIds.map(videoId => 
                videosApi.get(videoId).catch(error => {
                    console.error(`Error loading video ${videoId}:`, error);
                    return null;
                })
            );

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
        } catch (error) {
            console.error('Error loading versions count:', error);
        } finally {
            setIsLoadingVersions(false);
        }
    };

    const checkForExistingShare = async () => {
        if (!videoIds.length) return;

        try {
            setCheckingExisting(true);
            const response = await sharesApi.checkExisting(videoIds);
            if (response.data.existing) {
                setExistingShare(response.data.existing);
            }
        } catch (error) {
            console.error('Error checking existing share:', error);
        } finally {
            setCheckingExisting(false);
        }
    };

    const handleUseExisting = () => {
        if (!existingShare) return;
        const slug = existingShare.customSlug || existingShare.token;
        const link = `${window.location.origin}/s/${slug}`;
        setGeneratedLink(link);
    };

    const handleCreate = async () => {
        if (!videoIds.length) return;

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

        } catch (error: any) {
            console.error('Error creating share link:', error);
            if (error.response?.status === 400) {
                toast.error('Nome já está em uso. Tente outro.');
            } else {
                toast.error('Erro ao criar link');
            }
        } finally {
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Compartilhar Vídeos"
        >
            {!generatedLink ? (
                <div className="space-y-5">
                    {/* Existing share warning */}
                    {checkingExisting ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Verificando compartilhamentos existentes...
                                </p>
                            </div>
                        </div>
                    ) : existingShare ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                        Link já existe para estes vídeos
                                    </h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                                        {existingShare.name || 'Compartilhamento'} • {existingShare.downloads} download(s)
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={handleUseExisting}
                                            className="px-4 py-2 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                                        >
                                            Usar link existente
                                        </button>
                                        <button
                                            onClick={() => setExistingShare(null)}
                                            className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                                        >
                                            Criar novo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isLoadingVersions ? (
                                    <span>Carregando informações...</span>
                                ) : (
                                    <>
                                        Compartilhando <span className="font-semibold text-gray-900 dark:text-white">{videoIds.length}</span> vídeo{videoIds.length !== 1 ? 's' : ''}
                                        {versionsCount > 0 && (
                                            <span className="ml-1">
                                                {' '}+ <span className="font-semibold text-primary-600 dark:text-primary-400">{versionsCount}</span> {versionsCount === 1 ? 'versão' : 'versões'}
                                            </span>
                                        )}
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Nome do Link */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome do Link
                        </label>
                        <input
                            type="text"
                            value={linkName}
                            onChange={(e) => setLinkName(e.target.value)}
                            placeholder="Ex: Entrega Projeto X"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Deixe vazio para gerar automaticamente a partir do nome do vídeo
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <LinkIcon className="w-4 h-4" />
                                    Gerar Link
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            Link Gerado com Sucesso!
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Compartilhe este link para dar acesso aos vídeos
                        </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                readOnly
                                value={generatedLink}
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono"
                                onClick={(e) => e.currentTarget.select()}
                            />
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                                title="Copiar"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        Copiado
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-5 h-5" />
                                        Copiar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
