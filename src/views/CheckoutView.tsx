import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const CheckoutView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    attraction, 
    option, 
    slot, 
    passengers, 
    step, 
    hasSelection, 
    totalAmount, 
    taxAmount, 
    grandTotal,
    updatePassenger,
    updatePassengerPriceByTier,
    setStep,
    clearCart
  } = useCart();

  const { createBooking } = useBooking();
  const { user, token, isAuthenticated } = useAuth();

  // Si no hay selección, o el usuario no está autenticado, gestionar redirecciones
  useEffect(() => {
    if (!hasSelection) {
      navigate('/');
      return;
    }
    if (!isAuthenticated) {
      Swal.fire({
        title: 'Iniciar Sesión Requerido',
        text: 'Por favor, inicia sesión para completar tu reserva.',
        icon: 'info',
        confirmButtonColor: '#0058bc'
      });
      navigate('/login?redirect=/checkout');
    }
  }, [hasSelection, isAuthenticated, navigate]);

  // Formulario de Pago
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    let val = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = val.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(val);
    }
  };

  const formatCardExpiry = (value: string) => {
    let val = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (val.length >= 2) {
      setCardExpiry(val.substring(0, 2) + '/' + val.substring(2, 4));
    } else {
      setCardExpiry(val);
    }
  };

  const goToPayment = () => {
    for (const passenger of passengers) {
      if (!passenger.firstName.trim() || !passenger.lastName.trim() || !passenger.documentNumber.trim()) {
        Swal.fire({
          title: 'Formulario Incompleto',
          text: 'Por favor, rellena el nombre, apellido y documento de todos los pasajeros.',
          icon: 'warning',
          confirmButtonColor: '#0058bc'
        });
        return;
      }
    }
    setStep(2);
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
      Swal.fire({
        title: 'Datos de Pago Incompletos',
        text: 'Por favor, rellena todos los campos de tu tarjeta de crédito.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    setIsProcessing(true);

    // Simular latencia de red bancaria
    setTimeout(async () => {
      if (!slot || !attraction || !option) {
        setIsProcessing(false);
        return;
      }

      const bookingRequest = {
        slotId: slot.id,
        attractionId: attraction.id,
        productOptionId: option.id,
        attractionName: attraction.name,
        productTitle: option.title,
        currency: 'USD',
        totalAmount: grandTotal,
        notes: 'Reserva realizada vía web.',
        passengers: passengers.map(p => ({
          fullName: `${p.firstName.trim()} ${p.lastName.trim()}`,
          documentNumber: p.documentNumber.trim(),
          priceTierLabel: p.priceTierLabel,
          unitPrice: p.unitPrice
        }))
      };

      try {
        const result = await createBooking(user?.id, bookingRequest, token);

        setIsProcessing(false);

        if (result.success && result.booking) {
          Swal.fire({
            title: '¡Reserva Confirmada!',
            html: `
              <div class="text-left text-xs text-primary flex flex-col gap-2.5 mt-4 p-4 bg-background rounded-xl border border-surface-variant">
                <p><strong>Atracción:</strong> ${attraction.name}</p>
                <p><strong>Modalidad:</strong> ${option.title}</p>
                <p><strong>Código PNR:</strong> <span className="text-secondary font-black text-sm">${result.booking.pnrCode}</span></p>
                <p><strong>Fecha de actividad:</strong> ${result.booking.slotDate}</p>
                <p><strong>Hora:</strong> ${result.booking.slotStartTime} hs</p>
                <div class="h-px bg-surface-variant my-1"></div>
                <p class="font-bold text-success-green">Pago de $${grandTotal.toFixed(2)} procesado con éxito.</p>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#0058bc',
            confirmButtonText: 'Ir a Mis Reservas'
          }).then(() => {
            clearCart();
            navigate('/portal');
          });
        } else {
          Swal.fire({
            title: 'Error de Reserva',
            text: result.message || 'No se pudo crear la reserva en el sistema.',
            icon: 'error',
            confirmButtonColor: '#ba1a1a'
          });
        }
      } catch (err) {
        setIsProcessing(false);
        Swal.fire({
          title: 'Error Inesperado',
          text: 'Ocurrió un fallo en el proceso de reserva. Inténtalo más tarde.',
          icon: 'error',
          confirmButtonColor: '#ba1a1a'
        });
      }
    }, 2000);
  };

  if (!attraction || !option || !slot) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      
      {/* Lado Izquierdo: Pasos del Checkout */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Indicador de Progreso */}
        <div className="bg-white rounded-2xl p-4 border border-surface-variant flex items-center justify-around text-xs font-bold shadow-sm">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-secondary font-semibold' : 'text-outline'}`}>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${step === 1 ? 'border-secondary' : 'border-surface-variant'}`}>1</span>
            <span>Datos de Pasajeros</span>
          </div>
          <div className="w-16 h-px bg-surface-variant"></div>
          <div className={`flex items-center gap-2 ${step === 2 ? 'text-secondary font-semibold' : 'text-outline'}`}>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${step === 2 ? 'border-secondary' : 'border-surface-variant'}`}>2</span>
            <span>Simulador de Pago</span>
          </div>
        </div>

        {/* PASO 1: Formulario de Pasajeros */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-bold text-primary uppercase tracking-wider">Detalles de Pasajeros</h2>

            {passengers.map((passenger, idx) => (
              <div 
                key={passenger.id}
                className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-surface-variant pb-2">
                  <span className="text-xs font-bold text-secondary">Pasajero #{idx + 1}</span>
                  <span className="text-[10px] text-outline font-semibold font-mono">Tarifa: ${passenger.unitPrice.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold">Nombres</label>
                    <input 
                      type="text" 
                      value={passenger.firstName}
                      onChange={(e) => updatePassenger(passenger.id, { firstName: e.target.value })}
                      placeholder="Ej: Sofía"
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm text-on-background focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                  
                  {/* Apellido */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold">Apellidos</label>
                    <input 
                      type="text" 
                      value={passenger.lastName}
                      onChange={(e) => updatePassenger(passenger.id, { lastName: e.target.value })}
                      placeholder="Ej: Castillo"
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm text-on-background focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                  
                  {/* Tipo Documento */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold">Tipo de Documento</label>
                    <select 
                      value={passenger.documentType}
                      onChange={(e) => updatePassenger(passenger.id, { documentType: e.target.value })}
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm text-primary focus:outline-none focus:border-secondary"
                    >
                      <option value="Cédula">Cédula de Identidad</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>
                  
                  {/* Número Documento */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-outline font-semibold">Número de Documento</label>
                    <input 
                      type="text" 
                      value={passenger.documentNumber}
                      onChange={(e) => updatePassenger(passenger.id, { documentNumber: e.target.value })}
                      placeholder="Ej: 1723456789"
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm text-on-background focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                    />
                  </div>

                  {/* Rango de edad / Categoría */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs text-outline font-semibold">Categoría de Ticket</label>
                    <div className="flex gap-2 flex-wrap">
                      {option.price_tiers.map(tier => (
                        <button
                          key={tier.label}
                          type="button"
                          onClick={() => updatePassengerPriceByTier(passenger.id, tier.label)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            passenger.priceTierLabel === tier.label
                              ? 'bg-secondary/10 border-secondary text-primary font-bold shadow-sm'
                              : 'bg-background border-surface-variant text-on-surface-variant hover:border-outline'
                          }`}
                        >
                          {tier.label} (${tier.price.toFixed(2)})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button"
              onClick={goToPayment}
              className="w-full py-3.5 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95 mt-2"
            >
              <span>Continuar al Pago</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}

        {/* PASO 2: Pago */}
        {step === 2 && (
          <form onSubmit={handleProcessCheckout} className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary uppercase tracking-wider">Simulador de Pago</h2>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-xs text-secondary hover:underline cursor-pointer font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
                <span>Editar Pasajeros</span>
              </button>
            </div>

            {/* Tarjeta 3D */}
            <div className="relative w-full max-w-sm mx-auto h-48 [perspective:1000px] mb-4">
              <div 
                className={`relative w-full h-full rounded-2xl transition-transform duration-700 [transform-style:preserve-3d] shadow-lg border border-surface-variant ${
                  isCardFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                {/* Frente */}
                <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-primary via-primary-container to-secondary p-5 flex flex-col justify-between [backface-visibility:hidden]">
                  <div className="flex justify-between items-start text-white">
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] text-outline-variant font-bold uppercase tracking-wider">Método de Pago</span>
                      <span className="text-xs font-bold">TARJETA VIP SIMULADA</span>
                    </div>
                    <span className="material-symbols-outlined text-2xl text-tertiary-fixed-dim">credit_card</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="w-8 h-6 bg-tertiary-fixed-dim/20 rounded border border-tertiary-fixed-dim/40"></div>
                    <div className="text-lg font-mono font-bold tracking-widest text-white text-center">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                  </div>

                  <div className="flex justify-between items-end text-xs text-white text-left">
                    <div>
                      <div className="text-[8px] text-outline-variant uppercase">Titular</div>
                      <div className="font-bold truncate w-40">{cardHolder.toUpperCase() || 'SOFIA CASTILLO'}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-outline-variant uppercase">Vence</div>
                      <div className="font-bold font-mono">{cardExpiry || 'MM/AA'}</div>
                    </div>
                  </div>
                </div>

                {/* Respaldo */}
                <div className="absolute inset-0 w-full h-full rounded-2xl bg-primary p-5 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] border border-primary-container">
                  <div className="h-10 bg-primary-container border-y border-white/5 -mx-5 mt-2"></div>
                  
                  <div className="flex justify-end items-center gap-3">
                    <div className="h-8 bg-white/10 rounded flex-grow text-right pr-3 leading-8 text-xs font-bold text-outline-variant font-mono italic">
                      HospédateEC
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[7px] text-outline-variant uppercase">CVV</span>
                      <span className="px-3 py-1 rounded bg-white text-primary font-black text-xs font-mono">
                        {cardCvv || '•••'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[8px] text-outline-variant text-center leading-relaxed">
                    Este es un simulador de pasarela seguro. Ningún cargo real será facturado a su cuenta.
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs text-outline font-semibold">Número de Tarjeta</label>
                <input 
                  type="text" 
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => formatCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs text-outline font-semibold">Nombre en la Tarjeta</label>
                <input 
                  type="text" 
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Ej: Sofía Castillo"
                  className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs text-outline font-semibold">Vencimiento</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => formatCardExpiry(e.target.value)}
                    placeholder="MM/AA"
                    className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs text-outline font-semibold">CVV</label>
                  <input 
                    type="password" 
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                    onFocus={() => setIsCardFlipped(true)}
                    onBlur={() => setIsCardFlipped(false)}
                    placeholder="123"
                    className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm font-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 active:scale-95"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>Procesando Pago Seguro...</span>
                </>
              ) : (
                <span>Completar Reserva y Pagar ${grandTotal.toFixed(2)}</span>
              )}
            </button>
          </form>
        )}

      </div>

      {/* Lado Derecho: Resumen Lateral */}
      <div>
        <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm sticky top-24">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-surface-variant pb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-lg text-primary">receipt_long</span>
            <span>Resumen de Reserva</span>
          </h3>

          {/* Atracción */}
          <div className="flex items-center gap-3">
            {attraction.media && attraction.media.length > 0 && (
              <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-surface-variant">
                <img src={attraction.media[0]?.url || ''} alt={attraction.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <h4 className="font-extrabold text-xs text-primary truncate w-40">{attraction.name}</h4>
              <span className="text-[9px] text-secondary uppercase tracking-wider font-bold">{option.title}</span>
            </div>
          </div>

          <div className="h-px bg-surface-variant my-1"></div>

          {/* Fechas */}
          <div className="flex flex-col gap-2 text-xs text-on-surface-variant">
            <div className="flex justify-between">
              <span className="text-outline">Fecha:</span>
              <span className="font-semibold">{slot.slotDate.split('-').reverse().join('/')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Horario:</span>
              <span className="font-semibold font-mono">{slot.startTime} hs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Pasajeros:</span>
              <span className="font-semibold">{passengers.length}</span>
            </div>
          </div>

          <div className="h-px bg-surface-variant my-1"></div>

          {/* Desglose Individual */}
          <div className="flex flex-col gap-1.5 text-[11px] text-outline font-semibold">
            {passengers.map((p, idx) => (
              <div key={p.id} className="flex justify-between">
                <span>{p.firstName || `Pasajero #${idx + 1}`} ({p.priceTierLabel})</span>
                <span>${p.unitPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-surface-variant my-1"></div>

          {/* Precios y Totales */}
          <div className="flex flex-col gap-2 text-xs text-on-surface-variant">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (15%)</span>
              <span className="font-semibold">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-surface-variant my-1"></div>
            <div className="flex justify-between font-black text-sm text-primary">
              <span>Gran Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CheckoutView;
