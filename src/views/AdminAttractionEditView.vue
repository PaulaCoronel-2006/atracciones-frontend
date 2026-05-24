<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '../stores/catalog'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()

const id = route.params.id
const isEditing = !!id

// Pestaña Activa
const activeTab = ref('general')

// Estados de Ubicación Jerárquica
const selectedCountryId = ref('')
const selectedStateId = ref('')
const selectedCityId = ref('')

// Formulario reactivo principal
const form = ref({
  name: '',
  subcategory_id: '',
  description: '',
  is_active: true,
  is_published: false,
  location_coords: { lat: -0.2201, lng: -78.5122, placeName: '' },
  tags: [],
  inclusions: [],
  itinerary: [],
  product_options: [
    {
      id: 'po-temp-1',
      title: 'Tour Compartido Estándar',
      slug: 'tour-compartido',
      price_tiers: [
        { label: 'Adulto', age_min: 18, age_max: 65, price: 40.00 },
        { label: 'Niño', age_min: 4, age_max: 17, price: 25.00 }
      ]
    }
  ]
})

// Cargar datos si estamos editando
onMounted(() => {
  if (isEditing) {
    const attraction = catalogStore.getAttractionById(id)
    if (attraction) {
      form.value = JSON.parse(JSON.stringify(attraction)) // Copia profunda
      
      // Reconstruir la jerarquía de ubicaciones
      const city = catalogStore.getLocationById(form.value.location_id)
      if (city) {
        selectedCityId.value = city.id
        const state = catalogStore.getLocationById(city.parentId)
        if (state) {
          selectedStateId.value = state.id
          const country = catalogStore.getLocationById(state.parentId)
          if (country) {
            selectedCountryId.value = country.id
          }
        }
      }
    } else {
      Swal.fire({
        title: 'Atracción no encontrada',
        text: 'La atracción especificada no existe.',
        icon: 'error',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#06b6d4'
      })
      router.push('/admin')
    }
  } else {
    // Si es nueva, pre-seleccionar primer subcategoría y país por defecto
    if (catalogStore.subcategories.length > 0) {
      form.value.subcategory_id = catalogStore.subcategories[0].id
    }
    const ecuador = catalogStore.locations.find(l => l.name === 'Ecuador' && l.type === 'Country')
    if (ecuador) {
      selectedCountryId.value = ecuador.id
    }
  }
})

// --- SELECTORES JERÁRQUICOS FILTRADOS EN CASCADA ---
const countries = computed(() => catalogStore.locations.filter(l => l.type === 'Country'))

const states = computed(() => {
  if (!selectedCountryId.value) return []
  return catalogStore.locations.filter(l => l.type === 'State' && l.parentId === selectedCountryId.value)
})

const cities = computed(() => {
  if (!selectedStateId.value) return []
  return catalogStore.locations.filter(l => l.type === 'City' && l.parentId === selectedStateId.value)
})

const handleCountryChange = () => {
  selectedStateId.value = ''
  selectedCityId.value = ''
}

const handleStateChange = () => {
  selectedCityId.value = ''
}

// --- GESTIÓN DE ITINERARIO DINÁMICO ---
const newStopName = ref('')
const newStopDuration = ref('1h')
const newStopIncluded = ref(true)

const addItineraryStop = () => {
  if (!newStopName.value.trim()) return
  
  const stopNumber = form.value.itinerary.length + 1
  form.value.itinerary.push({
    stop_number: stopNumber,
    name: newStopName.value.trim(),
    duration: newStopDuration.value,
    is_included: newStopIncluded.value
  })

  // Limpiar campos de parada
  newStopName.value = ''
  newStopDuration.value = '1h'
  newStopIncluded.value = true
}

const removeItineraryStop = (index) => {
  form.value.itinerary.splice(index, 1)
  // Re-ordenar números de parada automáticamente
  form.value.itinerary.forEach((stop, idx) => {
    stop.stop_number = idx + 1
  })
}

// --- GESTIÓN DE INCLUSIONES DEL CATÁLOGO GLOBAL ---
const toggleInclusion = (inclusionId, type) => {
  const index = form.value.inclusions.findIndex(i => i.inclusion_item_id === inclusionId)
  if (index !== -1) {
    if (form.value.inclusions[index].type === type) {
      // Si hace click de nuevo en el mismo, lo removemos
      form.value.inclusions.splice(index, 1)
    } else {
      // Si cambia de tipo (incluido <-> excluido)
      form.value.inclusions[index].type = type
    }
  } else {
    // Si no está registrado, añadirlo
    form.value.inclusions.push({
      inclusion_item_id: inclusionId,
      type
    })
  }
}

