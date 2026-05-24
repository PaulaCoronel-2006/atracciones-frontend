<script setup>
import { ref, computed } from 'vue'
import { useCatalogStore } from '../stores/catalog'
import Swal from 'sweetalert2'

const catalogStore = useCatalogStore()

const activeSubTab = ref('locations')

// --- ESTADOS FORMULARIO UBICACIONES ---
const newLocName = ref('')
const newLocType = ref('Country')
const newLocParentId = ref('')

const countries = computed(() => catalogStore.locations.filter(l => l.type === 'Country'))
const states = computed(() => catalogStore.locations.filter(l => l.type === 'State'))

const handleAddLocation = () => {
  if (!newLocName.value.trim()) return

  const parentId = newLocType.value === 'Country' ? null : newLocParentId.value
  
  if (newLocType.value !== 'Country' && !parentId) {
    Swal.fire({
      title: 'Elemento Padre Requerido',
      text: 'Debes vincular un país o estado superior.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    return
  }

  catalogStore.addLocation(newLocName.value.trim(), newLocType.value, parentId)
  
  Swal.fire({
    title: 'Ubicación Registrada',
    text: `"${newLocName.value}" se añadió exitosamente al catálogo jerárquico.`,
    icon: 'success',
    background: '#111827',
    color: '#f3f4f6',
    confirmButtonColor: '#10b981'
  })

  newLocName.value = ''
  newLocParentId.value = ''
}

// --- ESTADOS FORMULARIO CATEGORÍAS ---
const newCatName = ref('')
const newCatSlug = ref('')

const handleAddCategory = () => {
  if (!newCatName.value.trim()) return

  const slug = newCatSlug.value.trim() || newCatName.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
  catalogStore.addCategory(newCatName.value.trim(), slug)

  Swal.fire({
    title: 'Categoría Registrada',
    text: `Se añadió la categoría "${newCatName.value}" con éxito.`,
    icon: 'success',
    background: '#111827',
    color: '#f3f4f6',
    confirmButtonColor: '#10b981'
  })

  newCatName.value = ''
  newCatSlug.value = ''
}

// --- ESTADOS FORMULARIO INCLUSIONES ---
const newIncText = ref('')
const newIncIcon = ref('check')

const handleAddInclusion = () => {
  if (!newIncText.value.trim()) return

  catalogStore.addInclusionItem(newIncText.value.trim(), newIncIcon.value)

  Swal.fire({
    title: 'Inclusión Registrada',
    text: 'Se incorporó el servicio al catálogo global con éxito.',
    icon: 'success',
    background: '#111827',
    color: '#f3f4f6',
    confirmButtonColor: '#10b981'
  })

  newIncText.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-6 text-left">
    
    <!-- Encabezado -->
    <div class="flex flex-col gap-1 border-b border-white/5 pb-4">
      <router-link to="/admin" class="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1">
        ← Volver al Dashboard
      </router-link>
      <h1 class="text-2xl md:text-3xl font-extrabold text-white">Mantenimiento de Catálogos Globales</h1>
    </div>

    <!-- Sub-Pestañas del Catálogo -->
    <div class="flex items-center gap-2 border-b border-white/5 pb-px overflow-x-auto">
      <button 
        v-for="subTab in [
          { id: 'locations', label: '🌍 Jerarquía Geográfica' },
          { id: 'categories', label: '🗂️ Categorías & Slugs' },
          { id: 'inclusions', label: '✅ Inclusiones Globales' }
        ]"
        :key="subTab.id"
        @click="activeSubTab = subTab.id"
        class="px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex-shrink-0"
        :class="activeSubTab === subTab.id
          ? 'border-brand-cyan text-brand-cyan'
          : 'border-transparent text-gray-400 hover:text-white'"
      >
        {{ subTab.label }}
      </button>
    </div>

    <!-- CONTENEDOR MULTI-CATÁLOGO -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      <!-- COLUMNA IZQUIERDA: Formulario Agregar Nuevo (1 columna) -->
      <div class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4 text-xs h-fit">
        <h3 class="text-xs font-bold text-gray-200 uppercase tracking-wider border-b border-white/5 pb-2">
          ➕ Añadir al Catálogo
        </h3>

        <!-- Formulario: UBICACIONES -->
        <div v-if="activeSubTab === 'locations'" class="flex flex-col gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-gray-400">Tipo de Ubicación</label>
            <select v-model="newLocType" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white">
              <option value="Country">País</option>
              <option value="State">Provincia / Estado</option>
              <option value="City">Ciudad</option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5" v-if="newLocType !== 'Country'">
            <label class="text-gray-400">Vincular a Superior (Padre)</label>
            <select v-model="newLocParentId" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white">
              <option value="">Seleccionar Padre...</option>
              <!-- Si busca provincia, el padre es un país -->
              <template v-if="newLocType === 'State'">
                <option v-for="c in countries" :key="c.id" :value="c.id">{{ c.name }} (País)</option>
              </template>
              <!-- Si busca ciudad, el padre es un estado -->
              <template v-if="newLocType === 'City'">
                <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }} (Estado)</option>
              </template>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-gray-400">Nombre del Lugar</label>
            <input v-model="newLocName" type="text" placeholder="Ej: Pichincha" class="px-3 py-2 rounded-xl glass-input" />
          </div>

          <button @click="handleAddLocation" class="w-full py-2.5 rounded-xl font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 transition-all cursor-pointer">
            Registrar Ubicación
          </button>
        </div>

        <!-- Formulario: CATEGORÍAS -->
        <div v-if="activeSubTab === 'categories'" class="flex flex-col gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-gray-400">Nombre de la Categoría</label>
            <input v-model="newCatName" type="text" placeholder="Ej: Parques de Diversiones" class="px-3 py-2 rounded-xl glass-input" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-gray-400">Slug (Opcional)</label>
            <input v-model="newCatSlug" type="text" placeholder="Ej: parques-diversion" class="px-3 py-2 rounded-xl glass-input" />
          </div>

          <button @click="handleAddCategory" class="w-full py-2.5 rounded-xl font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 transition-all cursor-pointer">
            Registrar Categoría
          </button>
        </div>

        <!-- Formulario: INCLUSIONES -->
        <div v-if="activeSubTab === 'inclusions'" class="flex flex-col gap-3.5">
          <div class="flex flex-col gap-1.5">
            <label class="text-gray-400">Servicio / Descripción de Inclusión</label>
            <input v-model="newIncText" type="text" placeholder="Ej: Seguro médico de viaje básico" class="px-3 py-2 rounded-xl glass-input" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-gray-400">Ícono Visual de Identificación</label>
            <select v-model="newIncIcon" class="px-3 py-2 rounded-xl bg-dark-900 border border-white/10 text-white">
              <option value="check">✓ Checkmark</option>
              <option value="guide">👤 Naturalist / Guide</option>
              <option value="transport">🚌 Minibús / Transport</option>
              <option value="food">🍽️ Gourmet Food</option>
              <option value="ticket">🎫 Ticket Entry</option>
              <option value="equipment">🤿 Snorkel Equipment</option>
            </select>
          </div>

          <button @click="handleAddInclusion" class="w-full py-2.5 rounded-xl font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 transition-all cursor-pointer">
            Registrar Inclusión
          </button>
        </div>

      </div>

      <!-- COLUMNA DERECHA: Visualización y Auditoría del Catálogo Actual (2 columnas) -->
      <div class="lg:col-span-2 glass-panel rounded-3xl p-5 border border-white/5 flex flex-col gap-4 text-xs">
        <h3 class="text-xs font-bold text-gray-200 uppercase tracking-wider border-b border-white/5 pb-2">
          📋 Catálogo Registrado Actual
        </h3>

        <!-- Lista: UBICACIONES -->
        <div v-if="activeSubTab === 'locations'" class="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-2">
          <div 
            v-for="loc in catalogStore.locations" 
            :key="loc.id"
            class="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/10 transition-all"
          >
            <div class="flex items-center gap-3 text-left">
              <span class="text-lg">
                {{ loc.type === 'Country' ? '🇪🇨' : (loc.type === 'State' ? '🗺️' : '🏙️') }}
              </span>
              <div class="flex flex-col gap-0.5">
                <span class="font-bold text-gray-200">{{ loc.name }}</span>
                <span class="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                  Nivel: {{ loc.type }} | ID: {{ loc.id }}
                </span>
              </div>
            </div>
            
            <span class="text-[10px] text-gray-500" v-if="loc.parentId">
              Padre ID: {{ loc.parentId }}
            </span>
          </div>
        </div>

        <!-- Lista: CATEGORÍAS -->
        <div v-if="activeSubTab === 'categories'" class="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-2">
          <div 
            v-for="cat in catalogStore.categories" 
            :key="cat.id"
            class="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/10 transition-all"
          >
            <div class="flex items-center gap-3 text-left">
              <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-cover bg-center" :style="{ backgroundImage: `url(${cat.icon_url})` }"></div>
              <div class="flex flex-col gap-0.5">
                <span class="font-bold text-gray-200">{{ cat.name }}</span>
                <span class="text-[9px] font-mono text-brand-cyan">Slug: /category/{{ cat.slug }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista: INCLUSIONES -->
        <div v-if="activeSubTab === 'inclusions'" class="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-2">
          <div 
            v-for="inc in catalogStore.inclusions" 
            :key="inc.id"
            class="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/10 transition-all"
          >
            <div class="flex items-center gap-3 text-left">
              <span class="text-base p-1.5 rounded-lg bg-white/5 border border-white/5">
                {{ inc.icon_slug === 'guide' ? '👤' : (inc.icon_slug === 'transport' ? '🚌' : (inc.icon_slug === 'food' ? '🍽️' : (inc.icon_slug === 'ticket' ? '🎫' : (inc.icon_slug === 'equipment' ? '🤿' : '✓')))) }}
              </span>
              <div class="flex flex-col gap-0.5">
                <span class="font-bold text-gray-200">{{ inc.default_text }}</span>
                <span class="text-[9px] text-gray-500 uppercase tracking-wider">Icon Ref: {{ inc.icon_slug }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
