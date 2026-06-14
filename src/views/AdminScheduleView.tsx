import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';
import { useBooking } from '../context/BookingContext';
import Swal from 'sweetalert2';

const days = [
  { label: 'Lu', value: 1 },
  { label: 'Ma', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Ju', value: 4 },
  { label: 'Vi', value: 5 },
  { label: 'Sá', value: 6 },
  { label: 'Do', value: 0 }
];

const AdminScheduleView: React.FC = () => {
  const { attractions } = useCatalog();
  const { slots, generateScheduleMassive, bulkDeleteSlots } = useBooking();

  const [selectedAttractionId, setSelectedAttractionId] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState('');

  // Generador Masivo
  const [genStartDate, setGenStartDate] = useState('');
  const [genEndDate, setGenEndDate] = useState('');
  const [genStartTime, setGenStartTime] = useState('09:00');
  const [genEndTime, setGenEndTime] = useState('14:00');
  const [genCapacity, setGenCapacity] = useState(20);
  const [genDaysOfWeek, setGenDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);

  // Depuración Lote
  const [delStartDate, setDelStartDate] = useState('');
  const [delEndDate, setDelEndDate] = useState('');

  const handleAttractionChange = (attractionId: string) => {
    setSelectedAttractionId(attractionId);
    setSelectedOptionId('');
    const attr = attractions.find(a => a.id === attractionId);
    if (attr && attr.product_options.length > 0) {
      setSelectedOptionId(attr.product_options[0].id);
    }
  };

  const activeAttraction = useMemo(() => {
    return attractions.find(a => a.id === selectedAttractionId) || null;
  }, [attractions, selectedAttractionId]);

  const toggleGenDay = (dayVal: number) => {
    setGenDaysOfWeek(prev => 
      prev.includes(dayVal) ? prev.filter(d => d !== dayVal) : [...prev, dayVal]
    );
  };

  const executeGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId) {
      Swal.fire({
        title: 'Modalidad requerida',
        text: 'Selecciona una atracción y una modalidad antes de generar.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    if (!genStartDate || !genEndDate) {
      Swal.fire({
        title: 'Fechas requeridas',
        text: 'Por favor, selecciona un rango de fechas de inicio y fin.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    if (genDaysOfWeek.length === 0) {
      Swal.fire({
        title: 'Selecciona días de la semana',
        text: 'Debes marcar al menos un día de la semana para la plantilla.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    const createdCount = generateScheduleMassive(selectedOptionId, {
      startDate: genStartDate,
      endDate: genEndDate,
      startTime: genStartTime,
      endTime: genEndTime,
      capacity: genCapacity,
      daysOfWeek: genDaysOfWeek
    });

    Swal.fire({
      title: 'Horarios Generados',
      text: `Se crearon con éxito ${createdCount} nuevos slots de disponibilidad basados en la plantilla.`,
      icon: 'success',
      confirmButtonColor: '#0058bc'
    });
  };

  const executeBulkDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId) return;

    if (!delStartDate || !delEndDate) {
      Swal.fire({
        title: 'Rango de fechas requerido',
        text: 'Ingresa las fechas de inicio y fin para la depuración en lote.',
        icon: 'warning',
        confirmButtonColor: '#0058bc'
      });
      return;
    }

    Swal.fire({
      title: '¿Proceder con la Limpieza?',
      text: 'Esta acción eliminará masivamente todos los slots vacíos sin reservas en este rango de fechas. ¡No se puede deshacer!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#747782',
      confirmButtonText: 'Sí, depurar slots',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const deletedCount = bulkDeleteSlots(selectedOptionId, delStartDate, delEndDate);
        
        Swal.fire({
          title: 'Depuración Completada',
          text: `Se eliminaron ${deletedCount} slots de disponibilidad que no contaban con reservas activas.`,
          icon: 'success',
          confirmButtonColor: '#0058bc'
        });

        setDelStartDate('');
        setDelEndDate('');
      }
    });
  };

  const activeSlots = useMemo(() => {
    if (!selectedOptionId) return [];
    return slots
      .filter(s => s.productId === selectedOptionId)
      .sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime));
  }, [slots, selectedOptionId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 text-left">
      
      {/* Encabezado */}
      <div className="flex flex-col gap-1 border-b border-surface-variant pb-4">
        <Link to="/admin" className="text-xs font-bold text-secondary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Volver al Dashboard</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">Gestión de Slots e Inventario</h1>
      </div>

      {/* Selector de Producto */}
      <div className="bg-white rounded-2xl p-5 border border-surface-variant grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-outline font-semibold">Seleccionar Atracción</label>
          <select 
            value={selectedAttractionId}
            onChange={(e) => handleAttractionChange(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-primary text-sm focus:outline-none focus:border-secondary"
          >
            <option value="">Selecciona Atracción...</option>
            {attractions.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {selectedAttractionId && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-outline font-semibold">Modalidad del Tour</label>
            <select 
              value={selectedOptionId}
              onChange={(e) => setSelectedOptionId(e.target.value)}
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

      {/* Controles del Calendario */}
      {selectedOptionId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formularios (Izquierda) */}
          <div className="flex flex-col gap-6">
            
            {/* Generador Masivo */}
            <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b border-surface-variant pb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">settings</span>
                <span>Generador Masivo (Plantilla)</span>
              </h3>

              <form onSubmit={executeGenerate} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-outline font-semibold">Fecha Inicio</label>
                    <input 
                      type="date" 
                      value={genStartDate}
                      onChange={(e) => setGenStartDate(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary focus:outline-none focus:border-secondary" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-outline font-semibold">Fecha Fin</label>
                    <input 
                      type="date" 
                      value={genEndDate}
                      onChange={(e) => setGenEndDate(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary focus:outline-none focus:border-secondary" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-outline font-semibold">Hora Inicio</label>
                    <input 
                      type="time" 
                      value={genStartTime}
                      onChange={(e) => setGenStartTime(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary focus:outline-none focus:border-secondary" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-outline font-semibold">Hora Fin</label>
                    <input 
                      type="time" 
                      value={genEndTime}
                      onChange={(e) => setGenEndTime(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary focus:outline-none focus:border-secondary" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <label className="text-outline font-semibold">Capacidad Total de Personas</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={genCapacity}
                    onChange={(e) => setGenCapacity(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary font-bold focus:outline-none focus:border-secondary" 
                  />
                </div>

                {/* Selector de Días */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="text-outline font-semibold">Días Operativos</label>
                  <div className="flex gap-1.5 justify-between">
                    {days.map(d => {
                      const isActive = genDaysOfWeek.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleGenDay(d.value)}
                          className={`w-8 h-8 rounded-full border text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                            isActive 
                              ? 'bg-secondary border-secondary text-white font-extrabold shadow-sm' 
                              : 'bg-background border-surface-variant text-outline'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer shadow-sm active:scale-95 mt-2"
                >
                  Generar Horarios Masivamente
                </button>
              </form>
            </div>

            {/* Limpieza Bulk */}
            <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm">
              <h3 className="text-xs font-bold text-error uppercase tracking-wider border-b border-surface-variant pb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                <span>Limpieza en Lote (Bulk Delete)</span>
              </h3>
              <p className="text-[10px] text-outline leading-relaxed font-semibold">
                Permite depurar slots vacíos sin boletos vendidos. Los slots que ya tengan reservas están protegidos del borrado.
              </p>

              <form onSubmit={executeBulkDelete} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-outline font-semibold">Fecha Inicio</label>
                    <input 
                      type="date" 
                      value={delStartDate}
                      onChange={(e) => setDelStartDate(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary focus:outline-none focus:border-secondary" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-outline font-semibold">Fecha Fin</label>
                    <input 
                      type="date" 
                      value={delEndDate}
                      onChange={(e) => setDelEndDate(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-background border border-outline-variant text-primary focus:outline-none focus:border-secondary" 
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-error/10 hover:bg-error/20 text-error border border-error/20 transition-all cursor-pointer active:scale-95"
                >
                  Limpiar Slots en Rango
                </button>
              </form>
            </div>

          </div>

          {/* Listado Monitor (Derecha - 2 columnas) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-surface-variant flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center justify-between border-b border-surface-variant pb-2">
              <span>Monitor de Ocupación de Slots</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-background border border-surface-variant text-outline font-semibold">
                {activeSlots.length} slots programados
              </span>
            </h3>

            {activeSlots.length === 0 ? (
              <div className="text-center py-16 text-outline text-xs">
                No hay horarios programados. ¡Usa la herramienta de generación para comenzar!
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-2">
                {activeSlots.map(slot => {
                  const sold = slot.capacityTotal - slot.capacityAvailable;
                  const isFull = slot.capacityAvailable === 0;

                  return (
                    <div 
                      key={slot.id}
                      className="p-4 rounded-2xl bg-background border border-surface-variant flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary text-xl">calendar_today</span>
                        <div className="flex flex-col text-left gap-0.5">
                          <span className="font-bold text-primary text-sm">
                            Fecha: {slot.slotDate.split('-').reverse().join('/')}
                          </span>
                          <span className="text-outline font-semibold font-mono">
                            Hora: {slot.startTime} hs - {slot.endTime} hs
                          </span>
                        </div>
                      </div>

                      {/* Progreso de cupos vendidos */}
                      <div className="flex-grow max-w-xs flex flex-col gap-1.5 text-left">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-outline">Cupos Vendidos</span>
                          <span className="text-primary">{sold} / {slot.capacityTotal}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-variant overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-secondary transition-all duration-300"
                            style={{ width: `${(sold / slot.capacityTotal) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col gap-1 items-end">
                        <span 
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide border ${
                            isFull 
                              ? 'bg-error/10 text-error border-error/20' 
                              : 'bg-success-green/10 text-success-green border-success-green/20'
                          }`}
                        >
                          {isFull ? 'Agotado' : `${slot.capacityAvailable} disponibles`}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-2xl p-16 text-center border border-surface-variant text-outline text-xs shadow-sm">
          Por favor, selecciona una atracción en la barra superior para gestionar su disponibilidad.
        </div>
      )}

    </div>
  );
};

export default AdminScheduleView;
