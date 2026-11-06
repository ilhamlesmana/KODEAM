import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import { LandingPage } from './pages/LandingPage';
import { LoginAdmin } from './pages/LoginAdmin';
import { LoginStudent } from './pages/LoginStudent';
import { AdminLayout } from './pages/admin/AdminLayout';
import { StudentLayout } from './pages/student/StudentLayout';

// Proteksi Halaman Guru: Siswa atau Pengguna Belum Login DILARANG Masuk
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login-admin" replace />;
  if (role !== 'admin') return <Navigate to="/student" replace />;
  return <>{children}</>;
};

// Proteksi Halaman Siswa: Guru atau Pengguna Belum Login DILARANG Masuk
const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login-siswa" replace />;
  if (role !== 'student') return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

// Route untuk Login: Jika sudah login, langsung arahkan ke dashboard masing-masing
const PublicAuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin' : '/student'} replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <DataProvider>
        <AuthProvider>
          <div className="min-h-screen font-sans selection:bg-blue-600 selection:text-white">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/login-admin"
                element={
                  <PublicAuthRoute>
                    <LoginAdmin />
                  </PublicAuthRoute>
                }
              />
              <Route
                path="/login-siswa"
                element={
                  <PublicAuthRoute>
                    <LoginStudent />
                  </PublicAuthRoute>
                }
              />

              {/* Protected Admin / Guru Routes */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              />

              {/* Protected Student Routes */}
              <Route
                path="/student/*"
                element={
                  <StudentRoute>
                    <StudentLayout />
                  </StudentRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </DataProvider>
    </BrowserRouter>
  );
};

export default App;
