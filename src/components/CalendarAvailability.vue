<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBookingStore } from '../stores/booking'

const props = defineProps({
  optionId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['select-slot'])

const bookingStore = useBookingStore()

const currentDate = ref(new Date())
const selectedDateStr = ref('')
const activeSlotId = ref('')

const year = computed(() => currentDate.value.getFullYear())
const month = computed(() => currentDate.value.getMonth())

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const currentMonthLabel = computed(() => `${monthNames[month.value]} ${year.value}`)

// Cambiar de mes
const prevMonth = () => {
  currentDate.value = new Date(year.value, month.value - 1, 1)
  selectedDateStr.value = ''
}

const nextMonth = () => {
  currentDate.value = new Date(year.value, month.value + 1, 1)
  selectedDateStr.value = ''
}

// Obtener todos los slots para la opción elegida
const slotsForOption = computed(() => {
  return bookingStore.getSlotsByOption(props.optionId)
})

// Mapear los slots agrupados por fecha
const slotsByDate = computed(() => {
  const map = {}
  slotsForOption.value.forEach(slot => {
    if (!map[slot.slotDate]) {
      map[slot.slotDate] = []
    }
    map[slot.slotDate].push(slot)
  })
  return map
})

// Generar los días de la grilla del calendario (rellenar con días vacíos para cuadrar)
const calendarDays = computed(() => {
  const firstDayIndex = new Date(year.value, month.value, 1).getDay()
  // Ajustar para que Lunes sea el primer día (1), Domingo el último (0 -> 7)
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1
  
  const daysInMonth = new Date(year.value, month.value + 1, 0).getDate()
  
  const days = []
  
  // Agregar días vacíos del mes anterior
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push({ day: null, dateStr: '', isDummy: true })
  }
  
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Agregar días del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year.value, month.value, d)
    const dateStr = dayDate.toISOString().split('T')[0]
    
    const slots = slotsByDate.value[dateStr] || []
    const totalAvailable = slots.reduce((sum, s) => sum + s.capacityAvailable, 0)
    const isPast = dateStr < todayStr
    
    let status = 'no-scheduled' // no-scheduled, available, fully-booked
    
    if (slots.length > 0) {
      status = totalAvailable > 0 ? 'available' : 'fully-booked'
    }

    days.push({
      day: d,
      dateStr,
      isDummy: false,
      isPast,
      status,
      slots,
      totalAvailable
    })
  }
  
  return days
})

// Horarios disponibles para el día seleccionado
const activeDaySlots = computed(() => {
  if (!selectedDateStr.value) return []
  return slotsByDate.value[selectedDateStr.value] || []
})

// Al cambiar el producto, reiniciar la selección de fecha
watch(() => props.optionId, () => {
  selectedDateStr.value = ''
  activeSlotId.value = ''
})

const selectDay = (day) => {
  if (day.isDummy || day.isPast || day.status === 'no-scheduled') return
  selectedDateStr.value = day.dateStr
  activeSlotId.value = ''
}

const selectSlot = (slot) => {
  if (slot.capacityAvailable <= 0) return
  activeSlotId.value = slot.id
  emit('select-slot', slot)
}
</script>

