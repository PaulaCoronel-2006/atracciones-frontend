<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalog'
import { useBookingStore } from '../stores/booking'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'
import LeafletMap from '../components/LeafletMap.vue'
import CalendarAvailability from '../components/CalendarAvailability.vue'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const bookingStore = useBookingStore()
const cartStore = useCartStore()
const authStore = useAuthStore()

const slug = route.params.slug
const attraction = computed(() => catalogStore.getAttractionBySlug(slug))

// Estados de la Galería
const activeImageUrl = ref('')
const currentMedia = computed(() => attraction.value?.media || [])

// Motor de Reservas: Estados
const selectedOptionId = ref('')
const selectedSlot = ref(null)
const passengerCount = ref(1)

// Inicializar y observar cambios en los datos de la atracción para evitar vistas vacías
watch(attraction, (newVal) => {
  if (newVal) {
    if (currentMedia.value.length > 0 && !activeImageUrl.value) {
      activeImageUrl.value = currentMedia.value.find(m => m.is_main)?.url || currentMedia.value[0].url
    }
    if (newVal.product_options?.length > 0 && !selectedOptionId.value) {
      selectedOptionId.value = newVal.product_options[0].id
    }
  }
}, { immediate: true })

// Obtener slots de disponibilidad reales del backend cuando cambia la opción seleccionada
watch(selectedOptionId, async (newVal) => {
  if (newVal) {
    await bookingStore.fetchSlots(newVal)
  }
}, { immediate: true })

onMounted(async () => {
  // Intentar obtener detalles del backend
  await catalogStore.fetchAttractionBySlug(slug)
  
  // Si no existe ni local ni en backend, redirigir al Home
  if (!attraction.value) {
    router.push('/')
  }
})

const selectedOption = computed(() => {
  return attraction.value?.product_options?.find(o => o.id === selectedOptionId.value)
})

// Cambiar de opción limpia la fecha elegida
const changeOption = (optionId) => {
  selectedOptionId.value = optionId
  selectedSlot.value = null
}

const handleSelectSlot = (slot) => {
  selectedSlot.value = slot
  // Bajar el contador de pasajeros si excede la disponibilidad del nuevo slot
  if (passengerCount.value > slot.capacityAvailable) {
    passengerCount.value = slot.capacityAvailable
  }
}

// Reservas: Cálculos
const pricePerPerson = computed(() => {
  if (!selectedOption.value) return 0
  return selectedOption.value.price_tiers[0]?.price || 0
})

const subtotal = computed(() => {
  return pricePerPerson.value * passengerCount.value
})

const tax = computed(() => {
  return subtotal.value * 0.15 // 15% IVA
})

const total = computed(() => {
  return subtotal.value + tax.value
})

