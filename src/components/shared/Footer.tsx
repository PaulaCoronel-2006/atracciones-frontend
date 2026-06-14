import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white pt-12 pb-8 border-t border-primary-container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white hover:opacity-95">
              <span className="material-symbols-outlined text-secondary-fixed-dim text-2xl">apartment</span>
              <span>HospédateEC</span>
            </Link>
            <p className="text-sm text-outline-variant leading-relaxed">
              Encuentra y reserva las mejores atracciones, tours y hospedajes en todo el Ecuador con confirmación instantánea y el respaldo de la plataforma líder del país.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-tertiary-fixed-dim tracking-wider uppercase mb-4">
              Explorar
            </h3>
            <ul className="space-y-2 text-sm text-outline-variant">
              <li>
                <Link to="/explorar" className="hover:text-white transition-colors duration-200">
                  Catálogo de Atracciones
                </Link>
              </li>
              <li>
                <a href="#destinos" className="hover:text-white transition-colors duration-200">
                  Destinos Populares
                </a>
              </li>
              <li>
                <a href="#aventura" className="hover:text-white transition-colors duration-200">
                  Aventura & Naturaleza
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-tertiary-fixed-dim tracking-wider uppercase mb-4">
              Soporte
            </h3>
            <ul className="space-y-2 text-sm text-outline-variant">
              <li>
                <a href="#faq" className="hover:text-white transition-colors duration-200">
                  Preguntas Frecuentes
                </a>
              </li>
              <li>
                <a href="#terminos" className="hover:text-white transition-colors duration-200">
                  Términos de Servicio
                </a>
              </li>
              <li>
                <a href="#privacidad" className="hover:text-white transition-colors duration-200">
                  Políticas de Privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-tertiary-fixed-dim tracking-wider uppercase mb-4">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm text-outline-variant">
              <li className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm">mail</span>
                <span>soporte@hospedate.ec</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm">phone</span>
                <span>+593 2-345-6789</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>Quito, Pichincha, Ecuador</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-container text-center text-xs text-outline-variant">
          <p>&copy; {new Date().getFullYear()} HospédateEC. Todos los derechos reservados. Desarrollado con los más altos estándares de calidad.</p>
        </div>
      </div>
    </footer>
  );
};