const isInclusionActive = (inclusionId, type) => {
  return form.value.inclusions.some(i => i.inclusion_item_id === inclusionId && i.type === type)
}

// --- GESTIÓN DE TAGS ---
const toggleTag = (tagId) => {
  const index = form.value.tags.indexOf(tagId)
  if (index !== -1) {
    form.value.tags.splice(index, 1)
  } else {
    form.value.tags.push(tagId)
  }
}

// --- ACCIÓN: GUARDAR CAMBIOS ---
const saveAttraction = () => {
  if (!form.value.name.trim() || !form.value.description.trim()) {
    Swal.fire({
      title: 'Datos Incompletos',
      text: 'Por favor, rellena el nombre y descripción de la atracción.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  if (!selectedCityId.value) {
    Swal.fire({
      title: 'Ubicación Incompleta',
      text: 'Debes seleccionar una Ciudad jerárquica para la atracción.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  // Vincular ID de la ciudad seleccionada
  form.value.location_id = selectedCityId.value

  let success
  if (isEditing) {
    success = catalogStore.updateAttraction(id, form.value)
  } else {
    catalogStore.addAttraction(form.value)
    success = true
  }

  if (success) {
    Swal.fire({
      title: isEditing ? '¡Atracción Actualizada!' : '¡Atracción Creada!',
      text: `El registro de "${form.value.name}" se guardó exitosamente en el catálogo.`,
      icon: 'success',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#10b981'
    }).then(() => {
      router.push('/admin')
    })
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 text-left">
    
    <!-- Encabezado y Volver -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
      <div class="flex flex-col gap-1">
        <router-link to="/admin" class="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1">
          ← Volver al Dashboard
        </router-link>
        <h1 class="text-2xl md:text-3xl font-extrabold text-white">
          {{ isEditing ? 'Editar Atracción' : 'Nueva Atracción' }}
        </h1>
      </div>

      <button 
        @click="saveAttraction"
        class="px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-emerald text-dark-900 hover:bg-brand-emerald/90 transition-all cursor-pointer shadow-lg shadow-brand-emerald/10"
      >
        💾 Guardar Cambios
      </button>
    </div>

    <!-- Menú de Pestañas Avanzado -->
    <div class="flex items-center gap-2 border-b border-white/5 pb-px overflow-x-auto">
      <button 
        v-for="tab in [
          { id: 'general', label: '⚙️ General', desc: 'Metadatos' },
          { id: 'location', label: '📍 Ubicación', desc: 'Coordenadas' },
          { id: 'tags', label: '🏷️ Etiquetas', desc: 'Buscador' },
          { id: 'inclusions', label: '✅ Inclusiones', desc: 'Servicios' },
          { id: 'itinerary', label: '🗺️ Itinerario', desc: 'Paradas' }
        ]" 
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-3 text-xs font-bold transition-all border-b-2 flex flex-col gap-0.5 cursor-pointer flex-shrink-0"
        :class="activeTab === tab.id 
          ? 'border-brand-cyan text-brand-cyan' 
          : 'border-transparent text-gray-400 hover:text-white'"
      >
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- CONTENIDO DE LAS PESTAÑAS -->
    <div class="glass-panel rounded-3xl p-6 border border-white/5 shadow-2xl">
      
      <!-- 1. PESTAÑA GENERAL -->
      <div v-if="activeTab === 'general'" class="flex flex-col gap-5 animate-fade-in">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Datos Básicos</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Nombre -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Nombre de la Atracción</label>
            <input 
              v-model="form.name"
              type="text" 
              placeholder="Ej: Caminata guiada por volcán"
              class="px-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          <!-- Subcategoría -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Subcategoría del Catálogo</label>
            <select 
              v-model="form.subcategory_id"
              class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm"
            >
              <option 
                v-for="sub in catalogStore.subcategories" 
                :key="sub.id" 
                :value="sub.id"
              >
                {{ catalogStore.getCategoryById(sub.categoryId)?.name }} &gt; {{ sub.name }}
              </option>
            </select>
          </div>

          <!-- Descripción -->
          <div class="flex flex-col gap-1.5 md:col-span-2">
            <label class="text-xs text-gray-400">Descripción Completa (HTML / Text)</label>
            <textarea 
              v-model="form.description"
              placeholder="Describe minuciosamente las actividades y vistas que incluye esta atracción turística..."
              class="h-32 px-4 py-3 rounded-xl glass-input text-sm leading-relaxed"
            ></textarea>
          </div>

          <!-- CONTROL DE ESTADO DUAL (Criterio técnico destacado) -->
          <div class="md:col-span-2 border-t border-white/5 pt-4 mt-2">
            <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Control Dual de Estados</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Publicado (Visibilidad en catálogo) -->
              <div class="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-bold text-gray-200">Estado de Publicación (Visibilidad)</span>
                  <span class="text-[10px] text-gray-400">Determina si los clientes pueden ver la ficha públicamente.</span>
                </div>
                <button 
                  @click="form.is_published = !form.is_published"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer"
                  :class="form.is_published 
                    ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' 
                    : 'glass-card border-white/10 text-gray-400'"
                >
                  {{ form.is_published ? 'Publicada' : 'Borrador' }}
                </button>
              </div>

              <!-- Activa (Capacidad de recibir Reservas) -->
              <div class="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-bold text-gray-200">Estado Operativo (Capacidad)</span>
                  <span class="text-[10px] text-gray-400">Indica si está apta para recibir nuevas reservas y cupos.</span>
                </div>
                <button 
                  @click="form.is_active = !form.is_active"
                  class="px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer"
                  :class="form.is_active 
                    ? 'bg-brand-emerald/20 border-brand-emerald text-brand-emerald' 
                    : 'glass-card border-white/10 text-gray-400'"
                >
                  {{ form.is_active ? 'Activa / Operativa' : 'Pausada' }}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      <!-- 2. PESTAÑA UBICACIÓN JERÁRQUICA -->
      <div v-if="activeTab === 'location'" class="flex flex-col gap-5 animate-fade-in">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Jerarquía Geográfica</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- País -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">País</label>
            <select 
              v-model="selectedCountryId"
              @change="handleCountryChange"
              class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm"
            >
              <option value="">Selecciona País...</option>
              <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <!-- Estado -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Provincia / Estado</label>
            <select 
              v-model="selectedStateId"
              @change="handleStateChange"
              :disabled="states.length === 0"
              class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm disabled:opacity-50"
            >
              <option value="">Selecciona Estado...</option>
              <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <!-- Ciudad -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Ciudad</label>
            <select 
              v-model="selectedCityId"
              :disabled="cities.length === 0"
              class="px-4 py-2.5 rounded-xl bg-dark-900 border border-white/10 text-white text-sm disabled:opacity-50"
            >
              <option value="">Selecciona Ciudad...</option>
              <option v-for="ci in cities" :key="ci.id" :value="ci.id">{{ ci.name }}</option>
            </select>
          </div>
        </div>

        <div class="h-px bg-white/5 my-2"></div>
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Detalles de Encuentro (Mapa)</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <!-- Latitud -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Latitud (Coordenadas)</label>
            <input 
              v-model.number="form.location_coords.lat"
              type="number" 
              step="0.000001"
              class="px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
            />
          </div>
          
          <!-- Longitud -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Longitud (Coordenadas)</label>
            <input 
              v-model.number="form.location_coords.lng"
              type="number" 
              step="0.000001"
              class="px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
            />
          </div>

          <!-- Dirección Texto -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-400">Punto de Encuentro Escrito</label>
            <input 
              v-model="form.location_coords.placeName"
              type="text" 
              placeholder="Ej: Entrada principal del lobby"
              class="px-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>
        </div>
      </div>

      <!-- 3. PESTAÑA TAGS / ETIQUETAS -->
      <div v-if="activeTab === 'tags'" class="flex flex-col gap-5 animate-fade-in">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Etiquetas de Búsqueda y Filtro</h3>
        <p class="text-xs text-gray-500 mb-2">
          Haz click sobre las etiquetas para activarlas o desactivarlas para esta atracción.
        </p>

        <div class="flex flex-wrap gap-2.5">
          <button 
            v-for="tag in catalogStore.tags" 
            :key="tag.id"
            @click="toggleTag(tag.id)"
            class="px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
            :class="form.tags.includes(tag.id)
              ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan font-bold scale-102'
              : 'glass-card border-white/5 text-gray-400'"
          >
            #{{ tag.name }}
          </button>
        </div>
      </div>

      <!-- 4. PESTAÑA INCLUSIONES -->
      <div v-if="activeTab === 'inclusions'" class="flex flex-col gap-5 animate-fade-in">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Asignación de Inclusiones y Exclusiones</h3>
        <p class="text-xs text-gray-500 mb-2">
          Para cada servicio global, selecciona si está Incluido en el precio básico o si corresponde a una Exclusión explícita.
        </p>

        <div class="flex flex-col gap-2.5">
          <div 
            v-for="item in catalogStore.inclusions" 
            :key="item.id"
            class="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
          >
            <span class="font-semibold text-gray-200">{{ item.default_text }}</span>
            
            <div class="flex items-center gap-2">
              <!-- Incluido -->
              <button 
                @click="toggleInclusion(item.id, 'included')"
                class="px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer"
                :class="isInclusionActive(item.id, 'included')
                  ? 'bg-brand-emerald/20 border-brand-emerald text-brand-emerald'
                  : 'glass-card border-white/5 text-gray-500'"
              >
                Incluido
              </button>
              
              <!-- Excluido -->
              <button 
                @click="toggleInclusion(item.id, 'excluded')"
                class="px-3 py-1 rounded-lg font-bold border transition-all cursor-pointer"
                :class="isInclusionActive(item.id, 'excluded')
                  ? 'bg-brand-rose/20 border-brand-rose text-brand-rose'
                  : 'glass-card border-white/5 text-gray-500'"
              >
                Excluido
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. PESTAÑA ITINERARIO DINÁMICO -->
      <div v-if="activeTab === 'itinerary'" class="flex flex-col gap-6 animate-fade-in">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Creador de Itinerario por Paradas</h3>
        
        <!-- Formularios para añadir Parada rápida -->
        <div class="p-4 rounded-xl bg-white/5 border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="flex flex-col gap-1.5 md:col-span-2 text-left">
            <label class="text-[10px] text-gray-400 uppercase">Nombre de la Parada</label>
            <input 
              v-model="newStopName"
              type="text" 
              placeholder="Ej: Observación de leones marinos"
              class="px-3 py-2 rounded-lg glass-input text-xs"
            />
          </div>
          
          <div class="flex flex-col gap-1.5 text-left">
            <label class="text-[10px] text-gray-400 uppercase">Duración</label>
            <input 
              v-model="newStopDuration"
              type="text" 
              placeholder="Ej: 2h 30m"
              class="px-3 py-2 rounded-lg glass-input text-xs"
            />
          </div>

          <button 
            @click="addItineraryStop"
            class="px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            ➕ Agregar Parada
          </button>
        </div>

        <!-- Listado de Paradas Actuales -->
        <div class="flex flex-col gap-2">
          <div v-if="form.itinerary.length === 0" class="text-center py-8 text-gray-500 text-xs">
            No has agregado ninguna parada al itinerario aún.
          </div>
          
          <div 
            v-else
            v-for="(stop, index) in form.itinerary" 
            :key="index"
            class="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-all animate-fade-in"
          >
            <div class="flex items-center gap-3">
              <span class="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan font-bold flex items-center justify-center text-[10px]">
                {{ stop.stop_number }}
              </span>
              <div class="flex flex-col text-left gap-0.5">
                <span class="font-bold text-gray-200">{{ stop.name }}</span>
                <span class="text-[10px] text-gray-500">Duración estimada: {{ stop.duration }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <!-- Switch de Acceso Incluido/Opcional -->
              <button 
                @click="stop.is_included = !stop.is_included"
                class="px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all"
                :class="stop.is_included 
                  ? 'bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/25' 
                  : 'bg-brand-rose/15 text-brand-rose border border-brand-rose/25'"
              >
                {{ stop.is_included ? 'Incluido' : 'Opcional' }}
              </button>

              <!-- Borrar -->
              <button 
                @click="removeItineraryStop(index)"
                class="p-1 rounded bg-white/5 hover:bg-brand-rose/20 text-gray-400 hover:text-brand-rose transition-colors cursor-pointer"
                title="Eliminar Parada"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>
