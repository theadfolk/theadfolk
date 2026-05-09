import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import ConnectGmail from './pages/ConnectGmail';
import Dashboard from './pages/Dashboard';
import DealDetail from './pages/DealDetail';
import Settings from './pages/Settings';

function ProtectedRoute({ children, requireGmail = true }) {
  const { user, loading, dbUser } = useAuth();
  
  if (loading) return <div style={{height: '100vh', background: 'var(--bg-color)'}}></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (requireGmail && dbUser && !dbUser.google_access_token) {
    return <Navigate to="/connect-gmail" replace />;
  }
  
  return children;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login isLogin={true} />} />
            <Route path="/signup" element={<Login isLogin={false} />} />
            
            <Route 
              path="/connect-gmail" 
              element={
                <ProtectedRoute requireGmail={false}>
                  <ConnectGmail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/deals/:id" 
              element={
                <ProtectedRoute>
                  <DealDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