const handleBooking = () => {
  if (!selectedSlot.value) {
    Swal.fire({
      title: 'Selecciona una Fecha',
      text: 'Por favor, elige un día disponible y un horario en el calendario.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  if (passengerCount.value <= 0 || passengerCount.value > selectedSlot.value.capacityAvailable) {
    Swal.fire({
      title: 'Cupos Inválidos',
      text: `Por favor, selecciona entre 1 y ${selectedSlot.value.capacityAvailable} pasajeros para esta sesión.`,
      icon: 'error',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#f43f5e'
    })
    return
  }

  // Cargar el carrito con la selección
  cartStore.setBookingSelection(
    attraction.value,
    selectedOption.value,
    selectedSlot.value,
    passengerCount.value
  )

  // Enrutar al Checkout
  router.push('/checkout')
}

// Reseñas del catálogo
const reviews = computed(() => {
  return bookingStore.getReviewsByAttraction(attraction.value?.id)
})
</script>

<template>
  <div v-if="attraction" class="flex flex-col gap-8 text-left">
    
    <!-- Encabezado y Breadcrumbs -->
    <div>
      <router-link to="/" class="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1 mb-2">
        ← Volver a Atracciones
      </router-link>
      <h1 class="text-2xl md:text-4xl font-extrabold text-white font-sans tracking-tight">
        {{ attraction.name }}
      </h1>
    </div>

    <!-- Layout Grid: Galería e Información (Izquierda) y Motor Reservas (Derecha) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- LADO IZQUIERDO: Información, Galería, Itinerario, Mapa y Reviews (2 columnas en LG) -->
      <div class="lg:col-span-2 flex flex-col gap-8">
        
        <!-- Galería Multimedia Premium -->
        <div class="flex flex-col gap-3">
          <!-- Imagen Grande Principal -->
          <div class="relative h-[300px] md:h-[420px] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <img :src="activeImageUrl" :alt="attraction.name" class="w-full h-full object-cover transition-opacity duration-300" />
            <div class="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent"></div>
          </div>
          
          <!-- Miniaturas -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <button 
              v-for="img in currentMedia" 
              :key="img.id"
              @click="activeImageUrl = img.url"
              class="relative w-20 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer"
              :class="activeImageUrl === img.url ? 'border-brand-cyan scale-102 shadow-lg shadow-brand-cyan/20' : 'border-white/10 opacity-70 hover:opacity-100'"
            >
              <img :src="img.url" :alt="attraction.name" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Pestañas / Información General -->
        <div class="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
          <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider">Descripción de la Experiencia</h2>
          <p class="text-gray-300 text-sm md:text-base leading-relaxed">
            {{ attraction.description }}
          </p>
        </div>

        <!-- Inclusiones y Exclusiones (Catálogo Global) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Incluye -->
          <div class="glass-card rounded-2xl p-5 border border-white/5">
            <h3 class="text-xs font-bold text-brand-emerald uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ✅ Servicios Incluidos
            </h3>
            <ul class="space-y-2.5 text-xs text-gray-300">
              <li 
                v-for="inc in attraction.inclusions.filter(i => i.type === 'included')" 
                :key="inc.inclusion_item_id"
                class="flex items-start gap-2"
              >
                <span class="text-brand-emerald">✔</span>
                <span>{{ catalogStore.getInclusionById(inc.inclusion_item_id)?.default_text }}</span>
              </li>
            </ul>
          </div>
          
          <!-- No Incluye -->
          <div class="glass-card rounded-2xl p-5 border border-white/5">
            <h3 class="text-xs font-bold text-brand-rose uppercase tracking-wider mb-3 flex items-center gap-1.5">
              ❌ Exclusiones / No Incluido
            </h3>
            <ul class="space-y-2.5 text-xs text-gray-300">
              <li 
                v-for="exc in attraction.inclusions.filter(i => i.type === 'excluded')" 
                :key="exc.inclusion_item_id"
                class="flex items-start gap-2"
              >
                <span class="text-brand-rose">✦</span>
                <span>{{ exc.custom_text || catalogStore.getInclusionById(exc.inclusion_item_id)?.default_text }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Itinerario Interactivo -->
        <div class="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-6">
          <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider">🗺️ Itinerario Detallado del Tour</h3>
          
          <!-- Timeline Vertical -->
          <div class="relative border-l border-white/10 pl-6 ml-3 space-y-8 text-left">
            <div 
              v-for="stop in attraction.itinerary" 
              :key="stop.stop_number"
              class="relative"
            >
              <!-- Punto Indicador en Timeline -->
              <span 
                class="absolute -left-[35px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border"
                :class="stop.is_included 
                  ? 'bg-brand-cyan border-brand-cyan text-dark-900 glow-cyan' 
                  : 'bg-dark-800 border-white/20 text-gray-400'"
              >
                {{ stop.stop_number }}
              </span>

              <!-- Contenido de la parada -->
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-extrabold text-sm text-white">{{ stop.name }}</h4>
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                    {{ stop.duration }}
                  </span>
                  <span 
                    class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                    :class="stop.is_included ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-rose/10 text-brand-rose'"
                  >
                    {{ stop.is_included ? 'Incluido' : 'Opcional' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mapa Leaflet para Punto de Encuentro Exacto -->
        <div class="flex flex-col gap-3">
          <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider">📍 Punto de Encuentro y Ubicación</h3>
          <p class="text-xs text-gray-400 leading-relaxed mb-1">
            Reúnete con tu guía certificado en el punto indicado a continuación. Te sugerimos llegar con 15 minutos de anticipación.
          </p>
          <LeafletMap 
            :lat="attraction.location_coords.lat" 
            :lng="attraction.location_coords.lng" 
            :placeName="attraction.location_coords.placeName"
          />
        </div>

        <!-- Reseñas y Comentarios de Clientes -->
        <div class="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-5">
          <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
            <span>⭐ Reseñas de Clientes</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-normal">
              {{ reviews.length }} opiniones
            </span>
          </h3>

          <div v-if="reviews.length === 0" class="text-center py-6 text-gray-500 text-xs">
            Aún no hay calificaciones para esta atracción. ¡Sé el primero en reservar!
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="rev in reviews" 
              :key="rev.id"
              class="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-brand-cyan">Cliente Autenticado</span>
                <!-- Estrellas -->
                <div class="text-xs text-yellow-500 flex gap-0.5">
                  <span v-for="star in Math.floor(rev.overallScore)" :key="star">★</span>
                </div>
              </div>
              <p class="text-xs text-gray-300 leading-relaxed italic">
                "{{ rev.comment }}"
              </p>
            </div>
          </div>
        </div>

      </div>

      <!-- LADO DERECHO: Motor de Reservas y Disponibilidad (1 columna en LG) -->
      <div class="flex flex-col gap-6">
        
        <!-- Tarjeta de Control del Checkout / Selección -->
        <div class="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col gap-5 sticky top-24 shadow-2xl">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Reserva en Línea</span>
            <h3 class="text-lg font-black text-white">Motor de Disponibilidad</h3>
          </div>

          <!-- Selección de Modalidad -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Modalidad del Tour</label>
            <div class="grid grid-cols-1 gap-2">
              <button 
                v-for="opt in attraction.product_options" 
                :key="opt.id"
                @click="changeOption(opt.id)"
                class="w-full text-left p-3 rounded-xl border transition-all cursor-pointer"
                :class="selectedOptionId === opt.id 
                  ? 'bg-brand-cyan/20 border-brand-cyan ring-1 ring-brand-cyan/50 text-white' 
                  : 'glass-card border-white/5 hover:border-white/10 text-gray-300'"
              >
                <div class="text-xs font-bold">{{ opt.title }}</div>
                <div class="text-[10px] text-gray-400 mt-0.5">
                  Desde ${{ opt.price_tiers[0]?.price.toFixed(2) }} por pasajero
                </div>
              </button>
            </div>
          </div>

          <!-- Calendario de Disponibilidad -->
          <div v-if="selectedOptionId" class="flex flex-col gap-2">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Fecha y Horario</label>
            <CalendarAvailability 
              :optionId="selectedOptionId" 
              @select-slot="handleSelectSlot"
            />
          </div>

          <!-- Pasajeros e Inputs -->
          <div v-if="selectedSlot" class="flex flex-col gap-2.5 animate-fade-in text-left">
            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Cantidad de Pasajeros</span>
              <span class="text-[10px] text-brand-cyan font-mono">Disponibles: {{ selectedSlot.capacityAvailable }}</span>
            </label>
            
            <div class="flex items-center gap-3">
              <button 
                @click="passengerCount > 1 ? passengerCount-- : null"
                class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                -
              </button>
              
              <input 
                v-model.number="passengerCount"
                type="number" 
                min="1" 
                :max="selectedSlot.capacityAvailable"
                readonly
                class="w-full h-10 text-center rounded-xl bg-dark-900 border border-white/10 font-bold text-sm"
              />
              
              <button 
                @click="passengerCount < selectedSlot.capacityAvailable ? passengerCount++ : null"
                class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 flex items-center justify-center font-bold transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <!-- Invoice Previo -->
          <div v-if="selectedSlot" class="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2 text-xs text-gray-300 animate-fade-in">
            <div class="flex justify-between">
              <span>{{ passengerCount }} Pasajeros x ${{ pricePerPerson.toFixed(2) }}</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>IVA (15%)</span>
              <span>${{ tax.toFixed(2) }}</span>
            </div>
            <div class="h-px bg-white/5 my-1"></div>
            <div class="flex justify-between font-black text-sm text-brand-emerald">
              <span>Gran Total</span>
              <span>${{ total.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Botón de Compra -->
          <button 
            @click="handleBooking"
            class="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-brand-cyan to-brand-violet text-dark-900 hover:opacity-90 hover:scale-[1.01] active:scale-100 transition-all cursor-pointer flex items-center justify-center gap-2 glow-cyan"
          >
            <span>Reservar Ahora</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>

        </div>

      </div>

    </div>

  </div>
</template>
