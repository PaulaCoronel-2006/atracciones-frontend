<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useBookingStore } from '../stores/booking'
import { useAuthStore } from '../stores/auth'
import Swal from 'sweetalert2'

const router = useRouter()
const cartStore = useCartStore()
const bookingStore = useBookingStore()
const authStore = useAuthStore()

// Si no hay selección, redirigir al Home
onMounted(() => {
  if (!cartStore.hasSelection) {
    router.push('/')
  }
  // Asegurar que haya un usuario cliente por defecto para simular el checkout
  if (!authStore.isAuthenticated) {
    authStore.login(null, null, 'Client') // Loguear a Sofía por defecto
  }
})

// Pasos: 1 = Datos Pasajeros, 2 = Simulación de Pago
const step = computed(() => cartStore.step)

// Datos del Pago
const cardNumber = ref('')
const cardHolder = ref('')
const cardExpiry = ref('')
const cardCvv = ref('')
const isCardFlipped = ref(false)
const isProcessing = ref(false)

const formatCardNumber = () => {
  let val = cardNumber.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
  let matches = val.match(/\d{4,16}/g)
  let match = (matches && matches[0]) || ''
  let parts = []

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4))
  }

  if (parts.length > 0) {
    cardNumber.value = parts.join(' ')
  } else {
    cardNumber.value = val
  }
}

const formatCardExpiry = () => {
  let val = cardExpiry.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
  if (val.length >= 2) {
    cardExpiry.value = val.substring(0, 2) + '/' + val.substring(2, 4)
  } else {
    cardExpiry.value = val
  }
}

// Paso 1: Validar Pasajeros y avanzar
const goToPayment = () => {
  // Validaciones
  for (const passenger of cartStore.passengers) {
    if (!passenger.firstName.trim() || !passenger.lastName.trim() || !passenger.documentNumber.trim()) {
      Swal.fire({
        title: 'Formulario Incompleto',
        text: 'Por favor, rellena el nombre, apellido y documento de todos los pasajeros.',
        icon: 'warning',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#06b6d4'
      })
      return
    }
  }

  cartStore.setStep(2)
}

