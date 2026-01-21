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
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirects if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/shares" element={<Shares />} />

        {/* Editor and Admin */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={['editor', 'admin']}>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videos/:id/versions"
          element={
            <ProtectedRoute allowedRoles={['editor', 'admin']}>
              <UploadVersion />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/professionals"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Professionals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/s/:token" element={<PublicShare />} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
