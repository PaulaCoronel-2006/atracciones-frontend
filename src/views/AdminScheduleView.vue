<script setup>
import { ref, computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import { useBookingStore } from '../stores/booking'
import Swal from 'sweetalert2'

const catalogStore = useCatalogStore()
const bookingStore = useBookingStore()

const selectedAttractionId = ref('')
const selectedOptionId = ref('')

// Si cambia la atracción, seleccionar su primer opción de producto automáticamente
const handleAttractionChange = () => {
  selectedOptionId.value = ''
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

// --- GENERADOR MASIVO DE HORARIOS (PLANTILLAS) ---
const genStartDate = ref('')
const genEndDate = ref('')
const genStartTime = ref('09:00')
const genEndTime = ref('14:00')
const genCapacity = ref(20)
const genDaysOfWeek = ref([1, 2, 3, 4, 5]) // Lunes a Viernes por defecto

const days = [
  { label: 'Lu', value: 1 },
  { label: 'Ma', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Ju', value: 4 },
  { label: 'Vi', value: 5 },
  { label: 'Sá', value: 6 },
  { label: 'Do', value: 0 }
]

const toggleGenDay = (dayVal) => {
  const index = genDaysOfWeek.value.indexOf(dayVal)
  if (index !== -1) {
    genDaysOfWeek.value.splice(index, 1)
  } else {
    genDaysOfWeek.value.push(dayVal)
  }
}

const executeGenerateSchedules = () => {
  if (!selectedOptionId.value) {
    Swal.fire({
      title: 'Modalidad requerida',
      text: 'Selecciona una atracción y una modalidad antes de generar.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  if (!genStartDate.value || !genEndDate.value) {
    Swal.fire({
      title: 'Fechas requeridas',
      text: 'Por favor, selecciona un rango de fechas de inicio y fin.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  if (genDaysOfWeek.value.length === 0) {
    Swal.fire({
      title: 'Selecciona días de la semana',
      text: 'Debes marcar al menos un día de la semana para la plantilla.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  const createdCount = bookingStore.generateScheduleMassive(selectedOptionId.value, {
    startDate: genStartDate.value,
    endDate: genEndDate.value,
    startTime: genStartTime.value,
    endTime: genEndTime.value,
    capacity: genCapacity.value,
    daysOfWeek: genDaysOfWeek.value
  })

  Swal.fire({
    title: 'Horarios Generados',
    text: `Se crearon con éxito ${createdCount} nuevos slots de disponibilidad basados en la plantilla.`,
    icon: 'success',
    background: '#111827',
    color: '#f3f4f6',
    confirmButtonColor: '#10b981'
  })
}

// --- LIMPIEZA EN LOTE (BULK DELETE) ---
const delStartDate = ref('')
const delEndDate = ref('')

const executeBulkDelete = () => {
  if (!selectedOptionId.value) return

  if (!delStartDate.value || !delEndDate.value) {
    Swal.fire({
      title: 'Rango de fechas requerido',
      text: 'Ingresa las fechas de inicio y fin para la depuración en lote.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  Swal.fire({
    title: '¿Proceder con la Limpieza?',
    text: 'Esta acción eliminará masivamente todos los slots vacíos sin reservas en este rango de fechas. ¡No se puede deshacer!',
    icon: 'warning',
    showCancelButton: true,
    background: '#111827',
    color: '#f3f4f6',
    confirmButtonColor: '#f43f5e',
    cancelButtonColor: '#374151',
    confirmButtonText: 'Sí, depurar slots',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      const deleted = bookingStore.bulkDeleteSlots(selectedOptionId.value, delStartDate.value, delEndDate.value)
      
      Swal.fire({
        title: 'Depuración Completada',
        text: `Se eliminaron ${deleted} slots de disponibilidad que no contaban con reservas activas.`,
        icon: 'success',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#10b981'
      })

      delStartDate.value = ''
      delEndDate.value = ''
    }
  })
}

// --- MONITOR DE CUPOS ---
const activeSlots = computed(() => {
  if (!selectedOptionId.value) return []
  return bookingStore.getSlotsByOption(selectedOptionId.value).sort((a,b) => a.slotDate.localeCompare(b.slotDate))
})
</script>

<template>
  <div class="flex flex-col gap-6 text-left">
    
    <!-- Encabezado -->
    <div class="flex flex-col gap-1 border-b border-white/5 pb-4">
      <router-link to="/admin" class="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1">
        ← Volver al Dashboard
      </router-link>
      <h1 class="text-2xl md:text-3xl font-extrabold text-white">Inventario y Generador de Horarios</h1>
    </div>

    <!-- Filtro de Atracción y Modalidad Obligatorio -->
    <div class="glass-panel rounded-2xl p-5 border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs text-gray-400">Seleccionar Atracción</label>
        <select 
          v-model="selectedAttractionId"
          @change="handleAttractionChange"
          class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm"
        >
          <option value="">Selecciona Atracción...</option>
          <option v-for="a in catalogStore.attractions" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5" v-if="selectedAttractionId">
        <label class="text-xs text-gray-400">Modalidad del Tour</label>
        <select 
          v-model="selectedOptionId"
          class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm"
        >
          <option value="">Selecciona Modalidad...</option>
          <option v-for="o in activeAttraction?.product_options" :key="o.id" :value="o.id">{{ o.title }}</option>
        </select>
      </div>
    </div>

    <!-- CONTROLES: Sólo se muestran si seleccionan producto -->
    <div v-if="selectedOptionId" class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      <!-- LADO IZQUIERDO: Generador Masivo y Limpieza en Lote (1 columna en LG) -->
      <div class="flex flex-col gap-6">
        
        <!-- GENERADOR MASIVO (PLANTILLAS) -->
        <div class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
          <h3 class="text-xs font-bold text-gray-200 uppercase tracking-wider border-b border-white/5 pb-2">
            ⚙️ Generador Masivo (Plantilla)
          </h3>

          <div class="flex flex-col gap-3">
            <!-- Rango Fechas -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex flex-col gap-1">
                <label class="text-gray-400">Fecha Inicio</label>
                <input v-model="genStartDate" type="date" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-gray-400">Fecha Fin</label>
                <input v-model="genEndDate" type="date" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white" />
              </div>
            </div>

            <!-- Horarios -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex flex-col gap-1">
                <label class="text-gray-400">Hora Inicio</label>
                <input v-model="genStartTime" type="time" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-gray-400">Hora Fin</label>
                <input v-model="genEndTime" type="time" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white" />
              </div>
            </div>

            <!-- Capacidad Inicial -->
            <div class="flex flex-col gap-1 text-xs">
              <label class="text-gray-400">Capacidad Total de Personas</label>
              <input v-model.number="genCapacity" type="number" min="1" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white font-bold" />
            </div>

            <!-- Selector de Días de la Semana -->
            <div class="flex flex-col gap-1.5 text-xs text-left">
              <label class="text-gray-400">Días Operativos</label>
              <div class="flex gap-1.5 justify-between">
                <button 
                  v-for="d in days" 
                  :key="d.value"
                  @click="toggleGenDay(d.value)"
                  class="w-8 h-8 rounded-full border text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer"
                  :class="genDaysOfWeek.includes(d.value)
                    ? 'bg-brand-cyan border-brand-cyan text-dark-900 font-extrabold'
                    : 'glass-card border-white/5 text-gray-400'"
                >
                  {{ d.label }}
                </button>
              </div>
            </div>

            <button 
              @click="executeGenerateSchedules"
              class="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 transition-all cursor-pointer shadow-lg shadow-brand-cyan/10"
            >
              🚀 Generar Horarios Masivamente
            </button>
          </div>
        </div>

        <!-- HERRAMIENTAS DE LIMPIEZA (BULK DELETE) -->
        <div class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
          <h3 class="text-xs font-bold text-brand-rose uppercase tracking-wider border-b border-white/5 pb-2">
            🗑️ Limpieza en Lote (Bulk Delete)
          </h3>
          <p class="text-[10px] text-gray-500">
            Útil para borrar slots vacíos sin reservas. Si un horario ya cuenta con boletos vendidos, el sistema lo protegerá automáticamente del borrado.
          </p>

          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="flex flex-col gap-1">
                <label class="text-gray-400">Fecha Inicio</label>
                <input v-model="delStartDate" type="date" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-gray-400">Fecha Fin</label>
                <input v-model="delEndDate" type="date" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white" />
              </div>
            </div>

            <button 
              @click="executeBulkDelete"
              class="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-rose/10 hover:bg-brand-rose/25 text-brand-rose border border-brand-rose/20 hover:border-brand-rose/40 transition-all cursor-pointer"
            >
              🧹 Limpiar Slots en Rango
            </button>
          </div>
        </div>

      </div>

      <!-- LADO DERECHO: MONITOR DE CUPOS E INVENTARIO (2 columnas en LG) -->
      <div class="lg:col-span-2 glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
        <h3 class="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2">
          <span>📊 Monitor de Cupos y Ocupación</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-normal">
            {{ activeSlots.length }} slots programados
          </span>
        </h3>

        <!-- Si no hay slots -->
        <div v-if="activeSlots.length === 0" class="text-center py-16 text-gray-500 text-xs">
          Aún no se han generado horarios programados para esta modalidad en la base de datos. ¡Utiliza la herramienta de generación de la izquierda para comenzar!
        </div>

        <div v-else class="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-2">
          <div 
            v-for="slot in activeSlots" 
            :key="slot.id"
            class="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
          >
            <!-- Info básica del slot -->
            <div class="flex items-center gap-3">
              <span class="text-xl">📅</span>
              <div class="flex flex-col text-left gap-0.5">
                <span class="font-bold text-gray-100 text-sm">Fecha: {{ slot.slotDate }}</span>
                <span class="text-gray-400 font-medium">Hora: {{ slot.startTime }} hs</span>
              </div>
            </div>

            <!-- Monitor visual de ocupación -->
            <div class="flex-grow max-w-xs flex flex-col gap-1.5 text-left">
              <div class="flex justify-between text-[10px] font-bold">
                <span class="text-gray-400">Cupos Vendidos</span>
                <span class="text-brand-cyan">{{ slot.capacityTotal - slot.capacityAvailable }} / {{ slot.capacityTotal }}</span>
              </div>
              <div class="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div 
                  class="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-brand-cyan to-brand-violet"
                  :style="{ width: `${((slot.capacityTotal - slot.capacityAvailable) / slot.capacityTotal) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- Detalles e indicador numérico -->
            <div class="text-right flex flex-col gap-1 items-end">
              <span 
                class="px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide"
                :class="slot.capacityAvailable === 0 
                  ? 'bg-brand-rose/10 text-brand-rose border border-brand-rose/25' 
                  : 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/25'"
              >
                {{ slot.capacityAvailable === 0 ? 'Agotado' : `${slot.capacityAvailable} disponibles` }}
              </span>
            </div>

          </div>
        </div>
      </div>

    </div>

    <!-- Alerta informativa si no hay atracciones elegidas -->
    <div v-else class="glass-card rounded-2xl p-16 text-center border border-white/5 text-gray-500 text-xs">
      👈 Por favor, selecciona una Atracción turística en el filtro superior para desplegar el gestor de inventario y horarios.
    </div>

  </div>
</template>
