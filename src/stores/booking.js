import { defineStore } from 'pinia'

const formatDateString = (date) => {
  return date.toISOString().split('T')[0]
}

export const useBookingStore = defineStore('booking', {
  state: () => {
    // Generar slots de desarrollo de respaldo
    const mockSlots = []
    const today = new Date()
    const options = ['po1', 'po2', 'po3', 'po4', 'po5']
    for (let i = 0; i < 20; i++) {
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + i)
      const dateStr = formatDateString(targetDate)
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
        })
      })
    }

    return {
      slots: JSON.parse(localStorage.getItem('booking_slots')) || mockSlots,
      bookings: JSON.parse(localStorage.getItem('booking_bookings')) || [],
      reviews: JSON.parse(localStorage.getItem('booking_reviews')) || []
    }
  },
  getters: {
    getSlotsByOption: (state) => (optionId) => state.slots.filter(s => s.productId === optionId && s.isActive),
    getSlotById: (state) => (id) => state.slots.find(s => s.id === id),
    getBookingsByUser: (state) => (userId) => state.bookings.filter(b => b.userId === userId),
    getBookingByPnr: (state) => (pnr) => state.bookings.find(b => b.pnrCode.toUpperCase() === pnr.toUpperCase()),
    getBookingById: (state) => (id) => state.bookings.find(b => b.id === id),
    getReviewsByAttraction: (state) => (attractionId) => state.reviews.filter(r => {
      const b = state.bookings.find(bk => bk.id === r.bookingId);
      return b && b.attractionId === attractionId;
    })
  },
  actions: {
    getAvailability(optionId, startDate, endDate) {
      return this.slots.filter(s => 
        s.productId === optionId && 
        s.slotDate >= startDate && 
        s.slotDate <= endDate && 
        s.isActive && 
        s.capacityAvailable > 0
      ).sort((a,b) => a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime))
    },

    async fetchSlots(optionId) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${baseUrl}/booking/booking/disponibilidad/${optionId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.data)) {
          // Aplanar y mapear el listado de disponibilidad diaria a la lista de slots que el frontend consume
          const fetchedSlots = [];
          result.data.forEach(day => {
            const dateStr = day.fecha;
            day.horarios.forEach(h => {
              fetchedSlots.push({
                id: h.slotId,
                productId: optionId,
                slotDate: dateStr,
                startTime: h.horaInicio,
                endTime: h.horaFin || this.calculateEndTime(h.horaInicio),
                capacityTotal: h.cuposTotales,
                capacityAvailable: h.cuposDisponibles,
                isActive: true
              });
            });
          });

          // Filtrar y actualizar los slots para esta opción en el estado actual, manteniendo otros
          const otherSlots = this.slots.filter(s => s.productId !== optionId);
          this.slots = [...otherSlots, ...fetchedSlots];
          this.saveToStorage();
          return { success: true };
        }
      } catch (error) {
        console.warn('Error al obtener cupos de disponibilidad del backend.', error);
      }
      return { success: false };
    },

    calculateEndTime(startTime) {
      if (!startTime) return '12:00';
      const [h, m] = startTime.split(':').map(Number);
      const endHour = (h + 2) % 24;
      return `${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    async fetchMisReservas(token) {
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
          this.bookings = result.data.map(b => ({
            id: b.id,
            pnrCode: b.pnrCode,
            statusName: b.statusName,
            totalAmount: b.totalAmount,
            currencyCode: b.currencyCode || 'USD',
            slotDate: b.slotDate,
            slotStartTime: b.slotStartTime,
            attractionName: b.attractionName,
            passengers: b.passengers || []
          }));
          this.saveToStorage();
          return { success: true };
        }
      } catch (error) {
        console.warn('Backend de reservas no disponible. Usando datos locales de respaldo.', error);
      }
      return { success: false };
    },

    async createBooking(userId, bookingRequest, token) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const idempotencyKey = crypto.randomUUID();
        const response = await fetch(`${baseUrl}/booking/v2/booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Idempotency-Key': idempotencyKey
          },
          body: JSON.stringify({
            slotId: bookingRequest.slotId,
            notes: bookingRequest.notes || '',
            passengers: bookingRequest.passengers.map(p => ({
              firstName: p.fullName.split(' ')[0] || 'Pasajero',
              lastName: p.fullName.split(' ')[1] || 'Sin Apellido',
              documentNumber: p.documentNumber,
              ticketCategoryName: p.priceTierLabel,
              unitPrice: p.unitPrice,
              priceTierId: p.priceTierId || '3fa85f64-5717-4562-b3fc-2c963f66afa6'
            }))
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const newBooking = {
            id: result.data.id,
            pnrCode: result.data.pnrCode,
            statusName: result.data.statusName,
            totalAmount: result.data.totalAmount,
            currencyCode: result.data.currencyCode || 'USD',
            slotDate: result.data.slotDate,
            slotStartTime: result.data.slotStartTime,
            attractionName: result.data.attractionName,
            passengers: bookingRequest.passengers
          };
          this.bookings.unshift(newBooking);
          this.saveToStorage();
          return { success: true, booking: newBooking };
        } else {
          return { success: false, message: result.message || 'Error al procesar la reserva' };
        }
      } catch (error) {
        // Fallback local en desarrollo
        const slot = this.slots.find(s => s.id === bookingRequest.slotId)
        if (!slot) return { success: false, message: 'Horario no encontrado.' }

        const totalPassengers = bookingRequest.passengers.length
        slot.capacityAvailable -= totalPassengers

        const pnr = 'PNR' + Math.random().toString(36).substring(2, 7).toUpperCase()
        const newBooking = {
          id: crypto.randomUUID(),
          pnrCode: pnr,
          userId: userId || 'guest-user',
          slotId: slot.id,
          statusName: 'Confirmed',
          totalAmount: bookingRequest.totalAmount,
          currencyCode: 'USD',
          notes: bookingRequest.notes || '',
          attractionId: bookingRequest.attractionId,
          attractionName: bookingRequest.attractionName,
          productTitle: bookingRequest.productTitle,
          slotDate: slot.slotDate,
          slotStartTime: slot.startTime,
          passengers: bookingRequest.passengers
        }

        this.bookings.unshift(newBooking)
        this.saveToStorage()
        return { success: true, booking: newBooking }
      }
    },

    async cancelBooking(bookingId, cancelReason, token) {
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
          const booking = this.bookings.find(b => b.id === bookingId);
          if (booking) {
            booking.statusName = 'Cancelled';
            booking.cancelReason = cancelReason;
          }
          this.saveToStorage();
          return { success: true };
        }
      } catch (error) {
        // Fallback local
        const booking = this.bookings.find(b => b.id === bookingId)
        if (booking) {
          booking.statusName = 'Cancelled'
          booking.cancelReason = cancelReason
          this.saveToStorage()
          return { success: true }
        }
      }
      return { success: false, message: 'No se pudo cancelar la reserva' };
    },

    saveToStorage() {
      localStorage.setItem('booking_slots', JSON.stringify(this.slots))
      localStorage.setItem('booking_bookings', JSON.stringify(this.bookings))
    }
  }
})
