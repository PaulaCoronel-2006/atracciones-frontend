import React, { useState, useEffect, useMemo } from 'react';
import { useBooking } from '../context/BookingContext';
import { AttractionSlot } from '../context/CartContext';

interface CalendarAvailabilityProps {
  optionId: string;
  onSelectSlot: (slot: AttractionSlot) => void;
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const CalendarAvailability: React.FC<CalendarAvailabilityProps> = ({ optionId, onSelectSlot }) => {
  const { getAvailability, fetchSlots } = useBooking();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [activeSlotId, setActiveSlotId] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const currentMonthLabel = `${monthNames[month]} ${year}`;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDateStr('');
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDateStr('');
  };

  // Cargar slots cuando cambie la opción elegida
  useEffect(() => {
    fetchSlots(optionId);
    setSelectedDateStr('');
    setActiveSlotId('');
  }, [optionId]);

  // Obtener slots filtrados
  const slotsForOption = useMemo(() => {
    return getAvailability(optionId, '2020-01-01', '2030-12-31');
  }, [optionId, getAvailability]);

  // Agrupar slots por fecha
  const slotsByDate = useMemo(() => {
    const map: Record<string, AttractionSlot[]> = {};
    slotsForOption.forEach(slot => {
      if (!map[slot.slotDate]) {
        map[slot.slotDate] = [];
      }
      map[slot.slotDate].push(slot);
    });
    return map;
  }, [slotsForOption]);

  // Generar días
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Lunes = 1, Domingo = 7 (ajustar de 0-6 index)
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      day: number | null;
      dateStr: string;
      isDummy: boolean;
      isPast: boolean;
      status: 'no-scheduled' | 'available' | 'fully-booked';
      slots: AttractionSlot[];
      totalAvailable: number;
    }> = [];

    // Rellenar días anteriores vacíos
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({
        day: null,
        dateStr: '',
        isDummy: true,
        isPast: false,
        status: 'no-scheduled',
        slots: [],
        totalAvailable: 0
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Días reales
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const dateStr = dayDate.toISOString().split('T')[0];
      const daySlots = slotsByDate[dateStr] || [];
      const totalAvailable = daySlots.reduce((sum, s) => sum + s.capacityAvailable, 0);
      const isPast = dateStr < todayStr;

      let status: 'no-scheduled' | 'available' | 'fully-booked' = 'no-scheduled';
      if (daySlots.length > 0) {
        status = totalAvailable > 0 ? 'available' : 'fully-booked';
      }

      days.push({
        day: d,
        dateStr,
        isDummy: false,
        isPast,
        status,
        slots: daySlots,
        totalAvailable
      });
    }

    return days;
  }, [year, month, slotsByDate]);

  const activeDaySlots = useMemo(() => {
    if (!selectedDateStr) return [];
    return slotsByDate[selectedDateStr] || [];
  }, [selectedDateStr, slotsByDate]);

  const selectDay = (day: typeof calendarDays[0]) => {
    if (day.isDummy || day.isPast || day.status === 'no-scheduled') return;
    setSelectedDateStr(day.dateStr);
    setActiveSlotId('');
  };

  const selectSlot = (slot: AttractionSlot) => {
    if (slot.capacityAvailable <= 0) return;
    setActiveSlotId(slot.id);
    onSelectSlot(slot);
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-surface-variant flex flex-col gap-4 text-left shadow-sm">
      
      {/* Header del Calendario */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Disponibilidad</h3>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={prevMonth} 
            className="p-1 rounded-lg bg-surface hover:bg-surface-variant text-on-surface transition-colors cursor-pointer border border-surface-variant flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="text-xs font-semibold text-primary min-w-[110px] text-center">
            {currentMonthLabel}
          </span>
          <button 
            type="button" 
            onClick={nextMonth} 
            className="p-1 rounded-lg bg-surface hover:bg-surface-variant text-on-surface transition-colors cursor-pointer border border-surface-variant flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 text-center border-b border-surface-variant pb-2">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(dayName => (
          <span key={dayName} className="text-[10px] font-bold text-outline uppercase">
            {dayName}
          </span>
        ))}
      </div>

      {/* Grilla de Días */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {calendarDays.map((day, idx) => {
          if (day.isDummy) {
            return <div key={`dummy-${idx}`} className="aspect-square"></div>;
          }

          const isSelected = day.dateStr === selectedDateStr;

          return (
            <button
              key={`day-${day.day}`}
              type="button"
              onClick={() => selectDay(day)}
              disabled={day.isPast || day.status === 'no-scheduled'}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-1 text-xs font-semibold relative transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'ring-2 ring-secondary bg-secondary/15 text-primary' 
                  : ''
              } ${
                day.isPast 
                  ? 'text-outline/40 bg-transparent opacity-30 cursor-not-allowed' 
                  : ''
              } ${
                day.status === 'no-scheduled' && !day.isPast 
                  ? 'text-outline bg-transparent opacity-40 cursor-not-allowed' 
                  : ''
              } ${
                day.status === 'fully-booked' 
                  ? 'bg-error-container text-error/60 border border-error/20 line-through cursor-not-allowed' 
                  : ''
              } ${
                day.status === 'available' && !isSelected 
                  ? 'bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 hover:scale-105' 
                  : ''
              }`}
            >
              <span>{day.day}</span>
              {day.status === 'available' && (
                <span className="text-[7px] px-1 rounded-full absolute bottom-1 bg-secondary text-white font-bold">
                  {day.totalAvailable}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-[9px] text-on-surface-variant border-t border-surface-variant pt-3">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-secondary/10 border border-secondary/20"></span>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-error-container border border-error/20 line-through"></span>
          <span>Agotado</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-transparent border border-surface-variant"></span>
          <span>Sin Horarios</span>
        </div>
      </div>

      {/* Lista de Horarios */}
      {selectedDateStr && (
        <div className="border-t border-surface-variant pt-4 mt-2 transition-all duration-200">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>Horarios para el {selectedDateStr.split('-').reverse().join('/')}</span>
          </h4>

          <div className="flex flex-col gap-2.5">
            {activeDaySlots.map(slot => {
              const isSlotSelected = slot.id === activeSlotId;
              const isFull = slot.capacityAvailable <= 0;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => selectSlot(slot)}
                  disabled={isFull}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSlotSelected 
                      ? 'bg-secondary/10 border-secondary shadow-sm' 
                      : 'bg-background border-surface-variant hover:border-outline'
                  } ${isFull ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                >
                  <div>
                    <div className="text-sm font-bold text-primary flex items-center gap-1">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    {/* Barra visual de disponibilidad */}
                    <div className="w-32 h-1.5 rounded-full bg-surface-variant overflow-hidden mt-1.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          slot.capacityAvailable <= 2 ? 'bg-error' : 'bg-success-green'
                        }`}
                        style={{ width: `${(slot.capacityAvailable / slot.capacityTotal) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col gap-0.5">
                    <span className={`text-xs font-bold ${
                      slot.capacityAvailable <= 2 ? 'text-error' : 'text-success-green'
                    }`}>
                      {slot.capacityAvailable} / {slot.capacityTotal} libres
                    </span>
                    <span className="text-[9px] text-outline">
                      {slot.capacityAvailable <= 2 ? '¡Últimos cupos!' : 'Cupos disponibles'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
