<script setup>
import { ref, computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { useBookingStore } from '../stores/booking'
import Swal from 'sweetalert2'

const catalogStore = useCatalogStore()
const bookingStore = useBookingStore()

const selectedAttractionId = ref('')
const selectedOptionId = ref('')
const selectedSlot = ref(null)
const passengerCount = ref(1)

const passengersList = ref([
  { firstName: '', lastName: '', documentType: 'Cédula', documentNumber: '', priceTierLabel: 'Adulto', unitPrice: 40.00 }
])

const handleAttractionChange = () => {
  selectedOptionId.value = ''
  selectedSlot.value = null
  const attr = catalogStore.getAttractionById(selectedAttractionId.value)
  if (attr && attr.product_options.length > 0) {
    selectedOptionId.value = attr.product_options[0].id
  }
}

const activeAttraction = computed(() => {
  return catalogStore.getAttractionById(selectedAttractionId.value)
})

const activeOption = computed(() => {
  return activeAttraction.value?.product_options?.find(o => o.id === selectedOptionId.value)
})

// --- PRONÓSTICO DE DISPONIBILIDAD (Últimas 5 fechas libres sugeridas) ---
const forecastSuggestions = computed(() => {
  if (!selectedOptionId.value) return []
  return bookingStore.getAvailabilityForecast(selectedOptionId.value, 5)
})

const selectForecastSlot = (slotForecast) => {
  const fullSlot = bookingStore.getSlotById(slotForecast.slotId)
  if (fullSlot) {
    selectedSlot.value = fullSlot
    updatePassengerCounterLimit()
  }
}

// Ajustar lista de pasajeros dinámicamente al cambiar el contador
const handlePassengerCountChange = () => {
  const currentCount = passengersList.value.length
  const defaultPrice = activeOption.value?.price_tiers[0]?.price || 40.00
  const defaultTierLabel = activeOption.value?.price_tiers[0]?.label || 'Adulto'

  if (passengerCount.value > currentCount) {
    // Añadir pasajeros vacíos
    for (let i = currentCount; i < passengerCount.value; i++) {
      passengersList.value.push({
        firstName: '',
        lastName: '',
        documentType: 'Cédula',
        documentNumber: '',
        priceTierLabel: defaultTierLabel,
        unitPrice: defaultPrice
      })
    }
  } else if (passengerCount.value < currentCount) {
    // Remover
    passengersList.value.splice(passengerCount.value)
  }
}

const updatePassengerCounterLimit = () => {
  if (selectedSlot.value && passengerCount.value > selectedSlot.value.capacityAvailable) {
    passengerCount.value = selectedSlot.value.capacityAvailable
    handlePassengerCountChange()
  }
}

const setPassengerTier = (pIdx, tierLabel) => {
  const p = passengersList.value[pIdx]
  const tier = activeOption.value?.price_tiers?.find(t => t.label === tierLabel)
  if (p && tier) {
    p.priceTierLabel = tier.label
    p.unitPrice = tier.price
  }
}

// --- TOTALES FACTURADOS ---
const subtotal = computed(() => {
  return passengersList.value.reduce((sum, p) => sum + p.unitPrice, 0)
})
const tax = computed(() => subtotal.value * 0.15)
const grandTotal = computed(() => subtotal.value + tax.value)

// --- EMITIR FACTURACIÓN POS RÁPIDA ---
const executePosSale = () => {
  if (!selectedSlot.value) {
    Swal.fire({
      title: 'Selecciona Horario',
      text: 'Debes marcar un slot horario o elegir uno sugerido en el pronóstico.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  // Validaciones
  for (let i = 0; i < passengersList.value.length; i++) {
    const p = passengersList.value[i]
    if (!p.firstName.trim() || !p.lastName.trim() || !p.documentNumber.trim()) {
      Swal.fire({
        title: `Pasajero #${i+1} Incompleto`,
        text: 'Todos los datos de taquilla del pasajero deben ser completados.',
        icon: 'warning',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#06b6d4'
      })
      return
    }
  }

  const bookingRequest = {
    slotId: selectedSlot.value.id,
    attractionId: activeAttraction.value.id,
    attractionName: activeAttraction.value.name,
    productTitle: activeOption.value.title,
    totalAmount: grandTotal.value,
    currencyCode: 'USD',
    notes: 'Venta rápida emitida por operador en Taquilla POS.',
    passengers: passengersList.value.map(p => ({
      firstName: p.firstName,
      lastName: p.lastName,
      documentType: p.documentType,
      documentNumber: p.documentNumber,
      priceTierLabel: p.priceTierLabel,
      unitPrice: p.unitPrice,
      quantity: 1
    }))
  }

  // Ejecutar venta directa en base de datos
  const result = bookingStore.createBooking('taquilla-operator-id', bookingRequest)

  if (result.success) {
    Swal.fire({
      title: '¡Venta POS Emitida!',
      html: `
        <div class="text-left text-xs text-gray-300 flex flex-col gap-2 mt-2 font-sans border border-white/5 p-4 rounded-xl bg-white/5">
          <div class="text-center font-bold text-sm text-brand-cyan mb-2">★★★ COMPROBANTE DE TAQUILLA ★★★</div>
          <p><strong>Operación:</strong> VENTA RÁPIDA POS</p>
          <p><strong>PNR Boleto:</strong> <span class="text-brand-cyan font-black text-sm">${result.booking.pnrCode}</span></p>
          <p><strong>Atracción:</strong> ${activeAttraction.value.name}</p>
          <p><strong>Actividad:</strong> ${result.booking.slotDate} | ${result.booking.slotStartTime} hs</p>
          <p><strong>Pasajeros:</strong> ${passengerCount.value}</p>
          <p class="border-t border-white/10 pt-2 font-bold text-brand-emerald">Total Cobrado: $${grandTotal.value.toFixed(2)} (Efectivo/POS)</p>
          <div class="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-wider">¡Impresión Automática Lista!</div>
        </div>
      `,
      icon: 'success',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Nueva Venta POS'
    }).then(() => {
      // Limpiar formulario para la siguiente venta
      selectedSlot.value = null
      passengerCount.value = 1
      passengersList.value = [
        { firstName: '', lastName: '', documentType: 'Cédula', documentNumber: '', priceTierLabel: 'Adulto', unitPrice: activeOption.value.price_tiers[0]?.price || 40.00 }
      ]
    })
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 text-left">
    
    <!-- Encabezado -->
    <div class="flex flex-col gap-1 border-b border-white/5 pb-4">
      <router-link to="/admin" class="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1">
        ← Volver al Dashboard
      </router-link>
      <h1 class="text-2xl md:text-3xl font-extrabold text-white">Taquilla Digital (POS Terminal)</h1>
    </div>

    <!-- Layout POS de 2 Columnas -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- COLUMNA IZQUIERDA: Configuración de Producto, Pronóstico e Info de Venta (2 columnas en LG) -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        
        <!-- Configuración de Venta Básica -->
        <div class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
          <h3 class="text-xs font-bold text-gray-200 uppercase tracking-wider">Configurar Producto</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Selección de Atracción -->
            <div class="flex flex-col gap-1.5 text-left">
              <label class="text-xs text-gray-400">Seleccionar Atracción</label>
              <select 
                v-model="selectedAttractionId"
                @change="handleAttractionChange"
                class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm"
              >
                <option value="">Buscar Atracción...</option>
                <option v-for="a in catalogStore.attractions" :key="a.id" :value="a.id">{{ a.name }}</option>
              </select>
            </div>

            <!-- Modalidad -->
            <div class="flex flex-col gap-1.5 text-left" v-if="selectedAttractionId">
              <label class="text-xs text-gray-400">Modalidad</label>
              <select 
                v-model="selectedOptionId"
                @change="selectedSlot = null"
                class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm"
              >
                <option value="">Selecciona Modalidad...</option>
                <option v-for="o in activeAttraction?.product_options" :key="o.id" :value="o.id">{{ o.title }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- PRONÓSTICO DE DISPONIBILIDAD (Exclusivo Técnico POS) -->
        <div v-if="selectedOptionId" class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4 animate-fade-in">
          <div class="flex flex-col gap-0.5">
            <h3 class="text-xs font-bold text-brand-cyan uppercase tracking-wider">
              🔮 Pronóstico de Disponibilidad Inteligente
            </h3>
            <p class="text-[10px] text-gray-500">
              Sugerencia automática de las **próximas 5 fechas con cupos libres** para venta inmediata sin búsquedas a ciegas.
            </p>
          </div>

          <!-- Grilla de Pronósticos Clickables -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button 
              v-for="sug in forecastSuggestions" 
              :key="sug.slotId"
              @click="selectForecastSlot(sug)"
              class="p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col gap-1"
              :class="selectedSlot?.id === sug.slotId
                ? 'bg-brand-cyan/20 border-brand-cyan text-white'
                : 'glass-card border-white/5 hover:border-white/10 text-gray-300'"
            >
              <span class="text-[10px] text-gray-400 font-bold font-mono">{{ sug.date.split('-').slice(1).reverse().join('/') }}</span>
              <span class="text-xs font-black">{{ sug.time }} hs</span>
              <span class="text-[9px] font-bold text-brand-emerald bg-brand-emerald/10 px-1 py-0.5 rounded-full mt-1">
                {{ sug.available }} libres
              </span>
            </button>
            
            <div v-if="forecastSuggestions.length === 0" class="col-span-full py-4 text-center text-gray-500 text-xs">
              No hay horarios futuros con cupos disponibles para esta modalidad en la base de datos.
            </div>
          </div>
        </div>

        <!-- DATOS DE PASAJEROS RAPIDOS (Solo si hay slot activo) -->
        <div v-if="selectedSlot" class="flex flex-col gap-4 animate-fade-in text-left">
          <h3 class="text-sm font-bold text-gray-200 uppercase tracking-wider">Detalles de Pasajeros de Taquilla</h3>

          <div 
            v-for="(passenger, pIdx) in passengersList" 
            :key="pIdx"
            class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4"
          >
            <div class="flex items-center justify-between border-b border-white/5 pb-2">
              <span class="text-xs font-bold text-brand-cyan">Pasajero #{{ pIdx + 1 }}</span>
              <!-- Rápido Selector de Categoría y Precio -->
              <div class="flex gap-2">
                <button 
                  v-for="tier in activeOption?.price_tiers" 
                  :key="tier.label"
                  @click="setPassengerTier(pIdx, tier.label)"
                  class="px-2.5 py-1 rounded text-[10px] font-semibold border transition-all cursor-pointer"
                  :class="passenger.priceTierLabel === tier.label
                    ? 'bg-brand-cyan/25 border-brand-cyan text-brand-cyan font-bold'
                    : 'glass-card border-white/5 text-gray-500'"
                >
                  {{ tier.label }} (${{ tier.price }})
                </button>
              </div>
            </div>

            <!-- Campos Básicos Rápidos -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-[10px] text-gray-400">Nombres</label>
                <input v-model="passenger.firstName" type="text" placeholder="Ej: Sofía" class="px-3 py-2 rounded-xl glass-input text-xs" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[10px] text-gray-400">Apellidos</label>
                <input v-model="passenger.lastName" type="text" placeholder="Ej: Castillo" class="px-3 py-2 rounded-xl glass-input text-xs" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[10px] text-gray-400">Identificación</label>
                <input v-model="passenger.documentNumber" type="text" placeholder="Ej: 1723456789" class="px-3 py-2 rounded-xl glass-input text-xs font-mono" />
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- COLUMNA DERECHA: Resumen de Transacción y Facturación POS (1 columna en LG) -->
      <div>
        <div class="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col gap-4 shadow-2xl sticky top-24">
          <h3 class="text-sm font-bold text-gray-200 uppercase tracking-wider border-b border-white/5 pb-2">
            Detalle de Venta
          </h3>

          <div v-if="!selectedSlot" class="text-center py-12 text-gray-500 text-xs">
            Selecciona una atracción, modalidad y fecha en el panel izquierdo para calcular la facturación de taquilla.
          </div>

          <div v-else class="flex flex-col gap-4 animate-fade-in text-xs text-gray-300">
            
            <!-- Contador rápido de tickets -->
            <div class="flex flex-col gap-2">
              <label class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Número de Tickets</label>
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-gray-200">Volumen</span>
                <div class="flex items-center gap-2">
                  <button 
                    @click="passengerCount > 1 ? (passengerCount--, handlePassengerCountChange()) : null"
                    class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span class="w-8 text-center font-bold text-sm">{{ passengerCount }}</span>
                  <button 
                    @click="passengerCount < selectedSlot.capacityAvailable ? (passengerCount++, handlePassengerCountChange()) : null"
                    class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div class="h-px bg-white/5 my-1"></div>

            <!-- Ficha horaria -->
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between">
                <span class="text-gray-500">Fecha:</span>
                <span class="font-bold text-gray-200">{{ selectedSlot.slotDate }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Horario:</span>
                <span class="font-bold text-gray-200 font-mono">{{ selectedSlot.startTime }} hs</span>
              </div>
            </div>

            <div class="h-px bg-white/5 my-1"></div>

            <!-- Totales -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span>${{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Impuestos (15% IVA)</span>
                <span>${{ tax.toFixed(2) }}</span>
              </div>
              <div class="h-px bg-white/5 my-1"></div>
              <div class="flex justify-between font-black text-sm text-brand-emerald">
                <span>Total a Cobrar</span>
                <span>${{ grandTotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Acción de Cobro POS -->
            <button 
              @click="executePosSale"
              class="w-full py-3 rounded-xl font-bold bg-brand-emerald text-dark-900 hover:bg-brand-emerald/90 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-brand-emerald/15 mt-2"
            >
              💵 Emitir Boleto POS
            </button>

          </div>
        </div>
      </div>

    </div>

  </div>
</template>
