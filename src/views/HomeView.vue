<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCatalogStore } from '../stores/catalog'

const catalogStore = useCatalogStore()

const searchQuery = ref('')
const selectedCategoryId = ref('')

const categories = computed(() => catalogStore.categories)

onMounted(async () => {
  await catalogStore.fetchAttractions()
})

// Filtrar las atracciones por búsqueda de texto y categoría seleccionada
const filteredAttractions = computed(() => {
  return catalogStore.publishedAttractions.filter(attr => {
    // Filtro por Categoría
    if (selectedCategoryId.value) {
      const subcat = catalogStore.getSubcategoryById(attr.subcategory_id)
      if (!subcat || subcat.categoryId !== selectedCategoryId.value) {
        return false
      }
    }

    // Filtro por Buscador (Nombre o Ubicación)
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      const matchesName = attr.name.toLowerCase().includes(query)
      
      const loc = catalogStore.getLocationById(attr.location_id)
      const matchesLocation = loc ? loc.name.toLowerCase().includes(query) : false
      
      return matchesName || matchesLocation
    }

    return true
  })
})

const selectCategory = (categoryId) => {
  if (selectedCategoryId.value === categoryId) {
    selectedCategoryId.value = '' // Deseleccionar si hace click en la misma
  } else {
    selectedCategoryId.value = categoryId
  }
}

const getLocationLabel = (locationId) => {
  const city = catalogStore.getLocationById(locationId)
  if (!city) return ''
  const state = catalogStore.getLocationById(city.parentId)
  return `${city.name}, ${state ? state.name : ''}`
}
</script>

<template>
  <div class="flex flex-col gap-10">
    
    <!-- Hero Section con Buscador Integrado -->
    <section class="relative rounded-3xl overflow-hidden py-16 md:py-24 px-6 text-center border border-white/5 bg-gradient-to-br from-dark-800/80 to-dark-900/90 shadow-2xl">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-cyan/10 via-transparent to-transparent pointer-events-none"></div>
      
      <div class="relative z-10 max-w-3xl mx-auto flex flex-col gap-6">
        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-white font-sans leading-tight">
          Descubre Aventuras <span class="bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-emerald bg-clip-text text-transparent">Exclusivas</span>
        </h1>
        <p class="text-gray-400 text-base md:text-lg max-w-xl mx-auto">
          Reserva visitas guiadas, cruceros privados y experiencias premium en los rincones más espectaculares de la región.
        </p>

        <!-- Buscador Global -->
        <div class="mt-4 flex max-w-xl mx-auto w-full rounded-2xl glass-panel p-2 border border-white/10 shadow-2xl glow-cyan">
          <div class="flex items-center pl-3 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
            </svg>
          </div>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="¿A dónde quieres ir? Ej: Galápagos, Quito..." 
            class="w-full bg-transparent border-none text-white placeholder-gray-500 pl-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>
    </section>

    <!-- Chips de Categoría Dinámicos -->
    <section class="flex flex-col gap-4 text-left">
      <h2 class="text-sm font-bold text-gray-400 uppercase tracking-wider">Filtrar por Categoría</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          @click="selectCategory(cat.id)"
          class="relative h-24 rounded-2xl overflow-hidden text-left p-4 border transition-all duration-300 group flex items-end cursor-pointer"
          :class="[
            selectedCategoryId === cat.id 
              ? 'border-brand-cyan ring-2 ring-brand-cyan/50 shadow-lg shadow-brand-cyan/10 scale-102' 
              : 'border-white/5 hover:border-brand-cyan/40 hover:scale-102'
          ]"
        >
          <!-- Imagen de fondo con filtro oscuro -->
          <div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" :style="{ backgroundImage: `url(${cat.icon_url})` }"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent"></div>
          
          <span class="relative z-10 font-bold text-sm text-white group-hover:text-brand-cyan transition-colors">
            {{ cat.name }}
          </span>
        </button>
      </div>
    </section>

    <!-- Lista de Atracciones -->
    <section class="flex flex-col gap-6 text-left">
      <div class="flex items-center justify-between border-b border-white/5 pb-3">
        <h2 class="text-lg font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
          🌍 Atracciones Recomendadas
          <span class="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-gray-400 font-normal">
            {{ filteredAttractions.length }} encontradas
          </span>
        </h2>
      </div>

      <!-- Estado vacío -->
      <div v-if="filteredAttractions.length === 0" class="glass-card rounded-2xl p-12 text-center border border-white/5">
        <span class="text-4xl">🔍</span>
        <h3 class="text-gray-300 font-bold text-lg mt-3">No se encontraron atracciones</h3>
        <p class="text-gray-500 text-sm mt-1">Prueba a buscar con otros términos o cambia la categoría de filtro.</p>
        <button @click="searchQuery = ''; selectedCategoryId = ''" class="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 transition-all cursor-pointer">
          Limpiar Filtros
        </button>
      </div>

      <!-- Grilla de Tarjetas Premium -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="attr in filteredAttractions" 
          :key="attr.id"
          class="rounded-2xl overflow-hidden glass-panel glass-panel-hover flex flex-col group"
        >
          <!-- Imagen Principal con efecto Hover -->
          <div class="relative h-48 overflow-hidden">
            <img 
              :src="attr.media.find(m => m.is_main)?.url || attr.media[0].url" 
              :alt="attr.name" 
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            
            <!-- Badge de Puntuación -->
            <div class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-dark-900/80 backdrop-blur-md border border-white/10 flex items-center gap-1 text-xs font-bold text-yellow-500">
              <span>★</span>
              <span>{{ attr.rating.toFixed(2) }}</span>
            </div>

            <!-- Ubicación en Badge Superior -->
            <div class="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-dark-900/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-brand-cyan uppercase tracking-wider">
              📍 {{ getLocationLabel(attr.location_id) }}
            </div>
          </div>

          <!-- Contenido Informativo -->
          <div class="p-5 flex-grow flex flex-col gap-3">
            
            <!-- Tags -->
            <div class="flex flex-wrap gap-1.5">
              <span 
                v-for="tagId in attr.tags" 
                :key="tagId"
                class="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400"
              >
                #{{ catalogStore.getTagById(tagId)?.name }}
              </span>
            </div>

            <!-- Título -->
            <h3 class="font-extrabold text-base md:text-lg text-white group-hover:text-brand-cyan transition-colors leading-snug">
              {{ attr.name }}
            </h3>

            <!-- Descripción Corta -->
            <p class="text-gray-400 text-xs line-clamp-3 leading-relaxed">
              {{ attr.description }}
            </p>

            <!-- Separador -->
            <div class="h-px bg-white/5 my-1"></div>

            <!-- Fila de Compra/Acción -->
            <div class="flex items-center justify-between mt-auto">
              <div class="flex flex-col">
                <span class="text-[9px] text-gray-500 uppercase tracking-wider">Desde</span>
                <span class="text-base font-black text-brand-emerald">
                  ${{ attr.price_base.toFixed(2) }} <span class="text-[10px] font-normal text-gray-400">/ pers</span>
                </span>
              </div>

              <!-- Enlace a Ficha Detalle -->
              <router-link 
                :to="{ name: 'attraction-detail', params: { slug: attr.slug } }"
                class="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 hover:shadow-lg hover:shadow-brand-cyan/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                Ver Detalle
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </router-link>
            </div>

          </div>
        </div>
      </div>
    </section>

  </div>
</template>
