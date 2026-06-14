import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated, hasAdminAccess } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-surface-variant sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y Marca */}
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2 text-primary font-bold text-xl tracking-tight">
              <span className="material-symbols-outlined text-secondary text-2xl">apartment</span>
              <span>HospédateEC</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-on-surface hover:border-secondary hover:text-secondary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
              >
                Inicio
              </Link>
              <Link
                to="/explorar"
                className="border-transparent text-on-surface hover:border-secondary hover:text-secondary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
              >
                Experiencias
              </Link>
            </div>
          </div>

          {/* Menú de Usuario */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-on-surface-variant hidden md:inline-block">
                  Hola, <span className="font-semibold text-primary">{user?.firstName}</span> ({user?.role})
                </span>

                {hasAdminAccess && (
                  <Link
                    to="/admin"
                    className="bg-primary text-white hover:bg-primary-container px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-1 shadow-sm hover:shadow active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    <span>Administración</span>
                  </Link>
                )}

                {!hasAdminAccess && (
                  <Link
                    to="/portal"
                    className="border border-secondary text-secondary hover:bg-secondary hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-sm">confirmation_number</span>
                    <span>Mis Reservas</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="text-on-surface-variant hover:text-error inline-flex items-center px-2 py-2 text-sm font-medium transition-colors duration-200"
                  title="Cerrar Sesión"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-on-surface-variant hover:text-secondary px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-secondary text-white hover:bg-secondary-container px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow active:scale-95"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
