<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useBookingStore } from '../stores/booking'
import Swal from 'sweetalert2'

const authStore = useAuthStore()
const bookingStore = useBookingStore()

const myBookings = computed(() => {
  if (!authStore.isAuthenticated) return []
  return bookingStore.getBookingsByUser(authStore.user.id)
})

// Controladores de Detalles
const expandedBookingId = ref('')

const toggleExpand = (id) => {
  if (expandedBookingId.value === id) {
    expandedBookingId.value = ''
  } else {
    expandedBookingId.value = id
  }
}

// Cancelar Reserva en Tiempo Real
const handleCancel = (booking) => {
  Swal.fire({
    title: '¿Cancelar esta Reserva?',
    text: `Se liberarán los ${booking.passengers.length} cupos de vuelta al inventario. Escribe el motivo de la cancelación:`,
    input: 'text',
    inputPlaceholder: 'Ej: Cambio de planes de vuelo...',
    icon: 'warning',
    showCancelButton: true,
    background: '#111827',
    color: '#f3f4f6',
    confirmButtonColor: '#f43f5e',
    cancelButtonColor: '#374151',
    confirmButtonText: 'Sí, cancelar reserva',
    cancelButtonText: 'Volver',
    inputValidator: (value) => {
      if (!value) {
        return '¡Es obligatorio escribir un motivo para cancelar!'
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

// Dejar Reseña / Calificar Atracción
const handleReview = (booking) => {
  Swal.fire({
    title: 'Calificar Experiencia',
    text: `¿Cómo calificarías tu tour en "${booking.attractionName}"?`,
    html: `
      <div class="flex flex-col gap-3 text-left">
        <label class="text-xs text-gray-400">Puntuación (1 a 5 estrellas):</label>
        <select id="swal-rating" class="w-full px-3 py-2 bg-dark-900 border border-white/10 rounded-xl text-white text-xs">
          <option value="5">★★★★★ Excelente (5/5)</option>
          <option value="4">★★★★ Muy Bueno (4/5)</option>
          <option value="3">★★★ Regular (3/5)</option>
          <option value="2">★★ Malo (2/5)</option>
          <option value="1">★ Pésimo (1/5)</option>
        </select>
        
        <label class="text-xs text-gray-400 mt-2">Comentario o Reseña:</label>
        <textarea id="swal-comment" placeholder="Cuéntanos los detalles de tu experiencia..." class="w-full h-20 px-3 py-2 bg-dark-900 border border-white/10 rounded-xl text-white text-xs"></textarea>
      </div>
    `,
    icon: 'star',
    showCancelButton: true,
    background: '#111827',
    color: '#f3f4f6',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#374151',
    confirmButtonText: 'Guardar Reseña',
    preConfirm: () => {
      return {
        rating: parseFloat(document.getElementById('swal-rating').value),
        comment: document.getElementById('swal-comment').value
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const { rating, comment } = result.value
      bookingStore.addReview(booking.id, rating, comment)
      
      Swal.fire({
        title: '¡Muchas Gracias!',
        text: 'Tu opinión nos ayuda a mantener nuestro catálogo con calidad premium.',
        icon: 'success',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#10b981'
      })
    }
  })
}
</script>

<template>
  <div class="flex flex-col gap-6 text-left">
    
    <!-- Encabezado de Portal -->
    <div class="flex flex-col gap-1 border-b border-white/5 pb-4">
      <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Portal de Autogestión</span>
      <h1 class="text-2xl md:text-3xl font-extrabold text-white">Historial de Reservas</h1>
    </div>

    <!-- Validar Estado de Login -->
    <div v-if="!authStore.isAuthenticated" class="glass-card rounded-2xl p-12 text-center border border-white/5">
      <span class="text-4xl">🔐</span>
      <h3 class="text-gray-300 font-bold text-lg mt-3">Portal del Cliente Protegido</h3>
      <p class="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
        Por favor, inicia sesión con un rol de Cliente en el menú superior para ver tu historial de compras y realizar cancelaciones.
      </p>
    </div>

    <!-- Si está logueado pero no tiene reservas -->
    <div v-else-if="myBookings.length === 0" class="glass-card rounded-2xl p-12 text-center border border-white/5">
      <span class="text-4xl">🎟️</span>
      <h3 class="text-gray-300 font-bold text-lg mt-3">Aún no tienes reservas</h3>
      <p class="text-gray-500 text-sm mt-1 mb-4">Explora nuestro catálogo para reservar tu primera experiencia premium.</p>
      <router-link to="/" class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 transition-all cursor-pointer">
        Buscar Atracciones
      </router-link>
    </div>

    <!-- Listado de Reservas del Cliente -->
    <div v-else class="flex flex-col gap-4">
      <div 
        v-for="booking in myBookings" 
        :key="booking.id"
        class="glass-panel rounded-2xl border transition-all"
        :class="expandedBookingId === booking.id ? 'border-brand-cyan/30 shadow-lg' : 'border-white/5 hover:border-white/10'"
      >
        <!-- Ficha de Encabezado Principal -->
        <div class="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer" @click="toggleExpand(booking.id)">
          <!-- Info de Atracción y Código -->
          <div class="flex items-start gap-3">
            <span class="text-2xl mt-1">🎫</span>
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-extrabold text-sm md:text-base text-white">{{ booking.attractionName }}</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 font-bold">
                  Código: {{ booking.pnrCode }}
                </span>
              </div>
              <span class="text-[11px] text-gray-400 font-semibold">{{ booking.productTitle }}</span>
            </div>
          </div>

          <!-- Detalles Rápidos e Indicador de Estado -->
          <div class="flex items-center gap-4 justify-between md:justify-end border-t border-white/5 md:border-none pt-3 md:pt-0">
            <div class="flex flex-col text-right pr-4 border-r border-white/10">
              <span class="text-[9px] text-gray-500 uppercase">Actividad</span>
              <span class="text-xs font-bold text-gray-200">{{ booking.slotDate }} a las {{ booking.slotStartTime }}</span>
            </div>

            <div class="flex items-center gap-3">
              <!-- Badge de Estado -->
              <span 
                class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                :class="[
                  booking.statusId === 2 ? 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20' : '', // Confirmed
                  booking.statusId === 3 ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' : '', // Completed
                  booking.statusId === 4 ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20' : '', // Cancelled
                ]"
              >
                {{ booking.statusName }}
              </span>

              <!-- Indicador Expandir -->
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-gray-500 transition-transform duration-200" :class="{ 'rotate-180': expandedBookingId === booking.id }">
                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Seccion Expandible de Detalles -->
        <div v-if="expandedBookingId === booking.id" class="px-5 pb-5 border-t border-white/5 pt-4 flex flex-col gap-4 animate-fade-in">
          
          <!-- Lista de Pasajeros -->
          <div>
            <h4 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pasajeros Vinculados</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div 
                v-for="(p, pIdx) in booking.passengers" 
                :key="pIdx"
                class="p-3 rounded-xl bg-white/5 border border-white/5 text-xs flex flex-col gap-1 text-left"
              >
                <div class="font-bold text-gray-200">{{ p.fullName }}</div>
                <div class="flex justify-between text-gray-400 text-[10px]">
                  <span>Documento: {{ p.documentNumber }}</span>
                  <span class="font-bold text-brand-cyan">{{ p.priceTierLabel }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Detalles del Pago -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
            <div class="flex flex-col gap-1 text-left">
              <span class="text-[10px] text-gray-500">MÉTODO DE RESERVA</span>
              <span class="text-gray-300 font-semibold">Web Checkout Simulador Seguro</span>
            </div>
            
            <div class="flex items-center gap-6">
              <div class="flex flex-col text-right">
                <span class="text-[9px] text-gray-500">TOTAL FACTURADO</span>
                <span class="font-black text-sm text-brand-emerald">${{ booking.totalAmount.toFixed(2) }} {{ booking.currencyCode }}</span>
              </div>
            </div>
          </div>

          <!-- Si está cancelado, mostrar motivo -->
          <div v-if="booking.statusId === 4 && booking.cancelReason" class="p-3 rounded-xl bg-brand-rose/5 border border-brand-rose/25 text-xs text-brand-rose text-left">
            <strong>Motivo de Cancelación:</strong> "{{ booking.cancelReason }}"
          </div>

          <!-- Acciones en Tiempo Real -->
          <div class="flex justify-end gap-3 border-t border-white/5 pt-4 mt-2">
            <!-- Cancelar (Sólo Confirmed) -->
            <button 
              v-if="booking.statusId === 2"
              @click="handleCancel(booking)"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-rose/10 hover:bg-brand-rose/20 text-brand-rose border border-brand-rose/20 hover:border-brand-rose/40 transition-all cursor-pointer"
            >
              Cancelar Reserva
            </button>
            
            <!-- Dejar Reseña (Sólo Completed) -->
            <button 
              v-if="booking.statusId === 3"
              @click="handleReview(booking)"
              class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/20 hover:border-brand-cyan/40 transition-all cursor-pointer"
            >
              Calificar Atracción
            </button>
          </div>

        </div>

      </div>
    </div>

  </div>
</template>
