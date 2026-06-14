import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { useBooking } from '../context/BookingContext';
import { useCart } from '../context/CartContext';
import LeafletMap from '../components/LeafletMap';
import { CalendarAvailability } from '../components/CalendarAvailability';
import Swal from 'sweetalert2';

const AttractionDetailView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getAttractionBySlug, fetchAttractionBySlug, getInclusionById } = useCatalog();
  const { reviews } = useBooking();
  const { setBookingSelection } = useCart();

  const attraction = getAttractionBySlug(slug || '');

  // Galería de fotos
  const [activeImageUrl, setActiveImageUrl] = useState('');
  
  // Motor de reservas
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [passengerCount, setPassengerCount] = useState(1);

  // Inicializar detalles de la atracción y la galería
  useEffect(() => {
    const loadDetails = async () => {
      if (slug) {
        const item = await fetchAttractionBySlug(slug);
        if (!item) {
          navigate('/');
        }
      }
    };
    loadDetails();
  }, [slug]);

  // Sincronizar imágenes y primera opción de producto
  useEffect(() => {
    if (attraction) {
      const mainImg = attraction.media?.find(m => m.is_main)?.url || attraction.media?.[0]?.url || '';
      setActiveImageUrl(mainImg);

      if (attraction.product_options?.length > 0) {
        setSelectedOptionId(attraction.product_options[0].id);
      }
    }
  }, [attraction]);

  const selectedOption = useMemo(() => {
    return attraction?.product_options?.find(o => o.id === selectedOptionId) || null;
  }, [attraction, selectedOptionId]);

  const pricePerPerson = useMemo(() => {
    if (!selectedOption) return 0;
    return selectedOption.price_tiers[0]?.price || 0;
  }, [selectedOption]);

  const subtotal = pricePerPerson * passengerCount;
  const tax = subtotal * 0.15; // 15% IVA
  const total = subtotal + tax;

  const handleSelectSlot = (slot: any) => {
    setSelectedSlot(slot);
    if (passengerCount > slot.capacityAvailable) {
      setPassengerCount(slot.capacityAvailable);
    }
  };

  const handleBooking = () => {
    if (!selectedSlot) {
      Swal.fire({
        title: 'Selecciona una Fecha',
        text: 'Por favor, elige un día disponible y un horario en el calendario.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    if (passengerCount <= 0 || passengerCount > selectedSlot.capacityAvailable) {
      Swal.fire({
        title: 'Cupos Inválidos',
        text: `Por favor, selecciona entre 1 y ${selectedSlot.capacityAvailable} pasajeros para esta sesión.`,
        icon: 'error',
        confirmButtonColor: '#ba1a1a'
      });
      return;
    }

    if (attraction && selectedOption) {
      // Guardar la selección en el carrito de compras
      setBookingSelection(
        {
          id: attraction.id,
          name: attraction.name,
          slug: attraction.slug,
          price_base: attraction.price_base,
          rating: attraction.rating,
          review_count: attraction.review_count,
          location_id: attraction.location_id,
          subcategory_id: attraction.subcategory_id
        },
        selectedOption,
        selectedSlot,
        passengerCount
      );

      navigate('/checkout');
    }
  };

  // Filtrar reseñas de esta atracción
  const attractionReviews = useMemo(() => {
    return reviews.filter(r => r.attractionId === attraction?.id);
  }, [reviews, attraction]);

  if (!attraction) {
    return (
      <div className="flex justify-center items-center h-96 bg-background">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-secondary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 text-left">
      {/* Botón de Retorno */}
      <div>
        <Link to="/" className="text-xs font-bold text-secondary hover:underline flex items-center gap-1 mb-2">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Volver a Atracciones</span>
        </Link>
        <h1 className="text-2xl md:text-4xl font-extrabold text-primary font-sans tracking-tight">
          {attraction.name}
        </h1>
      </div>

      {/* Grid de Contenido y Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Detalles, Galería, Servicios, Itinerario, Mapa */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Galería Multimedia */}
          <div className="flex flex-col gap-3">
            <div className="relative h-[300px] md:h-[420px] rounded-2xl overflow-hidden border border-surface-variant shadow-sm bg-surface">
              <img src={activeImageUrl} alt={attraction.name} className="w-full h-full object-cover" />
            </div>
            
            {/* Miniaturas */}
            {attraction.media && attraction.media.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {attraction.media.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImageUrl(img.url)}
                    className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer ${
                      activeImageUrl === img.url 
                        ? 'border-secondary scale-105 shadow' 
                        : 'border-surface-variant opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={attraction.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className="bg-white rounded-2xl p-6 border border-surface-variant flex flex-col gap-4 shadow-sm">
            <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">description</span>
              <span>Descripción de la Experiencia</span>
            </h2>
            <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
              {attraction.description}
            </p>
          </div>

          {/* Inclusiones y Exclusiones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incluye */}
            <div className="bg-white rounded-2xl p-5 border border-surface-variant shadow-sm">
              <h3 className="text-xs font-bold text-success-green uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined">check_circle</span>
                <span>Servicios Incluidos</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-on-surface-variant">
                {attraction.inclusions
                  ?.filter(i => i.type === 'included')
                  .map((inc, idx) => (
                    <li key={inc.inclusion_item_id || idx} className="flex items-start gap-2">
                      <span className="text-success-green font-bold">✓</span>
                      <span>{getInclusionById(inc.inclusion_item_id)?.default_text}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* No Incluye */}
            <div className="bg-white rounded-2xl p-5 border border-surface-variant shadow-sm">
              <h3 className="text-xs font-bold text-error uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined">cancel</span>
                <span>No Incluido / Exclusiones</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-on-surface-variant">
                {attraction.inclusions
                  ?.filter(i => i.type === 'excluded')
                  .map((exc, idx) => (
                    <li key={exc.inclusion_item_id || idx} className="flex items-start gap-2">
                      <span className="text-error font-bold">✦</span>
                      <span>{getInclusionById(exc.inclusion_item_id)?.default_text}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Itinerario */}
          {attraction.itinerary && attraction.itinerary.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-surface-variant flex flex-col gap-6 shadow-sm">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined">map</span>
                <span>Itinerario Detallado</span>
              </h3>
              
              <div className="relative border-l-2 border-surface-variant pl-6 ml-3 space-y-8">
                {attraction.itinerary.map((stop, idx) => (
                  <div key={idx} className="relative">
                    {/* Indicador de número */}
                    <span className={`absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                      stop.is_included 
                        ? 'bg-secondary border-secondary text-white' 
                        : 'bg-background border-surface-variant text-outline'
                    }`}>
                      {stop.stop_number}
                    </span>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-primary">{stop.name}</h4>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-background text-outline font-mono">
                          {stop.duration}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                          stop.is_included 
                            ? 'bg-success-green/10 text-success-green' 
                            : 'bg-error/10 text-error'
                        }`}>
                          {stop.is_included ? 'Incluido' : 'Opcional'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapa */}
          {attraction.location_coords && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined">pin_drop</span>
                <span>Punto de Encuentro y Ubicación</span>
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-1">
                Encuéntrate con el guía en la dirección exacta señalada en el mapa. Se recomienda estar en el sitio 15 minutos antes.
              </p>
              <LeafletMap 
                lat={attraction.location_coords.lat}
                lng={attraction.location_coords.lng}
                placeName={attraction.location_coords.placeName}
              />
            </div>
          )}

          {/* Reseñas */}
          <div className="bg-white rounded-2xl p-6 border border-surface-variant flex flex-col gap-5 shadow-sm">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined">reviews</span>
                <span>Reseñas de Viajeros</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-background border border-surface-variant text-outline font-semibold">
                {attractionReviews.length} opiniones
              </span>
            </h3>

            {attractionReviews.length === 0 ? (
              <div className="text-center py-6 text-outline text-xs">
                Aún no hay calificaciones para esta atracción. ¡Sé el primero en reservar y dejar tu experiencia!
              </div>
            ) : (
              <div className="space-y-4">
                {attractionReviews.map(rev => (
                  <div key={rev.id} className="p-4 rounded-xl bg-background border border-surface-variant flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">Cliente Autenticado</span>
                      <div className="text-xs text-tertiary-fixed-dim flex gap-0.5">
                        {Array.from({ length: Math.floor(rev.rating) }).map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-xs text-tertiary-fixed-dim fill-[1]">star</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Lado Derecho: Panel de Compra sticky */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-5 sticky top-24 shadow-sm">
            <div className="flex flex-col gap-1 border-b border-surface-variant pb-3">
              <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Reserva Express</span>
              <h3 className="text-lg font-black text-primary">Motor de Reservas</h3>
            </div>

            {/* Modalidades */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-primary uppercase tracking-wider">Opciones del Tour</label>
              <div className="flex flex-col gap-2">
                {attraction.product_options?.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setSelectedOptionId(opt.id); setSelectedSlot(null); }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedOptionId === opt.id
                        ? 'bg-secondary/10 border-secondary text-primary font-semibold'
                        : 'bg-background border-surface-variant hover:border-outline text-on-surface-variant'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.title}</div>
                    <div className="text-[10px] text-outline mt-0.5 font-semibold">
                      Desde ${opt.price_tiers[0]?.price.toFixed(2)} por persona
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Disponibilidad */}
            {selectedOptionId && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-primary uppercase tracking-wider">Fechas Disponibles</label>
                <CalendarAvailability
                  optionId={selectedOptionId}
                  onSelectSlot={handleSelectSlot}
                />
              </div>
            )}

            {/* Selector de Pasajeros */}
            {selectedSlot && (
              <div className="flex flex-col gap-2 text-left">
                <label className="text-xs font-bold text-primary uppercase tracking-wider flex justify-between">
                  <span>Pasajeros</span>
                  <span className="text-[10px] text-secondary font-semibold">Disponibles: {selectedSlot.capacityAvailable}</span>
                </label>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPassengerCount(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-background hover:bg-surface-variant border border-surface-variant text-primary flex items-center justify-center font-bold transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    readOnly
                    value={passengerCount}
                    min="1"
                    max={selectedSlot.capacityAvailable}
                    className="w-full h-10 text-center rounded-xl bg-background border border-surface-variant text-primary font-bold text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPassengerCount(prev => Math.min(selectedSlot.capacityAvailable, prev + 1))}
                    className="w-10 h-10 rounded-xl bg-background hover:bg-surface-variant border border-surface-variant text-primary flex items-center justify-center font-bold transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Invoice Previo */}
            {selectedSlot && (
              <div className="p-3.5 rounded-xl bg-background border border-surface-variant flex flex-col gap-2 text-xs text-on-surface-variant shadow-inner">
                <div className="flex justify-between">
                  <span>{passengerCount} Pasajeros x ${pricePerPerson.toFixed(2)}</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (15%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="h-px bg-surface-variant my-1"></div>
                <div className="flex justify-between font-black text-sm text-primary">
                  <span>Gran Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Botón Reservar */}
            <button
              type="button"
              onClick={handleBooking}
              className="w-full py-3.5 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-sm"
            >
              <span>Continuar con la Reserva</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttractionDetailView;
