import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PrivateRouteProps {
  requireAdmin?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ requireAdmin = false }) => {
  const { isAuthenticated, hasAdminAccess } = useAuth();

  if (!isAuthenticated) {
    // Redirigir al inicio de sesión
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !hasAdminAccess) {
    // Redirigir al home de clientes si no tiene privilegios de admin
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
