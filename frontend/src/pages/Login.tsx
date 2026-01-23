import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LoadingSpinner } from '../components/ui';
import { settingsApi } from '../services/api';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
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
      const settings = response.data?.settings || response.data;
      if (settings?.company_logo_path) {
        setCompanyLogo(settings.company_logo_path);
      }
      if (settings?.company_name) {
        setCompanyName(settings.company_name);
      }
    } catch (error) {
      console.error('Error loading public settings:', error);
      // Não quebrar a página se settings falhar
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
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
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Theme toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        <div className="card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="w-20 h-20 object-contain rounded-2xl mb-4 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-4 shadow-lg">
                <span className="text-white font-bold text-2xl">PX</span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {companyName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Sistema de Relatórios
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="seu@email.com"
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
              <label htmlFor="password" className="label">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Entrando...</span>
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          © {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
