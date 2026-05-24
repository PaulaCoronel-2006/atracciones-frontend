<script setup>
import { ref, computed } from 'vue'
import { useBookingStore } from '../stores/booking'
import Swal from 'sweetalert2'

const bookingStore = useBookingStore()

const searchQuery = ref('')
const selectedStatusFilter = ref('all') // all, confirmed, completed, cancelled
const expandedBookingId = ref('')

const toggleExpand = (id) => {
  if (expandedBookingId.value === id) {
    expandedBookingId.value = ''
  } else {
    expandedBookingId.value = id
  }
}

// Mapear statusIds
const getStatusName = (statusId) => {
  switch (statusId) {
    case 1: return 'Pending'
    case 2: return 'Confirmed'
    case 3: return 'Completed'
    case 4: return 'Cancelled'
    default: return 'Unknown'
  }
}

const getStatusClass = (statusId) => {
  switch (statusId) {
    case 1: return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
    case 2: return 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
    case 3: return 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
    case 4: return 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20'
    default: return 'bg-gray-800 text-gray-400'
  }
}

// Reservas filtradas por búsqueda y estado
const filteredBookings = computed(() => {
  return bookingStore.bookings.filter(b => {
    // Filtro por Estado
    if (selectedStatusFilter.value !== 'all') {
      const mapped = getStatusName(b.statusId).toLowerCase()
      if (mapped !== selectedStatusFilter.value) return false
    }

    // Filtro por Buscador (PNR, Nombre Pasajero, Atracción)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const matchPnr = b.pnrCode.toLowerCase().includes(q)
      const matchAttr = b.attractionName.toLowerCase().includes(q)
      const matchPassenger = b.passengers.some(
        p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
      )

      return matchPnr || matchAttr || matchPassenger
    }

    return true
  })
})

