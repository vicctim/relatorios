import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Upload, Trash2, Mail, Phone, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsApi } from '../../services/api';
import { Settings as SettingsType, NotificationRecipient } from '../../types';
import { LoadingSpinner, Modal } from '../../components/ui';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [addRecipientType, setAddRecipientType] = useState<'email' | 'whatsapp' | null>(null);
  const [newRecipientValue, setNewRecipientValue] = useState('');
  const [testingRecipientId, setTestingRecipientId] = useState<number | null>(null);

  const { register, handleSubmit, reset } = useForm<SettingsType>();

  useEffect(() => {
    loadSettings();
    loadRecipients();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getAll();
      setSettings(response.data.settings);
      reset(response.data.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      const response = await settingsApi.getNotificationRecipients();
      setRecipients(response.data.recipients);
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const onSubmit = async (data: SettingsType) => {
    setIsSaving(true);
    try {
      await settingsApi.update(data);
      toast.success('Configurações salvas com sucesso');
      loadSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      await settingsApi.uploadLogo(file);
      toast.success('Logo atualizado com sucesso');
      loadSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer upload do logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAddRecipient = async () => {
    if (!addRecipientType || !newRecipientValue.trim()) return;

    try {
      await settingsApi.addNotificationRecipient(addRecipientType, newRecipientValue.trim());
      toast.success('Destinatário adicionado com sucesso');
      setAddRecipientType(null);
      setNewRecipientValue('');
      loadRecipients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar destinatário');
    }
  };

  const handleDeleteRecipient = async (id: number) => {
    try {
      await settingsApi.deleteNotificationRecipient(id);
      toast.success('Destinatário removido');
      loadRecipients();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao remover destinatário');
    }
  };

  const handleTestNotification = async (recipient: NotificationRecipient) => {
    setTestingRecipientId(recipient.id);
    try {
      await settingsApi.testNotification(recipient.type, recipient.value);
      toast.success(`Notificação de teste enviada para ${recipient.value}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar notificação de teste');
    } finally {
      setTestingRecipientId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Configure o sistema de relatórios
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Dados da Empresa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nome da Empresa</label>
              <input
                type="text"
                className="input"
                {...register('company_name')}
              />
            </div>

            <div>
              <label className="label">Telefone</label>
              <input
                type="text"
                className="input"
                {...register('company_phone')}
              />
            </div>

            <div>
              <label className="label">CNPJ</label>
              <input
                type="text"
                className="input"
                {...register('company_cnpj')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Endereço</label>
              <input
                type="text"
                className="input"
                {...register('company_address')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Logo da Empresa</label>
              <div className="flex items-center gap-4">
                {settings?.company_logo_path && (
                  <img
                    src={settings.company_logo_path}
                    alt="Logo"
                    className="w-16 h-16 object-contain rounded-lg bg-gray-100 dark:bg-gray-700"
                  />
                )}
                <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                  {isUploadingLogo ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Upload Logo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Limites e Regras
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Limite Mensal (segundos)</label>
              <input
                type="number"
                className="input"
                {...register('monthly_limit_seconds', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="label">Meses de Rollover</label>
              <input
                type="number"
                className="input"
                {...register('rollover_months', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="label">Limite para Compressão (MB)</label>
              <input
                type="number"
                className="input"
                {...register('compression_threshold_mb', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* SMTP */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configurações de Email (SMTP)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Host SMTP</label>
              <input
                type="text"
                className="input"
                placeholder="smtp.gmail.com"
                {...register('smtp_host')}
              />
            </div>

            <div>
              <label className="label">Porta</label>
              <input
                type="number"
                className="input"
                placeholder="587"
                {...register('smtp_port', { valueAsNumber: true })}
              />
            </div>

            <div>
              <label className="label">Usuário</label>
              <input
                type="text"
                className="input"
                {...register('smtp_user')}
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('smtp_password')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Email de Envio</label>
              <input
                type="email"
                className="input"
                placeholder="noreply@empresa.com"
                {...register('smtp_from')}
              />
            </div>
          </div>
        </div>

        {/* Evolution API */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Evolution API (WhatsApp)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">URL da API</label>
              <input
                type="url"
                className="input"
                placeholder="https://api.evolution.com"
                {...register('evolution_api_url')}
              />
            </div>

            <div>
              <label className="label">Token</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('evolution_api_token')}
              />
            </div>

            <div>
              <label className="label">Instância</label>
              <input
                type="text"
                className="input"
                {...register('evolution_instance')}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
            {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            Salvar Configurações
          </button>
        </div>
      </form>

      {/* Notification Recipients */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Destinatários de Notificações
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setAddRecipientType('email')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setAddRecipientType('whatsapp')}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>

        {recipients.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum destinatário cadastrado
          </p>
        ) : (
          <div className="space-y-2">
            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {recipient.type === 'email' ? (
                    <Mail className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Phone className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-gray-900 dark:text-white">{recipient.value}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${recipient.active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                    }`}>
                    {recipient.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTestNotification(recipient)}
                    disabled={testingRecipientId === recipient.id}
                    className="btn-ghost p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Testar notificação"
                  >
                    {testingRecipientId === recipient.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteRecipient(recipient.id)}
                    className="btn-ghost p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remover destinatário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Recipient Modal */}
      <Modal
        isOpen={!!addRecipientType}
        onClose={() => {
          setAddRecipientType(null);
          setNewRecipientValue('');
        }}
        title={`Adicionar ${addRecipientType === 'email' ? 'Email' : 'WhatsApp'}`}
      >
        <div className="space-y-4">
          <div>
            <label className="label">
              {addRecipientType === 'email' ? 'Endereço de Email' : 'Número de WhatsApp'}
            </label>
            <input
              type={addRecipientType === 'email' ? 'email' : 'tel'}
              className="input"
              placeholder={addRecipientType === 'email' ? 'email@exemplo.com' : '+5511999999999'}
              value={newRecipientValue}
              onChange={(e) => setNewRecipientValue(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setAddRecipientType(null);
                setNewRecipientValue('');
              }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button onClick={handleAddRecipient} className="btn-primary">
              Adicionar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
