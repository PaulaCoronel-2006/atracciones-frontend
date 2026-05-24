<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  placeName: {
    type: String,
    default: 'Punto de Encuentro Exacto'
  }
})

const mapContainer = ref(null)
const mapInstance = ref(null)
const markerInstance = ref(null)
const loadError = ref(false)

// Ícono SVG personalizado en base64 para evitar el bug de rutas relativas de Leaflet en Vite
const svgIcon = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2306b6d4" width="40" height="40">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
`)

const initMap = async () => {
  if (!mapContainer.value) return

  try {
    // Carga dinámica de Leaflet
    const L = await import('leaflet')
    
    // Si ya existe mapa, destruirlo
    if (mapInstance.value) {
      mapInstance.value.remove()
    }

    // Inicializar mapa
    mapInstance.value = L.map(mapContainer.value, {
      zoomControl: true,
      attributionControl: false
    }).setView([props.lat, props.lng], 15)

    // Agregar capa de mapa base (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(mapInstance.value)

    // Crear icono personalizado
    const customIcon = L.icon({
      iconUrl: svgIcon,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -35]
    })

    // Agregar pin marcador con popup informativo
    markerInstance.value = L.marker([props.lat, props.lng], { icon: customIcon })
      .addTo(mapInstance.value)
      .bindPopup(`<div style="font-weight: 600; font-size: 13px; color: #111827;">${props.placeName}</div>`)
      .openPopup()

    // Ajustar tamaño
    setTimeout(() => {
      if (mapInstance.value) {
        mapInstance.value.invalidateSize()
      }
    }, 400)

  } catch (error) {
    console.error('Error al inicializar Leaflet:', error)
    loadError.value = true
  }
}

// Escuchar cambios de coordenadas para actualizar el mapa
watch(() => [props.lat, props.lng], () => {
  initMap()
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.remove()
    mapInstance.value = null
  }
})
</script>

<template>
  <div class="relative w-full h-[320px] md:h-[400px] rounded-2xl overflow-hidden border border-white/10 glow-cyan">
    <!-- Contenedor del Mapa Leaflet -->
    <div v-show="!loadError" ref="mapContainer" class="w-full h-full z-10"></div>

    <!-- Vista de Error / Fallback Premium sin Conexión -->
    <div v-if="loadError" class="absolute inset-0 bg-dark-800 flex flex-col items-center justify-center p-6 text-center z-20">
      <div class="w-16 h-16 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan text-2xl mb-4">
        📍
      </div>
      <h4 class="text-gray-200 font-bold text-lg mb-1">Mapa de Ubicación</h4>
      <p class="text-gray-400 text-sm max-w-sm mb-4">
        {{ placeName }}
      </p>
      <div class="px-4 py-2 rounded-lg bg-white/5 border border-white/5 inline-flex items-center gap-2 text-xs text-brand-cyan font-mono">
        <span>Lat: {{ lat.toFixed(4) }}</span>
        <span class="text-gray-600">|</span>
        <span>Lng: {{ lng.toFixed(4) }}</span>
      </div>
      <p class="text-[10px] text-gray-500 mt-6 uppercase tracking-wider">
        Modo Simulado Activo / Coordenadas de la Atracción
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Evitar problemas de z-index de Leaflet con el selector de roles */
:deep(.leaflet-pane) {
  z-index: 1 !important;
}
:deep(.leaflet-top), :deep(.leaflet-bottom) {
  z-index: 2 !important;
}
</style>
