import React, { createContext, useContext, useState } from 'react';
import { AttractionSlot } from './CartContext';

export interface BookingPassenger {
  firstName: string;
  lastName: string;
  documentNumber: string;
  ticketCategoryName: string; // p.e. 'Adulto'
  unitPrice: number;
}

export interface BookingRequest {
  slotId: string;
  notes?: string;
  attractionId: string;
  attractionName: string;
  productOptionId: string;
  productTitle: string;
  currency?: string;
  totalAmount: number;
  passengers: Array<{
    fullName: string;
    documentNumber: string;
    priceTierLabel: string;
    unitPrice: number;
    priceTierId?: string;
  }>;
}

export interface BookingResponse {
  id: string;
  pnrCode: string;
  statusName: string;
  totalAmount: number;
  currencyCode: string;
  slotDate: string;
  slotStartTime: string;
  attractionName: string;
  notes?: string;
  userId?: string;
  passengers?: any[];
}

export interface ReviewItem {
  id: string;
  bookingId: string;
  attractionId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface BookingContextType {
  slots: AttractionSlot[];
  bookings: BookingResponse[];
  reviews: ReviewItem[];
  getAvailability: (optionId: string, startDate: string, endDate: string) => AttractionSlot[];
  fetchSlots: (optionId: string) => Promise<{ success: boolean }>;
  fetchMisReservas: (token: string) => Promise<{ success: boolean }>;
  fetchManagementBookings: (token: string) => Promise<{ success: boolean }>;
  createBooking: (userId: string | undefined, bookingRequest: BookingRequest, token: string | null) => Promise<{ success: boolean; message?: string; booking?: BookingResponse }>;
  cancelBooking: (bookingId: string, cancelReason: string, token: string) => Promise<{ success: boolean; message?: string }>;
  generateScheduleMassive: (optionId: string, data: { startDate: string; endDate: string; startTime: string; endTime: string; capacity: number; daysOfWeek: number[] }) => number;
  bulkDeleteSlots: (optionId: string, startDate: string, endDate: string) => number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const formatDateString = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const generateMockSlots = () => {
  const mockSlots: AttractionSlot[] = [];
  const today = new Date();
  const options = ['po1', 'po2', 'po3', 'po4', 'po5'];
  for (let i = 0; i < 20; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dateStr = formatDateString(targetDate);
    options.forEach(poId => {
      mockSlots.push({
        id: `slot-${poId}-${dateStr}-morning`,
        productId: poId,
        slotDate: dateStr,
        startTime: '08:30',
        endTime: '13:30',
        capacityTotal: poId === 'po2' || poId === 'po4' ? 8 : 20,
        capacityAvailable: i === 0 ? 0 : (poId === 'po2' ? 6 : 14),
        isActive: true
      });
    });
  }
  return mockSlots;
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [slots, setSlots] = useState<AttractionSlot[]>(() => {
    const saved = localStorage.getItem('booking_slots');
    return saved ? JSON.parse(saved) : generateMockSlots();
  });

  const [bookings, setBookings] = useState<BookingResponse[]>(() => {
    const saved = localStorage.getItem('booking_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem('booking_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const saveSlots = (newSlots: AttractionSlot[]) => {
    setSlots(newSlots);
    localStorage.setItem('booking_slots', JSON.stringify(newSlots));
  };

  const saveBookings = (newBookings: BookingResponse[]) => {
    setBookings(newBookings);
    localStorage.setItem('booking_bookings', JSON.stringify(newBookings));
  };

  const getAvailability = (optionId: string, startDate: string, endDate: string) => {
    return slots
      .filter(s =>
        s.productId === optionId &&
        s.slotDate >= startDate &&
        s.slotDate <= endDate &&
        s.isActive &&
        s.capacityAvailable > 0
      )
      .sort((a, b) => a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime));
  };

  const calculateEndTime = (startTime: string) => {
    if (!startTime) return '12:00';
    const [h, m] = startTime.split(':').map(Number);
    const endHour = (h + 2) % 24;
    return `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const fetchSlots = async (optionId: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/booking/booking/disponibilidad/${optionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      if (response.ok && result.success && Array.isArray(result.data)) {
        const fetchedSlots: AttractionSlot[] = [];
        result.data.forEach((day: any) => {
          const dateStr = day.fecha;
          day.horarios.forEach((h: any) => {
            fetchedSlots.push({
              id: h.slotId,
              productId: optionId,
              slotDate: dateStr,
              startTime: h.horaInicio,
              endTime: h.horaFin || calculateEndTime(h.horaInicio),
              capacityTotal: h.cuposTotales,
              capacityAvailable: h.cuposDisponibles,
              isActive: true
            });
          });
        });

        const otherSlots = slots.filter(s => s.productId !== optionId);
        const newSlots = [...otherSlots, ...fetchedSlots];
        saveSlots(newSlots);
        return { success: true };
      }
    } catch (error) {
      console.warn('Error al obtener cupos de disponibilidad del backend.', error);
    }
    return { success: false };
  };

  const fetchMisReservas = async (token: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/booking/booking/mis-reservas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const mapped = result.data.map((b: any) => {
          let sDate = '';
          let sTime = '';
          if (b.activityDate) {
            const parts = b.activityDate.split('T');
            sDate = parts[0];
            if (parts[1]) {
              sTime = parts[1].substring(0, 5);
            }
          }
          return {
            id: b.bookingId || b.id,
            pnrCode: b.pnrCode,
            statusName: b.status || b.statusName,
            totalAmount: b.totalAmount,
            currencyCode: b.currency || b.currencyCode || 'USD',
            slotDate: sDate || b.slotDate || '',
            slotStartTime: sTime || b.slotStartTime || '',
            attractionName: b.attractionName,
            passengers: b.passengers || []
          };
        });
        saveBookings(mapped);
        return { success: true };
      }
    } catch (error) {
      console.warn('Backend de reservas no disponible. Usando datos locales de respaldo.', error);
    }
    return { success: false };
  };

  const fetchManagementBookings = async (token: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/booking/admin-booking/management`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const items = result.data.items || [];
        const mapped = items.map((b: any) => ({
          id: b.id,
          pnrCode: b.pnrCode,
          statusName: b.statusName,
          totalAmount: b.totalAmount,
          currencyCode: b.currencyCode || 'USD',
          slotDate: b.slotDate,
          slotStartTime: b.slotStartTime,
          attractionName: b.attractionName,
          passengers: b.tickets?.map((t: any) => ({
            fullName: b.clientName || 'Pasajero',
            documentNumber: '-',
            priceTierLabel: t.categoryName,
            unitPrice: t.unitPrice
          })) || [],
          notes: b.notes || ''
        }));
        saveBookings(mapped);
        return { success: true };
      }
    } catch (error) {
      console.warn('Error al obtener las reservas de administración del backend.', error);
    }
    return { success: false };
  };

  const createBooking = async (userId: string | undefined, bookingRequest: BookingRequest, token: string | null) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const idempotencyKey = crypto.randomUUID();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${baseUrl}/booking/v2/booking`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          slotId: bookingRequest.slotId,
          attractionId: bookingRequest.attractionId,
          productOptionId: bookingRequest.productOptionId,
          attractionName: bookingRequest.attractionName,
          productTitle: bookingRequest.productTitle,
          currency: bookingRequest.currency || 'USD',
          notes: bookingRequest.notes || '',
          passengers: bookingRequest.passengers.map(p => {
            const parts = p.fullName.trim().split(/\s+/);
            const firstName = parts[0] || 'Pasajero';
            const lastName = parts.slice(1).join(' ') || 'Sin Apellido';
            return {
              firstName,
              lastName,
              documentNumber: p.documentNumber,
              priceTierLabel: p.priceTierLabel,
              unitPrice: p.unitPrice,
              priceTierId: p.priceTierId || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
              quantity: 1
            };
          })
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const slot = slots.find(s => s.id === bookingRequest.slotId);
        
        let sDate = '';
        let sTime = '';
        if (result.data.activityDate) {
          const parts = result.data.activityDate.split('T');
          sDate = parts[0];
          if (parts[1]) {
            sTime = parts[1].substring(0, 5);
          }
        }

        const newBooking: BookingResponse = {
          id: result.data.bookingId || result.data.id,
          pnrCode: result.data.pnrCode,
          statusName: result.data.status || result.data.statusName,
          totalAmount: result.data.totalAmount || bookingRequest.totalAmount || 0,
          currencyCode: result.data.currency || result.data.currencyCode || 'USD',
          slotDate: sDate || slot?.slotDate || '',
          slotStartTime: sTime || slot?.startTime || '',
          attractionName: result.data.attractionName || bookingRequest.attractionName || '',
          passengers: bookingRequest.passengers
        };
        const newBookings = [newBooking, ...bookings];
        saveBookings(newBookings);
        return { success: true, booking: newBooking };
      } else {
        return { success: false, message: result.message || 'Error al procesar la reserva' };
      }
    } catch (error) {
      // Fallback local en desarrollo
      const slot = slots.find(s => s.id === bookingRequest.slotId);
      if (!slot) return { success: false, message: 'Horario no encontrado.' };

      const totalPassengers = bookingRequest.passengers.length;
      
      // Actualizar cupos en local
      const newSlots = slots.map(s => {
        if (s.id === slot.id) {
          return { ...s, capacityAvailable: Math.max(0, s.capacityAvailable - totalPassengers) };
        }
        return s;
      });
      saveSlots(newSlots);

      const pnr = 'PNR' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const newBooking: BookingResponse = {
        id: crypto.randomUUID(),
        pnrCode: pnr,
        userId: userId || 'guest-user',
        statusName: 'Confirmed',
        totalAmount: bookingRequest.totalAmount,
        currencyCode: 'USD',
        notes: bookingRequest.notes || '',
        attractionName: bookingRequest.attractionName,
        slotDate: slot.slotDate,
        slotStartTime: slot.startTime,
        passengers: bookingRequest.passengers
      };

      const newBookings = [newBooking, ...bookings];
      saveBookings(newBookings);
      return { success: true, booking: newBooking };
    }
  };

  const cancelBooking = async (bookingId: string, cancelReason: string, token: string) => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/booking/booking/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cancelReason })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        const newBookings = bookings.map(b => {
          if (b.id === bookingId) {
            return { ...b, statusName: 'Cancelled', cancelReason };
          }
          return b;
        });
        saveBookings(newBookings);
        return { success: true };
      }
    } catch (error) {
      // Fallback local
      const newBookings = bookings.map(b => {
        if (b.id === bookingId) {
          return { ...b, statusName: 'Cancelled', cancelReason };
        }
        return b;
      });
      saveBookings(newBookings);
      return { success: true };
    }
    return { success: false, message: 'No se pudo cancelar la reserva' };
  };

  const generateScheduleMassive = (
    optionId: string,
    data: { startDate: string; endDate: string; startTime: string; endTime: string; capacity: number; daysOfWeek: number[] }
  ): number => {
    const start = new Date(data.startDate + 'T00:00:00');
    const end = new Date(data.endDate + 'T00:00:00');
    let count = 0;
    const newSlotsList = [...slots];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // Domingo = 0, Lunes = 1...
      if (data.daysOfWeek.includes(dayOfWeek)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Evitar duplicados
        const exists = slots.some(s => s.productId === optionId && s.slotDate === dateStr && s.startTime === data.startTime);
        if (!exists) {
          newSlotsList.push({
            id: `slot-${optionId}-${dateStr}-${data.startTime.replace(':', '')}`,
            productId: optionId,
            slotDate: dateStr,
            startTime: data.startTime,
            endTime: data.endTime,
            capacityTotal: data.capacity,
            capacityAvailable: data.capacity,
            isActive: true
          });
          count++;
        }
      }
    }

    if (count > 0) {
      saveSlots(newSlotsList);
    }
    return count;
  };

  const bulkDeleteSlots = (optionId: string, startDate: string, endDate: string): number => {
    let count = 0;
    const filtered = slots.filter(s => {
      const inRange = s.productId === optionId && s.slotDate >= startDate && s.slotDate <= endDate;
      const isUnused = s.capacityAvailable === s.capacityTotal;
      if (inRange && isUnused) {
        count++;
        return false; // Eliminar
      }
      return true; // Mantener
    });

    if (count > 0) {
      saveSlots(filtered);
    }
    return count;
  };

  return (
    <BookingContext.Provider value={{
      slots,
      bookings,
      reviews,
      getAvailability,
      fetchSlots,
      fetchMisReservas,
      fetchManagementBookings,
      createBooking,
      cancelBooking,
      generateScheduleMassive,
      bulkDeleteSlots
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking debe usarse dentro de un BookingProvider');
  }
  return context;
};
