import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, Trash2, Mail, Phone, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../services/api';
import { LoadingSpinner, Modal } from '../../components/ui';
export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [addRecipientType, setAddRecipientType] = useState(null);
    const [newRecipientValue, setNewRecipientValue] = useState('');
    const [testingRecipientId, setTestingRecipientId] = useState(null);
    const { register, handleSubmit, reset } = useForm();
    useEffect(() => {
        loadSettings();
        loadRecipients();
    }, []);
    const loadSettings = async () => {
        try {
            const response = await settingsApi.getAll();
            setSettings(response.data.settings);
            reset(response.data.settings);
        }
        catch (error) {
            console.error('Error loading settings:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const loadRecipients = async () => {
        try {
            const response = await settingsApi.getNotificationRecipients();
            setRecipients(response.data.recipients);
        }
        catch (error) {
            console.error('Error loading recipients:', error);
        }
    };
    const onSubmit = async (data) => {
        setIsSaving(true);
        try {
            await settingsApi.update(data);
            toast.success('Configurações salvas com sucesso');
            loadSettings();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao salvar configurações');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setIsUploadingLogo(true);
        try {
            await settingsApi.uploadLogo(file);
            toast.success('Logo atualizado com sucesso');
            loadSettings();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao fazer upload do logo');
        }
        finally {
            setIsUploadingLogo(false);
        }
    };
    const handleAddRecipient = async () => {
        if (!addRecipientType || !newRecipientValue.trim())
            return;
        try {
            await settingsApi.addNotificationRecipient(addRecipientType, newRecipientValue.trim());
            toast.success('Destinatário adicionado com sucesso');
            setAddRecipientType(null);
            setNewRecipientValue('');
            loadRecipients();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao adicionar destinatário');
        }
    };
    const handleDeleteRecipient = async (id) => {
        try {
            await settingsApi.deleteNotificationRecipient(id);
            toast.success('Destinatário removido');
            loadRecipients();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao remover destinatário');
        }
    };
    const handleTestNotification = async (recipient) => {
        setTestingRecipientId(recipient.id);
        try {
            await settingsApi.testNotification(recipient.type, recipient.value);
            toast.success(`Notificação de teste enviada para ${recipient.value}`);
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao enviar notificação de teste');
        }
        finally {
            setTestingRecipientId(null);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6 animate-fade-in max-w-4xl", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Configura\u00E7\u00F5es" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Configure o sistema de relat\u00F3rios" })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { className: "card p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Dados da Empresa" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "label", children: "Nome da Empresa" }), _jsx("input", { type: "text", className: "input", ...register('company_name') })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Telefone" }), _jsx("input", { type: "text", className: "input", ...register('company_phone') })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "CNPJ" }), _jsx("input", { type: "text", className: "input", ...register('company_cnpj') })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "label", children: "Endere\u00E7o" }), _jsx("input", { type: "text", className: "input", ...register('company_address') })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "label", children: "Logo da Empresa" }), _jsxs("div", { className: "flex items-center gap-4", children: [settings?.company_logo_path && (_jsx("img", { src: settings.company_logo_path, alt: "Logo", className: "w-16 h-16 object-contain rounded-lg bg-gray-100 dark:bg-gray-700" })), _jsxs("label", { className: "btn-secondary flex items-center gap-2 cursor-pointer", children: [isUploadingLogo ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsx(Upload, { className: "w-4 h-4" })), _jsx("span", { children: "Upload Logo" }), _jsx("input", { type: "file", accept: "image/png,image/jpeg", onChange: handleLogoUpload, className: "hidden" })] })] })] })] })] }), _jsxs("div", { className: "card p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Limites e Regras" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Limite Mensal (segundos)" }), _jsx("input", { type: "number", className: "input", ...register('monthly_limit_seconds', { valueAsNumber: true }) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Meses de Rollover" }), _jsx("input", { type: "number", className: "input", ...register('rollover_months', { valueAsNumber: true }) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Limite para Compress\u00E3o (MB)" }), _jsx("input", { type: "number", className: "input", ...register('compression_threshold_mb', { valueAsNumber: true }) })] })] })] }), _jsxs("div", { className: "card p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Configura\u00E7\u00F5es de Email (SMTP)" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Host SMTP" }), _jsx("input", { type: "text", className: "input", placeholder: "smtp.gmail.com", ...register('smtp_host') })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Porta" }), _jsx("input", { type: "number", className: "input", placeholder: "587", ...register('smtp_port', { valueAsNumber: true }) })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Usu\u00E1rio" }), _jsx("input", { type: "text", className: "input", ...register('smtp_user') })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Senha" }), _jsx("input", { type: "password", className: "input", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ...register('smtp_password') })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "label", children: "Email de Envio" }), _jsx("input", { type: "email", className: "input", placeholder: "noreply@empresa.com", ...register('smtp_from') })] })] })] }), _jsxs("div", { className: "card p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Evolution API (WhatsApp)" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "label", children: "URL da API" }), _jsx("input", { type: "url", className: "input", placeholder: "https://api.evolution.com", ...register('evolution_api_url') })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Token" }), _jsx("input", { type: "password", className: "input", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ...register('evolution_api_token') })] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Inst\u00E2ncia" }), _jsx("input", { type: "text", className: "input", ...register('evolution_instance') })] })] })] }), _jsx("div", { className: "flex justify-end", children: _jsxs("button", { type: "submit", disabled: isSaving, className: "btn-primary flex items-center gap-2", children: [isSaving ? _jsx(LoadingSpinner, { size: "sm" }) : _jsx(Save, { className: "w-4 h-4" }), "Salvar Configura\u00E7\u00F5es"] }) })] }), _jsxs("div", { className: "card p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Destinat\u00E1rios de Notifica\u00E7\u00F5es" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: () => setAddRecipientType('email'), className: "btn-secondary flex items-center gap-2 text-sm", children: [_jsx(Mail, { className: "w-4 h-4" }), "Email"] }), _jsxs("button", { onClick: () => setAddRecipientType('whatsapp'), className: "btn-secondary flex items-center gap-2 text-sm", children: [_jsx(Phone, { className: "w-4 h-4" }), "WhatsApp"] })] })] }), recipients.length === 0 ? (_jsx("p", { className: "text-gray-500 text-center py-4", children: "Nenhum destinat\u00E1rio cadastrado" })) : (_jsx("div", { className: "space-y-2", children: recipients.map((recipient) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [recipient.type === 'email' ? (_jsx(Mail, { className: "w-4 h-4 text-gray-500" })) : (_jsx(Phone, { className: "w-4 h-4 text-gray-500" })), _jsx("span", { className: "text-gray-900 dark:text-white", children: recipient.value }), _jsx("span", { className: `text-xs px-2 py-0.5 rounded-full ${recipient.active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'}`, children: recipient.active ? 'Ativo' : 'Inativo' })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => handleTestNotification(recipient), disabled: testingRecipientId === recipient.id, className: "btn-ghost p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20", title: "Testar notifica\u00E7\u00E3o", children: testingRecipientId === recipient.id ? (_jsx(LoadingSpinner, { size: "sm" })) : (_jsx(Send, { className: "w-4 h-4" })) }), _jsx("button", { onClick: () => handleDeleteRecipient(recipient.id), className: "btn-ghost p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20", title: "Remover destinat\u00E1rio", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, recipient.id))) }))] }), _jsx(Modal, { isOpen: !!addRecipientType, onClose: () => {
                    setAddRecipientType(null);
                    setNewRecipientValue('');
                }, title: `Adicionar ${addRecipientType === 'email' ? 'Email' : 'WhatsApp'}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: addRecipientType === 'email' ? 'Endereço de Email' : 'Número de WhatsApp' }), _jsx("input", { type: addRecipientType === 'email' ? 'email' : 'tel', className: "input", placeholder: addRecipientType === 'email' ? 'email@exemplo.com' : '+5511999999999', value: newRecipientValue, onChange: (e) => setNewRecipientValue(e.target.value) })] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { onClick: () => {
                                        setAddRecipientType(null);
                                        setNewRecipientValue('');
                                    }, className: "btn-secondary", children: "Cancelar" }), _jsx("button", { onClick: handleAddRecipient, className: "btn-primary", children: "Adicionar" })] })] }) })] }));
}
