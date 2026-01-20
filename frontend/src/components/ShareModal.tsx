import { useState, useEffect } from 'react';
import { Copy, Link as LinkIcon, Calendar, Download, Check } from 'lucide-react';
import Modal from './ui/Modal';
import { sharesApi } from '../services/api';
import toast from 'react-hot-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoIds: number[];
}

export default function ShareModal({ isOpen, onClose, videoIds }: ShareModalProps) {
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [expiresIn, setExpiresIn] = useState('7'); // days
    const [maxDownloads, setMaxDownloads] = useState('');

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setGeneratedLink(null);
            setName('');
            setExpiresIn('7');
            setMaxDownloads('');
            setCopied(false);
        }
    }, [isOpen]);

    const handleCreate = async () => {
        if (!videoIds.length) return;

        try {
            setLoading(true);

            let expiresAt = undefined;
            if (expiresIn !== '0') {
                const date = new Date();
                date.setDate(date.getDate() + parseInt(expiresIn));
                expiresAt = date.toISOString();
            }

            const response = await sharesApi.create({
                videoIds,
                name: name || undefined,
                expiresAt,
                maxDownloads: maxDownloads ? parseInt(maxDownloads) : undefined,
            });

            const token = response.data.token;
            const link = `${window.location.origin}/s/${token}`;
            setGeneratedLink(link);
            toast.success('Link criado com sucesso!');

        } catch (error) {
            console.error('Error creating share link:', error);
            toast.error('Erro ao criar link');
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
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Você está compartilhando {videoIds.length} vídeo{videoIds.length !== 1 ? 's' : ''}.
                        Configure as opções abaixo:
                    </p>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome do Link (Opcional)
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Entrega Projeto X"
                            className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>

                    {/* Expiration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Expira em
                        </label>
                        <div className="relative">
                            <select
                                value={expiresIn}
                                onChange={(e) => setExpiresIn(e.target.value)}
                                className="form-select w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="1">1 dia</option>
                                <option value="3">3 dias</option>
                                <option value="7">7 dias</option>
                                <option value="30">30 dias</option>
                                <option value="0">Nunca</option>
                            </select>
                            <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Max Downloads */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Limite de Downloads (Opcional)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                value={maxDownloads}
                                onChange={(e) => setMaxDownloads(e.target.value)}
                                placeholder="Ex: 5"
                                className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                            />
                            <Download className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Gerando...' : 'Gerar Link'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <LinkIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Link Gerado!
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Compartilhe este link para dar acesso aos vídeos.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={generatedLink}
                            className="form-input w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        />
                        <button
                            onClick={handleCopy}
                            className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Copiar"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            )}
                        </button>
                    </div>

                    <div className="flex justify-center mt-6">
                        <button
                            onClick={onClose}
                            className="btn-primary"
                        >
                            Concluído
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
