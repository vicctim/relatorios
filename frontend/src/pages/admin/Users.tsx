import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../services/api';
import { User } from '../../types';
import { LoadingSpinner, Modal } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await usersApi.list();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      reset({
        name: '',
        email: '',
        password: '',
        role: 'viewer',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const onSubmit = async (data: UserForm) => {
    setIsSaving(true);
    try {
      if (editingUser) {
        const updateData: any = {
          name: data.name,
          email: data.email,
          role: data.role,
        };
        if (data.password) {
          updateData.password = data.password;
        }
        await usersApi.update(editingUser.id, updateData);
        toast.success('Usuário atualizado com sucesso');
      } else {
        await usersApi.create(data);
        toast.success('Usuário criado com sucesso');
      }
      closeModal();
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao salvar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      await usersApi.delete(deleteUser.id);
      toast.success('Usuário excluído com sucesso');
      setDeleteUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir usuário');
    }
  };

  const toggleUserActive = async (user: User) => {
    try {
      await usersApi.update(user.id, { active: !user.active });
      toast.success(`Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    editor: 'Editor',
    viewer: 'Visualizador',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie os usuários do sistema
          </p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
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
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Papel
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : user.role === 'editor'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserActive(user)}
                      disabled={user.id === currentUser?.id}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        user.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      } ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                    >
                      {user.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {user.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(user)}
                        className="btn-ghost p-2"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteUser(user)}
                          className="btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              {...register('name', { required: 'Nome é obrigatório' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">
              Senha {editingUser && '(deixe em branco para manter)'}
            </label>
            <input
              type="password"
              className={`input ${errors.password ? 'input-error' : ''}`}
              {...register('password', {
                required: editingUser ? false : 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres',
                },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="label">Papel</label>
            <select
              className={`input ${errors.role ? 'input-error' : ''}`}
              {...register('role', { required: 'Papel é obrigatório' })}
            >
              <option value="viewer">Visualizador</option>
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? <LoadingSpinner size="sm" /> : editingUser ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="Excluir Usuário"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tem certeza que deseja excluir o usuário <strong>{deleteUser?.name}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteUser(null)} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleDelete} className="btn-danger">
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
}
