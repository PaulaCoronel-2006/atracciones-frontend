import React from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const HomeView: React.FC = () => {
  const handleAccommodationsClick = () => {
    Swal.fire({
      title: 'Módulo de Alojamientos',
      text: 'Este módulo se encuentra actualmente en desarrollo y estará disponible próximamente en HospédateEC.',
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#0058bc'
    });
  };

  return (
    <div className="flex flex-col gap-20 pb-16">
      
      {/* 1. Hero Section (Presentación de Marca HospédateEC) */}
      <section className="relative bg-primary text-white py-20 md:py-32 px-4 overflow-hidden border-b border-outline-variant">
        {/* Luces radiales y gradientes de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary/30 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-tertiary/10 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-6 relative z-10">
          <span className="px-4 py-1.5 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-wider font-sans">
            Experiencias & Hospedaje
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight font-sans max-w-4xl leading-tight">
            El arte de viajar y hospedarse en <span className="text-tertiary-fixed-dim">Ecuador</span>
          </h1>
          <p className="text-outline-variant text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
            Descubre alojamientos boutique exclusivos y reserva actividades de aventura únicas con confirmación inmediata y total seguridad.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link 
              to="/explorar" 
              className="px-8 py-4 rounded-2xl text-sm font-bold bg-secondary text-white hover:bg-secondary-container transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">explore</span>
              Explorar Experiencias
            </Link>
            <button 
              onClick={handleAccommodationsClick}
              className="px-8 py-4 rounded-2xl text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">hotel</span>
              Ver Alojamientos
            </button>
          </div>
        </div>
      </section>

      {/* 2. Secciones Principales de Servicio (Marketplace Layout) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-left">
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">Nuestros Servicios</h2>
          <h3 className="text-2xl md:text-4xl font-extrabold text-primary font-sans">
            Todo lo que necesitas para tu viaje en un solo lugar
          </h3>
          <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed">
            Ofrecemos una solución integral que conecta estancias de alta gama con itinerarios de actividades locales diseñados por profesionales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Bloque Experiencias */}
          <div className="group rounded-3xl overflow-hidden border border-surface-variant bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="h-64 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1533240332313-0db49b439ad3?w=800&auto=format&fit=crop&q=80" 
                alt="Experiencias y Aventuras" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-secondary text-white text-[10px] font-bold uppercase tracking-wider">
                Disponible ahora
              </div>
            </div>
            <div className="p-8 flex flex-col gap-4 flex-grow">
              <h4 className="text-xl font-bold text-primary font-sans">Experiencias y Actividades</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Tours organizados, buceo, senderismo de montaña, recorridos históricos e itinerarios gastronómicos en las principales regiones del país.
              </p>
              <div className="mt-auto pt-4 border-t border-surface-variant">
                <Link 
                  to="/explorar" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-secondary-container transition-colors"
                >
                  <span>Reservar una experiencia</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bloque Alojamientos */}
          <div className="group rounded-3xl overflow-hidden border border-surface-variant bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
            <div className="h-64 overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80" 
                alt="Alojamientos Premium" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-primary text-tertiary-fixed-dim text-[10px] font-bold uppercase tracking-wider">
                Próximamente
              </div>
            </div>
            <div className="p-8 flex flex-col gap-4 flex-grow">
              <h4 className="text-xl font-bold text-primary font-sans">Alojamientos de Estancia Corta</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Glampings ecológicos, cabañas rústicas de lujo, apartamentos modernos y hoteles boutique seleccionados bajo rigurosos controles de calidad.
              </p>
              <div className="mt-auto pt-4 border-t border-surface-variant">
                <button 
                  onClick={handleAccommodationsClick}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer"
                >
                  <span>Explorar alojamientos</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Beneficios de HospédateEC (Por qué nosotros) */}
      <section className="bg-surface-container border-y border-outline-variant py-20 w-full text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-16">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">
            <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">¿Por qué elegirnos?</h2>
            <h3 className="text-2xl md:text-4xl font-extrabold text-primary font-sans">
              Seguridad, calidad y soporte local garantizados
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Beneficio 1 */}
            <div className="bg-white p-8 rounded-2xl border border-surface-variant flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl font-bold">verified_user</span>
              </div>
              <h4 className="font-bold text-lg text-primary font-sans">Reservas Garantizadas</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Nuestros procesos de compra utilizan tokens seguros y control de idempotencia para asegurar que tus transacciones y vouchers nunca tengan fallos.
              </p>
            </div>

            {/* Beneficio 2 */}
            <div className="bg-white p-8 rounded-2xl border border-surface-variant flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl font-bold">partner_exchange</span>
              </div>
              <h4 className="font-bold text-lg text-primary font-sans">Sincronización Bidireccional</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Nuestra arquitectura integra slots de disponibilidad en tiempo real, garantizando que el inventario local y de agencias externas se mantenga coordinado.
              </p>
            </div>

            {/* Beneficio 3 */}
            <div className="bg-white p-8 rounded-2xl border border-surface-variant flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-2xl font-bold">support_agent</span>
              </div>
              <h4 className="font-bold text-lg text-primary font-sans">Soporte Local 24/7</h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Somos un equipo local establecido en Ecuador. Respondemos con inmediatez y estamos a tu lado frente a cualquier eventualidad durante tu experiencia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Destinos Recomendados */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-left">
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-secondary uppercase tracking-wider">Destinos Destacados</h2>
          <h3 className="text-2xl md:text-4xl font-extrabold text-primary font-sans">
            Explora las regiones más icónicas del Ecuador
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {/* Quito */}
          <div className="relative rounded-3xl overflow-hidden h-96 group border border-surface-variant shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&auto=format&fit=crop&q=80" 
              alt="Quito" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 text-white">
              <h4 className="text-xl font-bold font-sans">Quito Patrimonial</h4>
              <p className="text-xs text-outline-variant">El centro histórico más grande y mejor conservado de América.</p>
              <Link to="/explorar" className="mt-2 text-xs font-bold text-secondary flex items-center gap-1 hover:text-white transition-colors">
                <span>Ver actividades</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Galápagos */}
          <div className="relative rounded-3xl overflow-hidden h-96 group border border-surface-variant shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80" 
              alt="Galápagos" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 text-white">
              <h4 className="text-xl font-bold font-sans">Islas Galápagos</h4>
              <p className="text-xs text-outline-variant">Un laboratorio vivo de biodiversidad y paisajes volcánicos únicos.</p>
              <Link to="/explorar" className="mt-2 text-xs font-bold text-secondary flex items-center gap-1 hover:text-white transition-colors">
                <span>Ver actividades</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Cuenca */}
          <div className="relative rounded-3xl overflow-hidden h-96 group border border-surface-variant shadow-sm sm:col-span-2 lg:col-span-1">
            <img 
              src="https://images.unsplash.com/photo-1627914589224-b152e0078b66?w=600&auto=format&fit=crop&q=80" 
              alt="Cuenca" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/30 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 text-white">
              <h4 className="text-xl font-bold font-sans">Cuenca Colonial</h4>
              <p className="text-xs text-outline-variant">Adoquines, iglesias emblemáticas y paseos junto a ríos tranquilos.</p>
              <Link to="/explorar" className="mt-2 text-xs font-bold text-secondary flex items-center gap-1 hover:text-white transition-colors">
                <span>Ver actividades</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Final */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative bg-primary text-white rounded-3xl overflow-hidden py-16 px-8 text-center border border-outline-variant shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-6 items-center">
            <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight font-sans">
              ¿Listo para vivir experiencias únicas?
            </h3>
            <p className="text-outline-variant text-sm md:text-base leading-relaxed">
              Reserva de forma segura, accede a guías locales capacitados y gestiona todas tus reservas desde tu panel privado.
            </p>
            <Link 
              to="/explorar" 
              className="mt-4 px-8 py-3.5 rounded-xl text-sm font-bold bg-secondary text-white hover:bg-secondary-container transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Ver Catálogo Completo</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomeView;
