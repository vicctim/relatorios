import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../services/api';
import { LoadingSpinner, Modal } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
export default function Users() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { register, handleSubmit, reset, formState: { errors }, } = useForm();
    useEffect(() => {
        loadUsers();
    }, []);
    const loadUsers = async () => {
        try {
            const response = await usersApi.list();
            setUsers(response.data.users);
        }
        catch (error) {
            console.error('Error loading users:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const openModal = (user) => {
        if (user) {
            setEditingUser(user);
            reset({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
            });
        }
        else {
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
    const onSubmit = async (data) => {
        setIsSaving(true);
        try {
            if (editingUser) {
                const updateData = {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                };
                if (data.password) {
                    updateData.password = data.password;
                }
                await usersApi.update(editingUser.id, updateData);
                toast.success('Usuário atualizado com sucesso');
            }
            else {
                await usersApi.create(data);
                toast.success('Usuário criado com sucesso');
            }
            closeModal();
            loadUsers();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao salvar usuário');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!deleteUser)
            return;
        try {
            await usersApi.delete(deleteUser.id);
            toast.success('Usuário excluído com sucesso');
            setDeleteUser(null);
            loadUsers();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao excluir usuário');
        }
    };
    const toggleUserActive = async (user) => {
        try {
            await usersApi.update(user.id, { active: !user.active });
            toast.success(`Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso`);
            loadUsers();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
        }
    };
    const roleLabels = {
        admin: 'Administrador',
        editor: 'Editor',
        viewer: 'Visualizador',
    };
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Usu\u00E1rios" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Gerencie os usu\u00E1rios do sistema" })] }), _jsxs("button", { onClick: () => openModal(), className: "btn-primary flex items-center gap-2", children: [_jsx(Plus, { className: "w-5 h-5" }), "Novo Usu\u00E1rio"] })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) })) : (_jsx("div", { className: "card overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-700/50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Nome" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Papel" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: users.map((user) => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700/50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center", children: _jsx("span", { className: "text-primary-600 dark:text-primary-400 font-medium text-sm", children: user.name.charAt(0).toUpperCase() }) }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: user.name })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400", children: user.email }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                : user.role === 'editor'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`, children: roleLabels[user.role] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("button", { onClick: () => toggleUserActive(user), disabled: user.id === currentUser?.id, className: `inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${user.active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'} ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`, children: [user.active ? _jsx(Check, { className: "w-3 h-3" }) : _jsx(X, { className: "w-3 h-3" }), user.active ? 'Ativo' : 'Inativo'] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { onClick: () => openModal(user), className: "btn-ghost p-2", title: "Editar", children: _jsx(Edit2, { className: "w-4 h-4" }) }), user.id !== currentUser?.id && (_jsx("button", { onClick: () => setDeleteUser(user), className: "btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20", title: "Excluir", children: _jsx(Trash2, { className: "w-4 h-4" }) }))] }) })] }, user.id))) })] }) })), _jsx(Modal, { isOpen: isModalOpen, onClose: closeModal, title: editingUser ? 'Editar Usuário' : 'Novo Usuário', children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Nome" }), _jsx("input", { type: "text", className: `input ${errors.name ? 'input-error' : ''}`, ...register('name', { required: 'Nome é obrigatório' }) }), errors.name && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.name.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Email" }), _jsx("input", { type: "email", className: `input ${errors.email ? 'input-error' : ''}`, ...register('email', {
                                        required: 'Email é obrigatório',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Email inválido',
                                        },
                                    }) }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.email.message }))] }), _jsxs("div", { children: [_jsxs("label", { className: "label", children: ["Senha ", editingUser && '(deixe em branco para manter)'] }), _jsx("input", { type: "password", className: `input ${errors.password ? 'input-error' : ''}`, ...register('password', {
                                        required: editingUser ? false : 'Senha é obrigatória',
                                        minLength: {
                                            value: 6,
                                            message: 'Senha deve ter pelo menos 6 caracteres',
                                        },
                                    }) }), errors.password && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.password.message }))] }), _jsxs("div", { children: [_jsx("label", { className: "label", children: "Papel" }), _jsxs("select", { className: `input ${errors.role ? 'input-error' : ''}`, ...register('role', { required: 'Papel é obrigatório' }), children: [_jsx("option", { value: "viewer", children: "Visualizador" }), _jsx("option", { value: "editor", children: "Editor" }), _jsx("option", { value: "admin", children: "Administrador" })] }), errors.role && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.role.message }))] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: closeModal, className: "btn-secondary", children: "Cancelar" }), _jsx("button", { type: "submit", disabled: isSaving, className: "btn-primary", children: isSaving ? _jsx(LoadingSpinner, { size: "sm" }) : editingUser ? 'Salvar' : 'Criar' })] })] }) }), _jsxs(Modal, { isOpen: !!deleteUser, onClose: () => setDeleteUser(null), title: "Excluir Usu\u00E1rio", children: [_jsxs("p", { className: "text-gray-600 dark:text-gray-400 mb-6", children: ["Tem certeza que deseja excluir o usu\u00E1rio ", _jsx("strong", { children: deleteUser?.name }), "?"] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { onClick: () => setDeleteUser(null), className: "btn-secondary", children: "Cancelar" }), _jsx("button", { onClick: handleDelete, className: "btn-danger", children: "Excluir" })] })] })] }));
}
