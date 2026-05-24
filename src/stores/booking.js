import { defineStore } from 'pinia'

// Auxiliar para formatear fechas
const formatDateString = (date) => {
  return date.toISOString().split('T')[0]
}

export const useBookingStore = defineStore('booking', {
  state: () => {
    // Generar slots automáticos para las próximas 30 días para pruebas ricas
    const mockSlots = []
    const today = new Date()
    const options = ['po1', 'po2', 'po3', 'po4', 'po5'] // Product options
    
    // Generar slots predeterminados
    for (let i = 0; i < 20; i++) {
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + i)
      const dateStr = formatDateString(targetDate)
      
      options.forEach(poId => {
        // Generar un slot en la mañana y otro en la tarde
        mockSlots.push({
          id: `slot-${poId}-${dateStr}-morning`,
          productId: poId,
          slotDate: dateStr,
          startTime: '08:30',
          endTime: '13:30',
          capacityTotal: poId === 'po2' || poId === 'po4' ? 8 : 20, // Privado vs Compartido
          capacityAvailable: i === 0 ? 0 : (i === 1 ? 1 : (poId === 'po2' ? 6 : 14)), // i=0 agotado, i=1 casi lleno
          isActive: true
        })

        mockSlots.push({
          id: `slot-${poId}-${dateStr}-afternoon`,
          productId: poId,
          slotDate: dateStr,
          startTime: '14:00',
          endTime: '19:00',
          capacityTotal: poId === 'po2' || poId === 'po4' ? 8 : 20,
          capacityAvailable: i === 4 ? 0 : (poId === 'po2' ? 8 : 18),
          isActive: true
        })
      })
    }

    // Historial de reservas preexistente
    const mockBookings = [
      {
        id: 'b-99999991',
        correlationId: crypto.randomUUID(),
        pnrCode: 'GAL92A45',
        userId: '33333333-3333-3333-3333-333333333333', // Sofía (Client)
        slotId: `slot-po1-${formatDateString(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000))}-morning`, // Pasado
        statusId: 3, // Completed
        statusName: 'Completed',
        totalAmount: 920.00,
        currencyCode: 'USD',
        notes: 'Celebrando aniversario de bodas.',
        attractionId: 'a1111111-1111-1111-1111-111111111111',
        attractionName: 'Crucero Premium por las Islas Galápagos',
        productTitle: 'Tour Compartido en Yate Exclusivo',
        slotDate: formatDateString(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
        slotStartTime: '08:30',
        createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        passengers: [
          { fullName: 'Sofía Castillo', documentNumber: '1723456789', priceTierLabel: 'Adulto', unitPrice: 350.00, quantity: 1 },
          { fullName: 'Andrés Mendoza', documentNumber: '1798765432', priceTierLabel: 'Adulto', unitPrice: 350.00, quantity: 1 }
        ]
      },
      {
        id: 'b-99999992',
        correlationId: crypto.randomUUID(),
        pnrCode: 'UIO11F88',
        userId: '33333333-3333-3333-3333-333333333333', // Sofía
        slotId: `slot-po3-${formatDateString(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000))}-morning`, // Futuro
        statusId: 2, // Confirmed
        statusName: 'Confirmed',
        totalAmount: 115.00,
        currencyCode: 'USD',
        notes: 'Sofía necesita silla de ruedas para transporte.',
        attractionId: 'a2222222-2222-2222-2222-222222222222',
        attractionName: 'Quito Colonial y Joyas de la Mitad del Mundo',
        productTitle: 'Tour Grupal en Autobús Panorámico',
        slotDate: formatDateString(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
        slotStartTime: '08:30',
        createdAt: new Date().toISOString(),
        passengers: [
          { fullName: 'Sofía Castillo', documentNumber: '1723456789', priceTierLabel: 'Adulto', unitPrice: 45.00, quantity: 1 },
          { fullName: 'María Castillo', documentNumber: '1712233445', priceTierLabel: 'Tercera Edad', unitPrice: 30.00, quantity: 1 },
          { fullName: 'Lucas Castillo', documentNumber: '1723456780', priceTierLabel: 'Niño', unitPrice: 25.00, quantity: 1 }
        ]
      }
    ]

    return {
      slots: JSON.parse(localStorage.getItem('booking_slots')) || mockSlots,
      bookings: JSON.parse(localStorage.getItem('booking_bookings')) || mockBookings,
      reviews: JSON.parse(localStorage.getItem('booking_reviews')) || [
        { id: 'r1', bookingId: 'b-99999991', userId: '33333333-3333-3333-3333-333333333333', overallScore: 5.0, comment: '¡Fue una experiencia mágica e inolvidable! El guía naturalista tenía un conocimiento impresionante de la fauna de las islas. Recomendado 100%.' }
      ]
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
    // Buscar disponibilidad para un producto en rango de fechas
    getAvailability(optionId, startDate, endDate) {
      return this.slots.filter(s => 
        s.productId === optionId && 
        s.slotDate >= startDate && 
        s.slotDate <= endDate && 
        s.isActive && 
        s.capacityAvailable > 0
      ).sort((a,b) => a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime))
    },

    // Crear una nueva reserva (Simulado)
    createBooking(userId, bookingRequest) {
      const slot = this.slots.find(s => s.id === bookingRequest.slotId)
      if (!slot) return { success: false, message: 'Horario no encontrado.' }

      const totalPassengers = bookingRequest.passengers.length
      if (slot.capacityAvailable < totalPassengers) {
        return { success: false, message: `Disponibilidad insuficiente. Cupos libres: ${slot.capacityAvailable}` }
      }

      // Decrementar disponibilidad del slot
      slot.capacityAvailable -= totalPassengers

      const pnr = 'PNR' + Math.random().toString(36).substring(2, 7).toUpperCase()
      const newBooking = {
        id: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
        pnrCode: pnr,
        userId: userId || 'guest-user',
        slotId: slot.id,
        statusId: 2, // Confirmed
        statusName: 'Confirmed',
        totalAmount: bookingRequest.totalAmount,
        currencyCode: bookingRequest.currencyCode || 'USD',
        notes: bookingRequest.notes || '',
        attractionId: bookingRequest.attractionId,
        attractionName: bookingRequest.attractionName,
        productTitle: bookingRequest.productTitle,
        slotDate: slot.slotDate,
        slotStartTime: slot.startTime,
        createdAt: new Date().toISOString(),
        passengers: bookingRequest.passengers
      }

      this.bookings.unshift(newBooking)
      this.saveToStorage()
      return { success: true, booking: newBooking }
    },

    // Cancelar una reserva y liberar cupos
    cancelBooking(bookingId, cancelReason) {
      const booking = this.bookings.find(b => b.id === bookingId)
      if (!booking) return { success: false, message: 'Reserva no encontrada.' }

      if (booking.statusId === 4) return { success: false, message: 'La reserva ya está cancelada.' }
      
      booking.statusId = 4 // Cancelled
      booking.statusName = 'Cancelled'
      booking.cancelReason = cancelReason

      // Devolver los cupos al slot
      const slot = this.slots.find(s => s.id === booking.slotId)
      if (slot) {
        const totalRefund = booking.passengers.length
        slot.capacityAvailable = Math.min(slot.capacityTotal, slot.capacityAvailable + totalRefund)
      }

      this.saveToStorage()
      return { success: true, booking }
    },

    // --- PANEL ADMIN: GENERACIÓN MASIVA DE HORARIOS ---
    generateScheduleMassive(productId, { startDate, endDate, startTime, endTime, capacity, daysOfWeek }) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const slotsGenerated = []

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayNum = d.getDay() // 0 = Domingo, 1 = Lunes, etc.
        const mappedDayNum = dayNum === 0 ? 7 : dayNum // Mapear a 1=Lunes ... 7=Domingo si se requiere

        // Validar si el día de la semana está incluido
        if (daysOfWeek.includes(dayNum)) {
          const dateStr = formatDateString(d)
          
          // Evitar duplicados
          const exists = this.slots.some(
            s => s.productId === productId && s.slotDate === dateStr && s.startTime === startTime
          )

          if (!exists) {
            const newSlot = {
              id: `slot-${productId}-${dateStr}-${startTime.replace(':', '')}`,
              productId,
              slotDate: dateStr,
              startTime,
              endTime: endTime || '12:00',
              capacityTotal: parseInt(capacity),
              capacityAvailable: parseInt(capacity),
              isActive: true
            }
            this.slots.push(newSlot)
            slotsGenerated.push(newSlot)
          }
        }
      }

      this.saveToStorage()
      return slotsGenerated.length
    },

    // --- PANEL ADMIN: LIMPIEZA EN LOTE (BULK DELETE) ---
    bulkDeleteSlots(productId, startDate, endDate) {
      const initialCount = this.slots.length
      
      // Filtrar quedándonos con los que NO coincidan con el criterio a borrar
      this.slots = this.slots.filter(s => {
        const isMatch = s.productId === productId && s.slotDate >= startDate && s.slotDate <= endDate
        // Ojo, si tiene reservas realizadas en este slot, deberíamos evitar borrarlo o manejarlo
        // Aquí simplificamos borrando sólo si no tiene reservas (capacidad total == capacidad disponible)
        const hasBookings = s.capacityTotal !== s.capacityAvailable
        return !(isMatch && !hasBookings)
      })

      const deletedCount = initialCount - this.slots.length
      this.saveToStorage()
      return deletedCount
    },

    // Pronóstico de disponibilidad (Sugerir las próximas 5 fechas libres)
    getAvailabilityForecast(productId, count = 5) {
      const today = formatDateString(new Date())
      return this.slots
        .filter(s => s.productId === productId && s.slotDate >= today && s.capacityAvailable > 0 && s.isActive)
        .sort((a,b) => a.slotDate.localeCompare(b.slotDate) || a.startTime.localeCompare(b.startTime))
        .map(s => ({
          slotId: s.id,
          date: s.slotDate,
          time: s.startTime,
          available: s.capacityAvailable
        }))
        .slice(0, count)
    },

    // Registrar una reseña
    addReview(bookingId, rating, comment) {
      const newReview = {
        id: crypto.randomUUID(),
        bookingId,
        overallScore: rating,
        comment
      }
      this.reviews.push(newReview)
      localStorage.setItem('booking_reviews', JSON.stringify(this.reviews))
      return newReview;
    },

    saveToStorage() {
      localStorage.setItem('booking_slots', JSON.stringify(this.slots))
      localStorage.setItem('booking_bookings', JSON.stringify(this.bookings))
    }
  }
})