<template>
  <div class="glass-card rounded-2xl p-4 md:p-6 border border-white/5 flex flex-col gap-4 text-left">
    
    <!-- Header del Calendario -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-gray-200 uppercase tracking-wider">Disponibilidad en Vivo</h3>
      <div class="flex items-center gap-2">
        <button @click="prevMonth" class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span class="text-xs font-semibold text-gray-200 min-w-[110px] text-center">
          {{ currentMonthLabel }}
        </span>
        <button @click="nextMonth" class="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Días de la semana -->
    <div class="grid grid-cols-7 gap-1 text-center border-b border-white/5 pb-2">
      <span v-for="dayName in ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']" :key="dayName" class="text-[10px] font-bold text-gray-500 uppercase">
        {{ dayName }}
      </span>
    </div>

    <!-- Grilla de Días -->
    <div class="grid grid-cols-7 gap-1.5 text-center">
      <template v-for="(day, idx) in calendarDays" :key="idx">
        <!-- Día ficticio vacío -->
        <div v-if="day.isDummy" class="aspect-square"></div>
        
        <!-- Día real -->
        <button 
          v-else 
          @click="selectDay(day)"
          :disabled="day.isPast || day.status === 'no-scheduled'"
          class="aspect-square rounded-xl flex flex-col items-center justify-center p-1 text-xs font-semibold relative transition-all duration-200 cursor-pointer"
          :class="[
            day.dateStr === selectedDateStr ? 'ring-2 ring-brand-cyan bg-brand-cyan/20 text-white' : '',
            day.isPast ? 'text-gray-600 bg-transparent opacity-30 cursor-not-allowed' : '',
            day.status === 'no-scheduled' && !day.isPast ? 'text-gray-500 bg-transparent opacity-40 cursor-not-allowed' : '',
            day.status === 'fully-booked' ? 'bg-brand-rose/10 text-brand-rose/60 border border-brand-rose/20 line-through cursor-not-allowed' : '',
            day.status === 'available' && day.dateStr !== selectedDateStr ? 'bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald hover:bg-brand-emerald/25 hover:scale-105' : ''
          ]"
        >
          <span>{{ day.day }}</span>
          
          <!-- Badge de Cupos disponibles -->
          <span 
            v-if="day.status === 'available'" 
            class="text-[7px] px-1 rounded-full absolute bottom-1 bg-brand-emerald text-dark-900 font-bold"
          >
            {{ day.totalAvailable }}
          </span>
        </button>
      </template>
    </div>

    <!-- Leyenda -->
    <div class="flex items-center gap-4 text-[9px] text-gray-400 border-t border-white/5 pt-3">
      <div class="flex items-center gap-1">
        <span class="w-2.5 h-2.5 rounded bg-brand-emerald/10 border border-brand-emerald/20"></span>
        <span>Disponible</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-2.5 h-2.5 rounded bg-brand-rose/10 border border-brand-rose/20 line-through"></span>
        <span>Agotado</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-2.5 h-2.5 rounded bg-transparent border border-gray-800"></span>
        <span>Sin Horarios</span>
      </div>
    </div>

    <!-- Lista de Horarios del Día Seleccionado -->
    <div v-if="selectedDateStr" class="border-t border-white/5 pt-4 mt-2 animate-fade-in">
      <h4 class="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        🕒 Horarios para el {{ selectedDateStr.split('-').reverse().join('/') }}
      </h4>

      <div class="flex flex-col gap-2.5">
        <button 
          v-for="slot in activeDaySlots" 
          :key="slot.id"
          @click="selectSlot(slot)"
          :disabled="slot.capacityAvailable <= 0"
          class="w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer"
          :class="[
            slot.id === activeSlotId 
              ? 'bg-brand-cyan/20 border-brand-cyan shadow-lg shadow-brand-cyan/5' 
              : 'glass-card border-white/5 hover:border-white/20',
            slot.capacityAvailable <= 0 ? 'opacity-40 cursor-not-allowed line-through' : ''
          ]"
        >
          <div>
            <div class="text-sm font-bold text-gray-100 flex items-center gap-1">
              {{ slot.startTime }} - {{ slot.endTime }}
            </div>
            <!-- Barra de capacidad visual -->
            <div class="w-32 h-1.5 rounded-full bg-white/5 overflow-hidden mt-1.5">
              <div 
                class="h-full rounded-full transition-all duration-300"
                :class="slot.capacityAvailable <= 2 ? 'bg-brand-rose' : 'bg-brand-emerald'"
                :style="{ width: `${(slot.capacityAvailable / slot.capacityTotal) * 100}%` }"
              ></div>
            </div>
          </div>

          <div class="text-right flex flex-col gap-0.5">
            <span 
              class="text-xs font-bold"
              :class="slot.capacityAvailable <= 2 ? 'text-brand-rose' : 'text-brand-emerald'"
            >
              {{ slot.capacityAvailable }} / {{ slot.capacityTotal }} libres
            </span>
            <span class="text-[9px] text-gray-400">
              {{ slot.capacityAvailable <= 2 ? '¡Últimos cupos!' : 'Cupos disponibles' }}
            </span>
          </div>
        </button>
      </div>
    </div>

  </div>
</template>
