import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/Layout';
import { LoadingSpinner } from './components/ui';
// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import UploadVersion from './pages/UploadVersion';
import Videos from './pages/Videos';
import Reports from './pages/Reports';
import Shares from './pages/Shares';
import Users from './pages/admin/Users';
import Professionals from './pages/admin/Professionals';
import Settings from './pages/admin/Settings';
import PublicShare from './pages/PublicShare';
// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles, }) {
    const { isAuthenticated, isLoading, user } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
// Public Route wrapper (redirects if authenticated)
function PublicRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    if (isAuthenticated) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(PublicRoute, { children: _jsx(Login, {}) }) }), _jsxs(Route, { element: _jsx(ProtectedRoute, { children: _jsx(MainLayout, {}) }), children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/videos", element: _jsx(Videos, {}) }), _jsx(Route, { path: "/reports", element: _jsx(Reports, {}) }), _jsx(Route, { path: "/shares", element: _jsx(Shares, {}) }), _jsx(Route, { path: "/upload", element: _jsx(ProtectedRoute, { allowedRoles: ['editor', 'admin'], children: _jsx(Upload, {}) }) }), _jsx(Route, { path: "/videos/:id/versions", element: _jsx(ProtectedRoute, { allowedRoles: ['editor', 'admin'], children: _jsx(UploadVersion, {}) }) }), _jsx(Route, { path: "/admin/users", element: _jsx(ProtectedRoute, { allowedRoles: ['admin'], children: _jsx(Users, {}) }) }), _jsx(Route, { path: "/admin/professionals", element: _jsx(ProtectedRoute, { allowedRoles: ['admin'], children: _jsx(Professionals, {}) }) }), _jsx(Route, { path: "/admin/settings", element: _jsx(ProtectedRoute, { allowedRoles: ['admin'], children: _jsx(Settings, {}) }) })] }), _jsx(Route, { path: "/s/:token", element: _jsx(PublicShare, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
