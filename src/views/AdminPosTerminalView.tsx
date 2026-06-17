import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

interface PosPassenger {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  priceTierLabel: string;
  unitPrice: number;
}

const AdminPosTerminalView: React.FC = () => {
  const { attractions, fetchCompleteAttraction } = useCatalog();
  const { slots, createBooking, fetchSlots } = useBooking();
  const { token } = useAuth();

  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);

  const [passengersList, setPassengersList] = useState<PosPassenger[]>([
    { firstName: '', lastName: '', documentType: 'Cédula', documentNumber: '', priceTierLabel: 'Adulto', unitPrice: 40.00 }
  ]);

  // Cargar atracción detallada de forma asíncrona cuando se selecciona
  useEffect(() => {
    if (selectedAttractionId && token) {
      fetchCompleteAttraction(selectedAttractionId, token).then(detailedAttr => {
        if (detailedAttr && detailedAttr.product_options && detailedAttr.product_options.length > 0) {
          setSelectedOptionId(detailedAttr.product_options[0].id);
        }
      });
    }
  }, [selectedAttractionId, token, fetchCompleteAttraction]);

  // Cargar slots reales de la modalidad cuando cambia
  useEffect(() => {
    if (selectedOptionId) {
      fetchSlots(selectedOptionId);
    }
  }, [selectedOptionId, fetchSlots]);

  const activeAttraction = useMemo(() => {
    return attractions.find(a => a.id === selectedAttractionId) || null;
  }, [attractions, selectedAttractionId]);

  const activeOption = useMemo(() => {
    return activeAttraction?.product_options?.find(o => o.id === selectedOptionId) || null;
  }, [activeAttraction, selectedOptionId]);

  const selectedSlot = useMemo(() => {
    return slots.find(s => s.id === selectedSlotId) || null;
  }, [slots, selectedSlotId]);

  const handleAttractionChange = (attractionId: string) => {
    setSelectedAttractionId(attractionId);
    setSelectedOptionId('');
    setSelectedSlotId('');
  };

  // Pronóstico de disponibilidad (próximos 5 slots con cupo libre)
  const forecastSuggestions = useMemo(() => {
    if (!selectedOptionId) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    return slots
      .filter(s => s.productId === selectedOptionId && s.slotDate >= todayStr && s.capacityAvailable > 0 && s.isActive)
      .sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  }, [slots, selectedOptionId]);

  const handlePassengerCountChange = (newCount: number) => {
    const currentCount = passengersList.length;
    const defaultPrice = activeOption?.price_tiers[0]?.price || 40.00;
    const defaultTierLabel = activeOption?.price_tiers[0]?.label || 'Adulto';

    let updatedList = [...passengersList];

    if (newCount > currentCount) {
      for (let i = currentCount; i < newCount; i++) {
        updatedList.push({
          firstName: '',
          lastName: '',
          documentType: 'Cédula',
          documentNumber: '',
          priceTierLabel: defaultTierLabel,
          unitPrice: defaultPrice
        });
      }
    } else if (newCount < currentCount) {
      updatedList = updatedList.slice(0, newCount);
    }

    setPassengersList(updatedList);
    setPassengerCount(newCount);
  };

  const setPassengerTier = (pIdx: number, tierLabel: string) => {
    if (!activeOption) return;
    const tier = activeOption.price_tiers.find(t => t.label === tierLabel);
    if (tier) {
      const updated = passengersList.map((p, idx) => {
        if (idx === pIdx) {
          return { ...p, priceTierLabel: tier.label, unitPrice: tier.price };
        }
        return p;
      });
      setPassengersList(updated);
    }
  };

  const updatePassengerField = (pIdx: number, field: keyof PosPassenger, value: string) => {
    const updated = passengersList.map((p, idx) => {
      if (idx === pIdx) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setPassengersList(updated);
  };

  const subtotal = useMemo(() => {
    return passengersList.reduce((sum, p) => sum + p.unitPrice, 0);
  }, [passengersList]);

  const tax = subtotal * 0.15;
  const grandTotal = subtotal + tax;

  const executePosSale = async () => {
    if (!selectedSlot) {
      Swal.fire({
        title: 'Selecciona Horario',
        text: 'Debes marcar un slot de disponibilidad o elegir uno de los sugeridos.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    // Validar pasajeros
    for (let i = 0; i < passengersList.length; i++) {
      const p = passengersList[i];
      if (!p.firstName.trim() || !p.lastName.trim() || !p.documentNumber.trim()) {
        Swal.fire({
          title: `Pasajero #${i + 1} Incompleto`,
          text: 'Por favor, rellena todos los datos de taquilla para emitir el boleto.',
          icon: 'warning',
          confirmButtonColor: '#0058bc'
        });
        return;
      }
    }

    const bookingRequest = {
      slotId: selectedSlot.id,
      attractionId: selectedAttractionId,
      productOptionId: selectedOptionId,
      attractionName: activeAttraction?.name || '',
      productTitle: activeOption?.title || '',
      currency: 'USD',
      totalAmount: grandTotal,
      notes: 'Venta rápida emitida por operador en Taquilla POS.',
      passengers: passengersList.map(p => ({
        fullName: `${p.firstName.trim()} ${p.lastName.trim()}`,
        documentNumber: p.documentNumber.trim(),
        priceTierLabel: p.priceTierLabel,
        unitPrice: p.unitPrice
      }))
    };

    try {
      const result = await createBooking('taquilla-operator-id', bookingRequest, token);

      if (result.success && result.booking) {
        Swal.fire({
          title: '¡Venta POS Emitida!',
          html: `
            <div class="text-left text-xs text-primary flex flex-col gap-2.5 mt-4 p-4 bg-background rounded-xl border border-surface-variant font-sans">
              <div class="text-center font-bold text-sm text-secondary mb-2">COMPROBANTE DE TAQUILLA</div>
              <p><strong>Operación:</strong> VENTA RÁPIDA POS</p>
              <p><strong>PNR Boleto:</strong> <span class="text-secondary font-black text-sm">${result.booking.pnrCode}</span></p>
              <p><strong>Atracción:</strong> ${activeAttraction?.name}</p>
              <p><strong>Actividad:</strong> ${result.booking.slotDate?.includes('-') ? result.booking.slotDate.split('-').reverse().join('/') : (result.booking.slotDate || 'Sin fecha')} | ${result.booking.slotStartTime || '--:--'} hs</p>
              <p><strong>Pasajeros:</strong> ${passengerCount}</p>
              <div class="h-px bg-surface-variant my-1"></div>
              <p class="font-bold text-success-green">Total Cobrado: $${grandTotal.toFixed(2)} (Efectivo/Tarjeta)</p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#0058bc',
          confirmButtonText: 'Nueva Venta POS'
        }).then(() => {
          setSelectedSlotId('');
          setPassengerCount(1);
          setPassengersList([
            { firstName: '', lastName: '', documentType: 'Cédula', documentNumber: '', priceTierLabel: 'Adulto', unitPrice: activeOption?.price_tiers[0]?.price || 40.00 }
          ]);
        });
      } else {
        Swal.fire({
          title: 'Error de Venta',
          text: result.message || 'No se pudo registrar la venta.',
          icon: 'error',
          confirmButtonColor: '#ba1a1a'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al procesar el cobro en el POS.',
        icon: 'error',
        confirmButtonColor: '#ba1a1a'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 text-left">
      
      {/* Encabezado */}
      <div className="flex flex-col gap-1 border-b border-surface-variant pb-4">
        <Link to="/admin" className="text-xs font-bold text-secondary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Volver al Dashboard</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">Taquilla Digital (POS Terminal)</h1>
      </div>

      {/* Grid POS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lado Izquierdo */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Configuración Producto */}
          <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">settings</span>
              <span>Configurar Producto</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs text-outline font-semibold">Seleccionar Atracción</label>
                <select 
                  value={selectedAttractionId}
                  onChange={(e) => handleAttractionChange(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-primary text-sm focus:outline-none focus:border-secondary"
                >
                  <option value="">Buscar Atracción...</option>
                  {attractions.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {selectedAttractionId && (
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs text-outline font-semibold">Modalidad</label>
                  <select 
                    value={selectedOptionId}
                    onChange={(e) => { setSelectedOptionId(e.target.value); setSelectedSlotId(''); }}
                    className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-primary text-sm focus:outline-none focus:border-secondary"
                  >
                    <option value="">Selecciona Modalidad...</option>
                    {activeAttraction?.product_options?.map(o => (
                      <option key={o.id} value={o.id}>{o.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Pronóstico Disponibilidad */}
          {selectedOptionId && (
            <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col gap-0.5 border-b border-surface-variant pb-2">
                <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span>Pronóstico de Disponibilidad Inmediata</span>
                </h3>
                <p className="text-[10px] text-outline font-semibold">
                  Horarios futuros con cupos disponibles para emitir boleto sin búsquedas.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {forecastSuggestions.map(sug => {
                  const isSelected = selectedSlotId === sug.id;
                  return (
                    <button 
                      key={sug.id}
                      type="button"
                      onClick={() => setSelectedSlotId(sug.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-secondary/15 border-secondary text-primary font-semibold shadow-sm'
                          : 'bg-background border-surface-variant text-on-surface-variant hover:border-outline'
                      }`}
                    >
                      <span className="text-[10px] text-outline font-bold font-mono">
                        {sug.slotDate.split('-').slice(1).reverse().join('/')}
                      </span>
                      <span className="text-xs font-black">{sug.startTime} hs</span>
                      <span className="text-[9px] font-bold text-success-green bg-success-green/10 px-1 py-0.5 rounded-full mt-1">
                        {sug.capacityAvailable} libres
                      </span>
                    </button>
                  );
                })}
                
                {forecastSuggestions.length === 0 && (
                  <div className="col-span-full py-4 text-center text-outline text-xs">
                    No hay horarios con cupos libres.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formularios Pasajeros */}
          {selectedSlot && (
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>Detalles de Pasajeros</span>
              </h3>

              {passengersList.map((passenger, pIdx) => (
                <div 
                  key={pIdx}
                  className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-surface-variant pb-2">
                    <span className="text-xs font-bold text-secondary">Pasajero #{pIdx + 1}</span>
                    <div className="flex gap-2">
                      {activeOption?.price_tiers.map(tier => (
                        <button 
                          key={tier.label}
                          type="button"
                          onClick={() => setPassengerTier(pIdx, tier.label)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                            passenger.priceTierLabel === tier.label
                              ? 'bg-secondary/10 border-secondary text-primary font-bold shadow-sm'
                              : 'bg-background border-surface-variant text-outline'
                          }`}
                        >
                          {tier.label} (${tier.price})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-outline font-semibold">Nombres</label>
                      <input 
                        type="text" 
                        value={passenger.firstName}
                        onChange={(e) => updatePassengerField(pIdx, 'firstName', e.target.value)}
                        placeholder="Ej: Sofía" 
                        className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-xs text-primary focus:outline-none focus:border-secondary" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-outline font-semibold">Apellidos</label>
                      <input 
                        type="text" 
                        value={passenger.lastName}
                        onChange={(e) => updatePassengerField(pIdx, 'lastName', e.target.value)}
                        placeholder="Ej: Castillo" 
                        className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-xs text-primary focus:outline-none focus:border-secondary" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-outline font-semibold">Cédula / Pasaporte</label>
                      <input 
                        type="text" 
                        value={passenger.documentNumber}
                        onChange={(e) => updatePassengerField(pIdx, 'documentNumber', e.target.value)}
                        placeholder="Ej: 1723456789" 
                        className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-xs font-mono text-primary focus:outline-none focus:border-secondary" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Lado Derecho: Totales POS */}
        <div>
          <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-surface-variant pb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              <span>Detalle de Venta</span>
            </h3>

            {!selectedSlot ? (
              <div className="text-center py-12 text-outline text-xs">
                Selecciona una atracción, modalidad y fecha en el panel izquierdo para calcular la facturación.
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-xs text-on-surface-variant">
                
                {/* Volumen de pasajeros */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-outline uppercase tracking-wider font-bold">Número de Tickets</label>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">Volumen</span>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => handlePassengerCountChange(Math.max(1, passengerCount - 1))}
                        className="w-8 h-8 rounded-lg bg-background hover:bg-surface-variant border border-surface-variant text-primary font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-primary">{passengerCount}</span>
                      <button 
                        type="button"
                        onClick={() => handlePassengerCountChange(Math.min(selectedSlot.capacityAvailable, passengerCount + 1))}
                        className="w-8 h-8 rounded-lg bg-background hover:bg-surface-variant border border-surface-variant text-primary font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-surface-variant my-1"></div>

                {/* Info Horario */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-outline">Fecha:</span>
                    <span className="font-bold text-primary">{selectedSlot.slotDate.split('-').reverse().join('/')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Horario:</span>
                    <span className="font-bold text-primary font-mono">{selectedSlot.startTime} hs</span>
                  </div>
                </div>

                <div className="h-px bg-surface-variant my-1"></div>

                {/* Precios */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuestos (15% IVA)</span>
                    <span className="font-semibold">${tax.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-surface-variant my-1"></div>
                  <div className="flex justify-between font-black text-sm text-primary">
                    <span>Total a Cobrar</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Confirmar Cobro POS */}
                <button 
                  type="button"
                  onClick={executePosSale}
                  className="w-full py-3 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 mt-2"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>Emitir Boleto POS</span>
                </button>

              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminPosTerminalView;
