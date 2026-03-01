import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingSpinner } from '../components/ui';
import { settingsApi } from '../services/api';
export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [companyName, setCompanyName] = useState('Pix Filmes');
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    useEffect(() => {
        loadPublicSettings();
    }, []);
    const loadPublicSettings = async () => {
        try {
            const response = await settingsApi.getPublic();
            const settings = response.data.settings;
            if (settings.company_logo_path) {
                setCompanyLogo(settings.company_logo_path);
            }
            if (settings.company_name) {
                setCompanyName(settings.company_name);
            }
        }
        catch (error) {
            console.error('Error loading public settings:', error);
        }
    };
    const { register, handleSubmit, formState: { errors }, } = useForm();
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            toast.success('Login realizado com sucesso!');
            // Redirect based on user role
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                if (userData.role === 'editor') {
                    navigate('/upload');
                }
                else {
                    navigate('/');
                }
            }
            else {
                navigate('/');
            }
        }
        catch (error) {
            const message = error.response?.data?.error || 'Erro ao fazer login';
            toast.error(message);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsx("div", { className: "flex justify-end mb-4", children: _jsx("button", { onClick: toggleTheme, className: "p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow", children: theme === 'light' ? '🌙' : '☀️' }) }), _jsxs("div", { className: "card p-8", children: [_jsxs("div", { className: "flex flex-col items-center mb-8", children: [companyLogo ? (_jsx("img", { src: companyLogo, alt: companyName, className: "w-20 h-20 object-contain rounded-2xl mb-4 shadow-lg" })) : (_jsx("div", { className: "w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-4 shadow-lg", children: _jsx("span", { className: "text-white font-bold text-2xl", children: "PX" }) })), _jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: companyName }), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm mt-1", children: "Sistema de Relat\u00F3rios" })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "label", children: "Email" }), _jsx("input", { id: "email", type: "email", autoComplete: "email", className: `input ${errors.email ? 'input-error' : ''}`, placeholder: "seu@email.com", ...register('email', {
                                                required: 'Email é obrigatório',
                                                pattern: {
                                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                    message: 'Email inválido',
                                                },
                                            }) }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.email.message }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "label", children: "Senha" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "password", type: showPassword ? 'text' : 'password', autoComplete: "current-password", className: `input pr-10 ${errors.password ? 'input-error' : ''}`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ...register('password', {
                                                        required: 'Senha é obrigatória',
                                                        minLength: {
                                                            value: 6,
                                                            message: 'Senha deve ter pelo menos 6 caracteres',
                                                        },
                                                    }) }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600", children: showPassword ? (_jsx(EyeOff, { className: "w-5 h-5" })) : (_jsx(Eye, { className: "w-5 h-5" })) })] }), errors.password && (_jsx("p", { className: "mt-1 text-sm text-red-500", children: errors.password.message }))] }), _jsx("button", { type: "submit", disabled: isLoading, className: "btn-primary w-full py-3 flex items-center justify-center gap-2", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { size: "sm" }), _jsx("span", { children: "Entrando..." })] })) : ('Entrar') })] })] }), _jsxs("p", { className: "text-center text-sm text-gray-500 dark:text-gray-400 mt-6", children: ["\u00A9 ", new Date().getFullYear(), " ", companyName, ". Todos os direitos reservados."] })] }) }));
}
