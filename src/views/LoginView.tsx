import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const LoginView: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Obtener ruta de redirección
  const from = new URLSearchParams(location.search).get('redirect') || '';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({
        title: 'Campos Vacíos',
        text: 'Por favor, completa todos los campos obligatorios.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        Swal.fire({
          title: 'Sesión Iniciada',
          text: `¡Bienvenido de nuevo, ${result.user?.firstName || 'Usuario'}!`,
          icon: 'success',
          confirmButtonColor: '#0058bc'
        });

        const redirectPath = from || (result.user?.role === 'Admin' || result.user?.role === 'Partner' ? '/admin' : '/');
        navigate(redirectPath);
      } else {
        Swal.fire({
          title: 'Error de Acceso',
          text: result.message || 'Verifica tu correo y contraseña.',
          icon: 'error',
          confirmButtonColor: '#ba1a1a'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error de Red',
        text: 'Hubo un problema al conectar con el servidor de autenticación.',
        icon: 'error',
        confirmButtonColor: '#ba1a1a'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] grid grid-cols-1 md:grid-cols-2">
      {/* Columna de Formulario */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-md">
          {/* Logo y Encabezado */}
          <div className="text-left mb-8">
            <div className="flex items-center space-x-2 text-primary font-bold text-2xl mb-6">
              <span className="material-symbols-outlined text-secondary text-3xl">apartment</span>
              <span>HospédateEC</span>
            </div>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Accede a tu cuenta para gestionar tus reservas y explorar el Ecuador
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Campo Correo */}
            <div className="flex flex-col">
              <label htmlFor="email" className="text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </span>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@hospedate.ec"
                  className="w-full bg-background border border-outline-variant rounded-xl py-3 pl-11 pr-4 text-sm text-on-background placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all duration-200"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="flex flex-col">
              <label htmlFor="password" className="text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-outline">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </span>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-outline-variant rounded-xl py-3 pl-11 pr-4 text-sm text-on-background placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all duration-200"
                />
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-3.5 px-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>Acceder a mi Cuenta</span>
              )}
            </button>
          </form>

          {/* Registro */}
          <div className="text-center mt-6">
            <p className="text-xs text-on-surface-variant">
              ¿Aún no tienes una cuenta?
              <Link to="/register" className="text-secondary hover:underline font-semibold ml-1">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Columna de Imagen Decorativa (Premium) */}
      <div className="hidden md:block relative">
        <img
          src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1000&auto=format&fit=crop&q=80"
          alt="Paisaje del Ecuador"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/75 flex flex-col justify-end p-12 text-white">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold mb-2 text-tertiary-fixed-dim">
              Explora lo extraordinario del Ecuador
            </h3>
            <p className="text-sm text-outline-variant">
              Desde las Islas Galápagos hasta la majestuosidad de los Andes, hospédate y vive aventuras memorables con las mejores tarifas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
