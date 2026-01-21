import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  FileVideo,
  FileText,
  Share2,
  Settings,
  Users,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { settingsApi } from '../../services/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const [logo, setLogo] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Pix Filmes');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsApi.getPublic();
        if (response.data.settings.company_name) {
          setCompanyName(response.data.settings.company_name);
        }
        if (response.data.settings.company_logo_path) {
          // The logo path is already a full path like /uploads/logos/filename.png
          // We need to proxy it through the API server
          const logoPath = response.data.settings.company_logo_path;
          setLogo(`http://localhost:3001${logoPath}`);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Upload', href: '/upload', icon: Upload, roles: ['editor', 'admin'] },
    { name: 'Vídeos', href: '/videos', icon: FileVideo, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Relatórios', href: '/reports', icon: FileText, roles: ['admin', 'editor', 'viewer'] },
    { name: 'Compartilhamentos', href: '/shares', icon: Share2, roles: ['admin', 'editor', 'viewer'] },
  ];

  const adminNavigation = [
    { name: 'Usuários', href: '/admin/users', icon: Users },
    { name: 'Profissionais', href: '/admin/professionals', icon: UserCircle },
    { name: 'Configurações', href: '/admin/settings', icon: Settings },
  ];

  const filteredNavigation = navigation.filter(
    (item) => item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center overflow-hidden">
                {logo ? (
                  <img src={logo} alt={companyName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-white font-bold text-sm">PX</span>
                )}
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {companyName}
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}

            {/* Admin section */}
            {user?.role === 'admin' && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administração
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role === 'admin'
                    ? 'Administrador'
                    : user?.role === 'editor'
                    ? 'Editor'
                    : 'Visualizador'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
