import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
export default function Header({ onMenuClick }) {
    const { theme, toggleTheme } = useTheme();
    const { logout } = useAuth();
    return (_jsx("header", { className: "h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between h-full px-4", children: [_jsx("button", { onClick: onMenuClick, className: "lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700", children: _jsx(Menu, { className: "w-5 h-5" }) }), _jsx("div", { className: "flex-1 lg:pl-0 pl-4", children: _jsx("h1", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Sistema de Relat\u00F3rios" }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: toggleTheme, className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors", title: theme === 'light' ? 'Modo escuro' : 'Modo claro', children: theme === 'light' ? (_jsx(Moon, { className: "w-5 h-5 text-gray-600" })) : (_jsx(Sun, { className: "w-5 h-5 text-gray-400" })) }), _jsx("button", { onClick: logout, className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400", title: "Sair", children: _jsx(LogOut, { className: "w-5 h-5" }) })] })] }) }));
}