const handleCancel = (booking) => {
  Swal.fire({
    title: '¿Cancelar esta Reserva?',
    text: `Se liberarán los ${booking.passengers.length} cupos de vuelta al inventario. Escribe el motivo de la cancelación:`,
    input: 'text',
    inputPlaceholder: 'Ej: Taquilla cancela por fuerza mayor...',
    icon: 'warning',
    showCancelButton: true,
    background: '#111827',
    color: '#f3f4f6',
    confirmButtonColor: '#f43f5e',
    cancelButtonColor: '#374151',
    confirmButtonText: 'Sí, cancelar reserva',
    cancelButtonText: 'Cerrar',
    inputValidator: (value) => {
      if (!value) {
        return '¡Es obligatorio escribir un motivo!'
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const reason = result.value
      const success = bookingStore.cancelBooking(booking.id, reason)
      
      if (success.success) {
        Swal.fire({
          title: 'Reserva Cancelada',
          text: 'Los cupos se han liberado y el estado se actualizó a Cancelado.',
          icon: 'success',
          background: '#111827',
          color: '#f3f4f6',
          confirmButtonColor: '#10b981'
        })
      }
    }
  })
}
</script>

<template>
  <div class="flex flex-col gap-6 text-left">
    
    <!-- Encabezado -->
    <div class="flex flex-col gap-1 border-b border-white/5 pb-4">
      <router-link to="/admin" class="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1">
        ← Volver al Dashboard
      </router-link>
      <h1 class="text-2xl md:text-3xl font-extrabold text-white">Administrador de Reservas (PNR)</h1>
    </div>

    <!-- Buscador y Filtros Rápidos -->
    <div class="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
      <!-- Buscador -->
      <div class="flex items-center rounded-xl bg-dark-900 border border-white/10 px-3 py-1.5 w-full md:max-w-sm">
        <span>🔍</span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Buscar por PNR, pasajero o atracción..." 
          class="w-full bg-transparent border-none text-white text-xs pl-2 py-1 placeholder-gray-500 focus:outline-none"
        />
      </div>

      <!-- Filtro de Estados en Chips -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button 
          v-for="f in [
            { id: 'all', label: 'Todos' },
            { id: 'confirmed', label: 'Confirmadas' },
            { id: 'completed', label: 'Completadas' },
            { id: 'cancelled', label: 'Canceladas' }
          ]"
          :key="f.id"
          @click="selectedStatusFilter = f.id"
          class="px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border"
          :class="selectedStatusFilter === f.id
            ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan'
            : 'glass-card border-white/5 text-gray-400 hover:text-white'"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Listado General de Reservas -->
    <div class="flex flex-col gap-4">
      
      <!-- Estado vacío -->
      <div v-if="filteredBookings.length === 0" class="glass-card rounded-2xl p-16 text-center border border-white/5 text-gray-500 text-xs">
        No se encontraron registros de reservas con el filtro de búsqueda seleccionado.
      </div>

      <div 
        v-else
        v-for="booking in filteredBookings" 
        :key="booking.id"
        class="glass-panel rounded-2xl border transition-all"
        :class="expandedBookingId === booking.id ? 'border-brand-cyan/30 shadow-lg shadow-brand-cyan/5' : 'border-white/5 hover:border-white/10'"
      >
        <!-- Tarjeta Contraída -->
        <div 
          @click="toggleExpand(booking.id)"
          class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer text-xs"
        >
          <!-- Info PNR y Atracción -->
          <div class="flex items-start gap-3">
            <span class="text-xl mt-0.5">🎫</span>
            <div class="flex flex-col text-left gap-0.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-extrabold text-sm text-white font-mono uppercase tracking-wider text-brand-cyan">
                  {{ booking.pnrCode }}
                </span>
                <span class="font-bold text-gray-200 truncate w-40 md:w-56">{{ booking.attractionName }}</span>
              </div>
              <span class="text-[10px] text-gray-500 font-semibold">{{ booking.productTitle }}</span>
            </div>
          </div>

          <!-- Info Slot y Estado -->
          <div class="flex items-center justify-between md:justify-end gap-5 border-t border-white/5 md:border-none pt-3 md:pt-0">
            <div class="flex flex-col text-right pr-4 border-r border-white/10">
              <span class="text-[8px] text-gray-500 uppercase">Actividad programada</span>
              <span class="font-bold text-gray-200">{{ booking.slotDate }} | {{ booking.slotStartTime }} hs</span>
            </div>

            <div class="flex items-center gap-3">
              <span class="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider" :class="getStatusClass(booking.statusId)">
                {{ booking.statusName }}
              </span>

              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5 text-gray-500 transition-transform duration-200" :class="{ 'rotate-180': expandedBookingId === booking.id }">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Seccion Detallada Desplegable -->
        <div v-if="expandedBookingId === booking.id" class="px-5 pb-5 border-t border-white/5 pt-4 flex flex-col gap-4 animate-fade-in text-xs">
          
          <!-- Roster de Pasajeros -->
          <div>
            <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Detalle de Pasajeros Facturados</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div 
                v-for="(p, pIdx) in booking.passengers" 
                :key="pIdx"
                class="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1 text-left"
              >
                <div class="font-bold text-gray-200">{{ p.fullName || `${p.firstName} ${p.lastName}` }}</div>
                <div class="flex justify-between text-[10px] text-gray-400 font-semibold">
                  <span>{{ p.documentType }}: {{ p.documentNumber }}</span>
                  <span class="text-brand-cyan">{{ p.priceTierLabel }} (${{ p.unitPrice.toFixed(2) }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bitácora y Detalles del Cobro -->
          <div class="p-3.5 rounded-xl bg-white/5 border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <!-- Notas/Origen -->
            <div class="flex flex-col text-left gap-0.5">
              <span class="text-[9px] text-gray-500 uppercase">Bitácora / Notas de la Reserva</span>
              <p class="text-gray-300 italic">"{{ booking.notes }}"</p>
            </div>

            <!-- Registro temporal -->
            <div class="flex flex-col text-left gap-0.5 border-l border-white/5 pl-4">
              <span class="text-[9px] text-gray-500 uppercase">Registrada en Sistema</span>
              <span class="text-gray-300 font-semibold">{{ new Date(booking.createdAt).toLocaleString('es-EC') }}</span>
            </div>

            <!-- Importe Total -->
            <div class="flex flex-col text-right border-l border-white/5 pl-4">
              <span class="text-[9px] text-gray-500 uppercase">Importe Total Recibido</span>
              <span class="font-black text-sm text-brand-emerald">${{ booking.totalAmount.toFixed(2) }} {{ booking.currencyCode }}</span>
            </div>
          </div>

          <!-- Si está cancelado, mostrar motivo -->
          <div v-if="booking.statusId === 4 && booking.cancelReason" class="p-3 rounded-xl bg-brand-rose/5 border border-brand-rose/25 text-left text-brand-rose">
            <strong>Motivo del Cierre:</strong> "{{ booking.cancelReason }}"
          </div>

          <!-- Acción Administrativa de Cierre/Cancelación -->
          <div class="flex justify-end border-t border-white/5 pt-4 mt-2" v-if="booking.statusId === 2">
            <button 
              @click="handleCancel(booking)"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-rose/10 hover:bg-brand-rose/20 text-brand-rose border border-brand-rose/20 hover:border-brand-rose/40 transition-all cursor-pointer"
            >
              Cancelar y Liberar Cupos
            </button>
          </div>

        </div>

      </div>
    </div>

  </div>
</template>
