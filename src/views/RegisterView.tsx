import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const RegisterView: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password) {
      Swal.fire({
        title: 'Campos Vacíos',
        text: 'Por favor, completa todos los campos obligatorios (*).',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        email,
        password,
        firstName,
        lastName,
        phone,
        location
      });

      if (result.success) {
        Swal.fire({
          title: '¡Registro Exitoso!',
          text: 'Tu cuenta ha sido creada con éxito en HospédateEC.',
          icon: 'success',
          confirmButtonColor: '#0058bc'
        });
        navigate('/');
      } else {
        Swal.fire({
          title: 'Error al Registrarse',
          text: result.message || 'Inténtalo de nuevo con otros datos.',
          icon: 'error',
          confirmButtonColor: '#ba1a1a'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error de Conexión',
        text: 'Ocurrió un error al contactar al servidor en la nube.',
        icon: 'error',
        confirmButtonColor: '#ba1a1a'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] grid grid-cols-1 md:grid-cols-2">
      {/* Columna de Imagen Decorativa (Premium) */}
      <div className="hidden md:block relative order-last md:order-first">
        <img
          src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1000&auto=format&fit=crop&q=80"
          alt="Reserva de Experiencias en Ecuador"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/75 flex flex-col justify-end p-12 text-white">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold mb-2 text-tertiary-fixed-dim">
              Únete a la mayor red de viajeros
            </h3>
            <p className="text-sm text-outline-variant">
              Crea tu cuenta gratis hoy mismo y accede a herramientas de reservas automatizadas, historial digitalizado de tus viajes y facturación electrónica instantánea.
            </p>
          </div>
        </div>
      </div>

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
              Crear una Cuenta
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Regístrate para reservar atracciones y experiencias únicas
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="flex flex-col">
                <label htmlFor="firstName" className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Sofía"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-sm text-on-background placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              {/* Apellido */}
              <div className="flex flex-col">
                <label htmlFor="lastName" className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                  Apellido *
                </label>
                <input
                  type="text"
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Castillo"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-sm text-on-background placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            {/* Correo */}
            <div className="flex flex-col">
              <label htmlFor="email" className="text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">
                Correo Electrónico *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </span>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@hospedate.ec"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 pl-10 pr-3 text-sm text-on-background placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col">
              <label htmlFor="password" className="text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">
                Contraseña *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
                  <span className="material-symbols-outlined text-lg">lock</span>
                </span>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 pl-10 pr-3 text-sm text-on-background placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Teléfono */}
              <div className="flex flex-col">
                <label htmlFor="phone" className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+593 988888888"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-sm text-on-background placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              {/* Ubicación */}
              <div className="flex flex-col">
                <label htmlFor="location" className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
                  Ubicación
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Cuenca, Ecuador"
                  className="w-full bg-background border border-outline-variant rounded-xl py-2.5 px-3 text-sm text-on-background placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-secondary hover:bg-secondary-container text-white font-bold py-3.5 px-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95 mt-4"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span>Completar Registro</span>
              )}
            </button>
          </form>

          {/* Iniciar Sesión */}
          <div className="text-center mt-6">
            <p className="text-xs text-on-surface-variant">
              ¿Ya tienes una cuenta registrada?
              <Link to="/login" className="text-secondary hover:underline font-semibold ml-1">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