// Paso 2: Procesar reserva y pago simulado
const processCheckout = () => {
  if (!cardNumber.value || !cardHolder.value || !cardExpiry.value || !cardCvv.value) {
    Swal.fire({
      title: 'Datos de Pago Incompletos',
      text: 'Por favor, rellena todos los campos de tu tarjeta de crédito.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  isProcessing.value = true

  // Simular latencia de red bancaria
  setTimeout(() => {
    isProcessing.value = false

    const bookingRequest = {
      slotId: cartStore.slot.id,
      attractionId: cartStore.attraction.id,
      attractionName: cartStore.attraction.name,
      productTitle: cartStore.option.title,
      totalAmount: cartStore.grandTotal,
      currencyCode: 'USD',
      notes: 'Reserva realizada vía web.',
      passengers: cartStore.passengers.map(p => ({
        firstName: p.firstName,
        lastName: p.lastName,
        documentType: p.documentType,
        documentNumber: p.documentNumber,
        priceTierLabel: p.priceTierLabel,
        unitPrice: p.unitPrice,
        quantity: 1
      }))
    }

    const result = bookingStore.createBooking(authStore.user.id, bookingRequest)

    if (result.success) {
      Swal.fire({
        title: '¡Reserva Confirmada!',
        html: `
          <div class="text-left text-xs text-gray-300 flex flex-col gap-2 mt-2">
            <p><strong>Atracción:</strong> ${cartStore.attraction.name}</p>
            <p><strong>Modalidad:</strong> ${cartStore.option.title}</p>
            <p><strong>Código PNR:</strong> <span class="text-brand-cyan font-black text-sm">${result.booking.pnrCode}</span></p>
            <p><strong>Fecha de actividad:</strong> ${result.booking.slotDate}</p>
            <p><strong>Hora:</strong> ${result.booking.slotStartTime}</p>
            <p class="border-t border-white/10 pt-2 font-bold text-brand-emerald">Pago de $${cartStore.grandTotal.toFixed(2)} procesado con éxito.</p>
          </div>
        `,
        icon: 'success',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Ver Mis Reservas'
      }).then(() => {
        cartStore.clearCart()
        router.push('/portal')
      })
    } else {
      Swal.fire({
        title: 'Error de Inventario',
        text: result.message,
        icon: 'error',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#f43f5e'
      })
    }

  }, 2200)
}
</script>

<template>
  <div v-if="cartStore.attraction" class="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
    
    <!-- LADO IZQUIERDO: Pasos del Formulario (2 columnas) -->
    <div class="lg:col-span-2 flex flex-col gap-6">
      
      <!-- Indicador de Progreso Visual -->
      <div class="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-around text-xs font-bold">
        <div class="flex items-center gap-2" :class="step === 1 ? 'text-brand-cyan' : 'text-gray-500'">
          <span class="w-6 h-6 rounded-full border flex items-center justify-center" :class="step === 1 ? 'border-brand-cyan' : 'border-gray-700'">1</span>
          <span>Datos de Pasajeros</span>
        </div>
        <div class="w-16 h-px bg-white/10"></div>
        <div class="flex items-center gap-2" :class="step === 2 ? 'text-brand-cyan' : 'text-gray-500'">
          <span class="w-6 h-6 rounded-full border flex items-center justify-center" :class="step === 2 ? 'border-brand-cyan' : 'border-gray-700'">2</span>
          <span>Simulador de Pago</span>
        </div>
      </div>

      <!-- PASO 1: Formulario de Pasajeros -->
      <div v-if="step === 1" class="flex flex-col gap-5 animate-fade-in">
        <h2 class="text-lg font-bold text-gray-200 uppercase tracking-wider">Detalles de Pasajeros</h2>

        <div 
          v-for="(passenger, idx) in cartStore.passengers" 
          :key="passenger.id"
          class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4"
        >
          <div class="flex items-center justify-between border-b border-white/5 pb-2">
            <span class="text-xs font-bold text-brand-cyan">Pasajero #{{ idx + 1 }}</span>
            <span class="text-[10px] text-gray-400 font-mono">Tarifa: ${{ passenger.unitPrice.toFixed(2) }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Nombre -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-400">Nombres</label>
              <input 
                v-model="passenger.firstName"
                @input="cartStore.saveState()"
                type="text" 
                placeholder="Ej: Sofía"
                class="px-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
            
            <!-- Apellido -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-400">Apellidos</label>
              <input 
                v-model="passenger.lastName"
                @input="cartStore.saveState()"
                type="text" 
                placeholder="Ej: Castillo"
                class="px-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>
            
            <!-- Tipo Documento -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-400">Tipo de Documento</label>
              <select 
                v-model="passenger.documentType"
                @change="cartStore.saveState()"
                class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm"
              >
                <option value="Cédula">Cédula de Identidad</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
            </div>
            
            <!-- Número Documento -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-400">Número de Documento</label>
              <input 
                v-model="passenger.documentNumber"
                @input="cartStore.saveState()"
                type="text" 
                placeholder="Ej: 1723456789"
                class="px-4 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <!-- Categoría de Ticket (Cambia el precio dinámicamente) -->
            <div class="flex flex-col gap-1.5 md:col-span-2">
              <label class="text-xs text-gray-400">Categoría de Ticket (Rango de Edad)</label>
              <div class="flex gap-2 flex-wrap">
                <button 
                  v-for="tier in cartStore.option.price_tiers" 
                  :key="tier.label"
                  @click="cartStore.updatePassengerPriceByTier(passenger.id, tier.label)"
                  class="px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
                  :class="passenger.priceTierLabel === tier.label
                    ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold'
                    : 'glass-card border-white/5 text-gray-400'"
                >
                  {{ tier.label }} (${{ tier.price.toFixed(2) }})
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          @click="goToPayment"
          class="w-full py-3.5 rounded-xl font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/85 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-cyan/15 mt-2"
        >
          <span>Continuar al Pago</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      <!-- PASO 2: Pasarela de Pago Simulada -->
      <div v-if="step === 2" class="flex flex-col gap-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-200 uppercase tracking-wider">Simulador de Transacción Segura</h2>
          <button @click="cartStore.setStep(1)" class="text-xs text-brand-cyan hover:underline cursor-pointer">
            ← Editar Pasajeros
          </button>
        </div>

        <!-- TARJETA DE CRÉDITO 3D ROTATIVA -->
        <div class="relative w-full max-w-sm mx-auto h-48 [perspective:1000px] mb-4">
          <div 
            class="relative w-full h-full rounded-2xl transition-transform duration-700 [transform-style:preserve-3d] shadow-2xl border border-white/10"
            :class="{ '[transform:rotateY(180deg)]': isCardFlipped }"
          >
            <!-- FRENTE DE LA TARJETA -->
            <div class="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-brand-violet/40 via-dark-800 to-brand-cyan/40 backdrop-blur-xl p-5 flex flex-col justify-between [backface-visibility:hidden]">
              <div class="flex justify-between items-start">
                <div class="flex flex-col text-left">
                  <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Método de Pago</span>
                  <span class="text-xs font-bold text-white">TARJETA VIP SIMULADA</span>
                </div>
                <span class="text-xl">💳</span>
              </div>

              <!-- Chip y Número de Tarjeta -->
              <div class="flex flex-col gap-2">
                <div class="w-8 h-6 bg-yellow-500/20 rounded border border-yellow-500/40"></div>
                <div class="text-lg font-mono font-bold tracking-widest text-white text-center">
                  {{ cardNumber || '•••• •••• •••• ••••' }}
                </div>
              </div>

              <!-- Titular y Expiración -->
              <div class="flex justify-between items-end text-xs text-left">
                <div>
                  <div class="text-[8px] text-gray-400 uppercase">Titular</div>
                  <div class="font-bold text-gray-100 truncate w-40">{{ cardHolder.toUpperCase() || 'SOFIA CASTILLO' }}</div>
                </div>
                <div>
                  <div class="text-[8px] text-gray-400 uppercase">Vence</div>
                  <div class="font-bold text-gray-100 font-mono">{{ cardExpiry || 'MM/AA' }}</div>
                </div>
              </div>
            </div>

            <!-- RESPALDO DE LA TARJETA -->
            <div class="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 backdrop-blur-xl p-5 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <!-- Banda Magnética -->
              <div class="h-10 bg-dark-900 border-y border-white/5 -mx-5 mt-2"></div>
              
              <!-- Banda de Firma y CVV -->
              <div class="flex justify-end items-center gap-3">
                <div class="h-8 bg-white/10 rounded flex-grow text-right pr-3 leading-8 text-xs font-bold text-gray-400 font-mono italic">
                  Atracciones Sim
                </div>
                <div class="flex flex-col">
                  <span class="text-[7px] text-gray-400 uppercase">CVV</span>
                  <span class="px-3 py-1 rounded bg-white text-dark-900 font-black text-xs font-mono">
                    {{ cardCvv || '•••' }}
                  </span>
                </div>
              </div>

              <div class="text-[8px] text-gray-500 text-center leading-relaxed">
                Este es un simulador de pasarela seguro. Ningún cargo real será facturado a su tarjeta de crédito.
              </div>
            </div>

          </div>
        </div>

        <!-- Formulario de Tarjeta -->
        <div class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
          <div class="flex flex-col gap-1.5 text-left">
            <label class="text-xs text-gray-400">Número de Tarjeta</label>
            <input 
              v-model="cardNumber"
              @input="formatCardNumber"
              type="text" 
              maxlength="19"
              placeholder="4111 2222 3333 4444"
              class="px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
            />
          </div>

          <div class="flex flex-col gap-1.5 text-left">
            <label class="text-xs text-gray-400">Nombre en la Tarjeta</label>
            <input 
              v-model="cardHolder"
              type="text" 
              placeholder="Ej: Sofía Castillo"
              class="px-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5 text-left">
              <label class="text-xs text-gray-400">Vencimiento</label>
              <input 
                v-model="cardExpiry"
                @input="formatCardExpiry"
                type="text" 
                maxlength="5"
                placeholder="MM/AA"
                class="px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
              />
            </div>
            
            <div class="flex flex-col gap-1.5 text-left">
              <label class="text-xs text-gray-400">CVV</label>
              <input 
                v-model="cardCvv"
                @focus="isCardFlipped = true"
                @blur="isCardFlipped = false"
                type="password" 
                maxlength="3"
                placeholder="123"
                class="px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
              />
            </div>
          </div>
        </div>

        <!-- Botón Procesar Pago -->
        <button 
          @click="processCheckout"
          :disabled="isProcessing"
          class="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-brand-cyan to-brand-violet text-dark-900 hover:opacity-90 hover:scale-[1.01] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-cyan/15"
        >
          <span v-if="isProcessing" class="w-4 h-4 rounded-full border-2 border-dark-900 border-t-transparent animate-spin"></span>
          <span>{{ isProcessing ? 'Procesando Transacción...' : `Pagar $${cartStore.grandTotal.toFixed(2)}` }}</span>
        </button>
      </div>

    </div>

    <!-- LADO DERECHO: Resumen de Compra Sidebar (1 columna) -->
    <div>
      <div class="glass-panel rounded-2xl p-5 border border-white/10 flex flex-col gap-4 shadow-2xl sticky top-24">
        <h3 class="text-sm font-bold text-gray-200 uppercase tracking-wider border-b border-white/5 pb-2">
          Resumen de Reserva
        </h3>

        <!-- Ficha Rápida Atracción -->
        <div class="flex items-center gap-3">
          <div class="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img :src="cartStore.attraction.media[0].url" class="w-full h-full object-cover" />
          </div>
          <div class="flex flex-col gap-0.5">
            <h4 class="font-extrabold text-xs text-white truncate w-40">{{ cartStore.attraction.name }}</h4>
            <span class="text-[9px] text-brand-cyan uppercase tracking-wider font-semibold">{{ cartStore.option.title }}</span>
          </div>
        </div>

        <div class="h-px bg-white/5 my-1"></div>

        <!-- Detalles de Fecha -->
        <div class="flex flex-col gap-2 text-xs text-gray-300">
          <div class="flex justify-between">
            <span class="text-gray-500">Fecha:</span>
            <span class="font-semibold">{{ cartStore.slot.slotDate }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Horario:</span>
            <span class="font-semibold font-mono">{{ cartStore.slot.startTime }} hs</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Pasajeros:</span>
            <span class="font-semibold">{{ cartStore.passengers.length }}</span>
          </div>
        </div>

        <div class="h-px bg-white/5 my-1"></div>

        <!-- Detalle de Tickets Individuales -->
        <div class="flex flex-col gap-1.5 text-[11px] text-gray-400">
          <div 
            v-for="p in cartStore.passengers" 
            :key="p.id"
            class="flex justify-between"
          >
            <span>{{ p.firstName || 'Pasajero' }} ({{ p.priceTierLabel }})</span>
            <span>${{ p.unitPrice.toFixed(2) }}</span>
          </div>
        </div>

        <div class="h-px bg-white/5 my-1"></div>

        <!-- Factura Total -->
        <div class="flex flex-col gap-2 text-xs text-gray-300">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span>${{ cartStore.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Impuestos (15% IVA)</span>
            <span>${{ cartStore.taxAmount.toFixed(2) }}</span>
          </div>
          <div class="h-px bg-white/5 my-1"></div>
          <div class="flex justify-between font-black text-sm text-brand-emerald">
            <span>Gran Total</span>
            <span>${{ cartStore.grandTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Estilos para el 3D Credit Card Flipping */
[transform-style="preserve-3d"] {
  transform-style: preserve-3d;
}
[backface-visibility="hidden"] {
  backface-visibility: hidden;
}
</style>
