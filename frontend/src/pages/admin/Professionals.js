import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { professionalsApi } from '../../services/api';
import { LoadingSpinner, Modal } from '../../components/ui';
export default function Professionals() {
    const [professionals, setProfessionals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfessional, setEditingProfessional] = useState(null);
    const [deleteProfessional, setDeleteProfessional] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const { register, handleSubmit, reset, formState: { errors }, } = useForm();
    useEffect(() => {
        loadProfessionals();
    }, []);
    const loadProfessionals = async () => {
        try {
            const response = await professionalsApi.listAll();
            setProfessionals(response.data.professionals);
        }
        catch (error) {
            console.error('Error loading professionals:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const openModal = (professional) => {
        if (professional) {
            setEditingProfessional(professional);
            reset({ name: professional.name });
        }
        else {
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
    const onSubmit = async (data) => {
        setIsSaving(true);
        try {
            if (editingProfessional) {
                await professionalsApi.update(editingProfessional.id, { name: data.name });
                toast.success('Profissional atualizado com sucesso');
            }
            else {
                await professionalsApi.create(data.name);
                toast.success('Profissional criado com sucesso');
            }
            closeModal();
            loadProfessionals();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao salvar profissional');
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!deleteProfessional)
            return;
        try {
            await professionalsApi.delete(deleteProfessional.id);
            toast.success('Profissional desativado com sucesso');
            setDeleteProfessional(null);
            loadProfessionals();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao desativar profissional');
        }
    };
    const toggleActive = async (professional) => {
        try {
            await professionalsApi.update(professional.id, { active: !professional.active });
            toast.success(`Profissional ${professional.active ? 'desativado' : 'ativado'} com sucesso`);
            loadProfessionals();
        }
        catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao atualizar profissional');
        }
    };
    return (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Profissionais" }), _jsx("p", { className: "text-gray-500 dark:text-gray-400", children: "Gerencie os editores de v\u00EDdeo" })] }), _jsxs("button", { onClick: () => openModal(), className: "btn-primary flex items-center gap-2", children: [_jsx(Plus, { className: "w-5 h-5" }), "Novo Profissional"] })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(LoadingSpinner, { size: "lg" }) })) : professionals.length === 0 ? (_jsx("div", { className: "card p-12 text-center", children: _jsx("p", { className: "text-gray-500", children: "Nenhum profissional cadastrado" }) })) : (_jsx("div", { className: "card overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 dark:bg-gray-700/50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Nome" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200 dark:divide-gray-700", children: professionals.map((professional) => (_jsxs("tr", { className: "hover:bg-gray-50 dark:hover:bg-gray-700/50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center", children: _jsx("span", { className: "text-primary-600 dark:text-primary-400 font-medium text-sm", children: professional.name.charAt(0).toUpperCase() }) }), _jsx("span", { className: "font-medium text-gray-900 dark:text-white", children: professional.name })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("button", { onClick: () => toggleActive(professional), className: `inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${professional.active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`, children: [professional.active ? _jsx(Check, { className: "w-3 h-3" }) : _jsx(X, { className: "w-3 h-3" }), professional.active ? 'Ativo' : 'Inativo'] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("button", { onClick: () => openModal(professional), className: "btn-ghost p-2", title: "Editar", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => setDeleteProfessional(professional), className: "btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20", title: "Desativar", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }) })] }, professional.id))) })] }) })), _jsx(Modal, { isOpen: isModalOpen, onClose: closeModal, title: editingProfessional ? 'Editar Profissional' : 'Novo Profissional', children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "label", children: "Nome" }), _jsx("input", { type: "text", className: `input ${errors.name ? 'input-error' : ''}`, placeholder: "Nome do profissional", ...register('name', { required: 'Nome é obrigatório' }) }), errors.name && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.name.message }))] }), _jsxs("div", { className: "flex justify-end gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: closeModal, className: "btn-secondary", children: "Cancelar" }), _jsx("button", { type: "submit", disabled: isSaving, className: "btn-primary", children: isSaving ? _jsx(LoadingSpinner, { size: "sm" }) : editingProfessional ? 'Salvar' : 'Criar' })] })] }) }), _jsxs(Modal, { isOpen: !!deleteProfessional, onClose: () => setDeleteProfessional(null), title: "Desativar Profissional", children: [_jsxs("p", { className: "text-gray-600 dark:text-gray-400 mb-6", children: ["Tem certeza que deseja desativar o profissional ", _jsx("strong", { children: deleteProfessional?.name }), "?"] }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { onClick: () => setDeleteProfessional(null), className: "btn-secondary", children: "Cancelar" }), _jsx("button", { onClick: handleDelete, className: "btn-danger", children: "Desativar" })] })] })] }));
}
