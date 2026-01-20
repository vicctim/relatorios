import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { professionalsApi } from '../../services/api';
import { Professional } from '../../types';
import { LoadingSpinner, Modal } from '../../components/ui';

interface ProfessionalForm {
  name: string;
}

export default function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [deleteProfessional, setDeleteProfessional] = useState<Professional | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfessionalForm>();

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      const response = await professionalsApi.listAll();
      setProfessionals(response.data.professionals);
    } catch (error) {
      console.error('Error loading professionals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (professional?: Professional) => {
    if (professional) {
      setEditingProfessional(professional);
      reset({ name: professional.name });
    } else {
      setEditingProfessional(null);
      reset({ name: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProfessional(null);
    reset();
  };

  const onSubmit = async (data: ProfessionalForm) => {
    setIsSaving(true);
    try {
      if (editingProfessional) {
        await professionalsApi.update(editingProfessional.id, { name: data.name });
        toast.success('Profissional atualizado com sucesso');
      } else {
        await professionalsApi.create(data.name);
        toast.success('Profissional criado com sucesso');
      }
      closeModal();
      loadProfessionals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar profissional');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProfessional) return;

    try {
      await professionalsApi.delete(deleteProfessional.id);
      toast.success('Profissional desativado com sucesso');
      setDeleteProfessional(null);
      loadProfessionals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao desativar profissional');
    }
  };

  const toggleActive = async (professional: Professional) => {
    try {
      await professionalsApi.update(professional.id, { active: !professional.active });
      toast.success(`Profissional ${professional.active ? 'desativado' : 'ativado'} com sucesso`);
      loadProfessionals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar profissional');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profissionais</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie os editores de vídeo
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Profissional
        </button>
      </div>

      {/* Professionals List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : professionals.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">Nenhum profissional cadastrado</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {professionals.map((professional) => (
                <tr key={professional.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                          {professional.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {professional.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(professional)}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${
                        professional.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {professional.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {professional.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(professional)}
                        className="btn-ghost p-2"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteProfessional(professional)}
                        className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Desativar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Nome do profissional"
              {...register('name', { required: 'Nome é obrigatório' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? <LoadingSpinner size="sm" /> : editingProfessional ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteProfessional}
        onClose={() => setDeleteProfessional(null)}
        title="Desativar Profissional"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tem certeza que deseja desativar o profissional <strong>{deleteProfessional?.name}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteProfessional(null)} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleDelete} className="btn-danger">
            Desativar
          </button>
        </div>
      </Modal>
    </div>
  );
}
