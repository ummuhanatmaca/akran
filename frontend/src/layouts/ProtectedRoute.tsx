import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Oturum bilgileri doğrulanıyor...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
