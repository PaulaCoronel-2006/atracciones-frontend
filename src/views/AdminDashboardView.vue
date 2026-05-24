<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBookingStore } from '../stores/booking'
import { useCatalogStore } from '../stores/catalog'

const router = useRouter()
const bookingStore = useBookingStore()
const catalogStore = useCatalogStore()

// --- CÁLCULO DE METRICAS EN TIEMPO REAL ---
const totalSales = computed(() => {
  const active = bookingStore.bookings.filter(b => b.statusId !== 4) // No cancelados
  return active.reduce((sum, b) => sum + b.totalAmount, 0)
})

const totalBookingsCount = computed(() => bookingStore.bookings.length)

const activeAttractionsCount = computed(() => {
  return catalogStore.attractions.filter(a => a.is_active && a.is_published).length
})

const averageOccupancy = computed(() => {
  const totalSlots = bookingStore.slots.length
  if (totalSlots === 0) return 0
  
  const totalCapacity = bookingStore.slots.reduce((sum, s) => sum + s.capacityTotal, 0)
  const totalAvailable = bookingStore.slots.reduce((sum, s) => sum + s.capacityAvailable, 0)
  const sold = totalCapacity - totalAvailable
  
  return (sold / totalCapacity) * 100
})

// Últimas 5 reservas registradas
const recentBookings = computed(() => {
  return bookingStore.bookings.slice(0, 5)
})

const getStatusClass = (statusId) => {
  switch (statusId) {
    case 1: return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
    case 2: return 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20'
    case 3: return 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20'
    case 4: return 'bg-brand-rose/10 text-brand-rose border border-brand-rose/20'
    default: return 'bg-gray-800 text-gray-400'
  }
}
</script>

<template>
  <div class="flex flex-col gap-8 text-left">
    
    <!-- Encabezado -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
      <div class="flex flex-col gap-1">
        <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Panel Administrativo</span>
        <h1 class="text-2xl md:text-3xl font-extrabold text-white">Dashboard Operativo</h1>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          @click="router.push('/admin/pos')"
          class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-cyan text-dark-900 hover:bg-brand-cyan/80 transition-all cursor-pointer flex items-center gap-1 shadow-lg shadow-brand-cyan/10"
        >
          ➕ Venta POS
        </button>
      </div>
    </div>

    <!-- Malla de KPIs (Métricas Clave) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      
      <!-- Ventas Totales -->
      <div class="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between relative overflow-hidden">
        <div class="absolute right-0 top-0 w-24 h-24 bg-brand-emerald/5 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex flex-col gap-1">
          <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Ingresos Netos</span>
          <span class="text-2xl font-black text-white">${{ totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          <span class="text-[9px] text-brand-emerald font-semibold">Actividad en tiempo real</span>
        </div>
        <span class="text-3xl p-3 bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald rounded-2xl">💰</span>
      </div>

      <!-- Reservas Totales -->
      <div class="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between relative overflow-hidden">
        <div class="absolute right-0 top-0 w-24 h-24 bg-brand-cyan/5 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex flex-col gap-1">
          <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Reservas Registradas</span>
          <span class="text-2xl font-black text-white">{{ totalBookingsCount }}</span>
          <span class="text-[9px] text-brand-cyan font-semibold">Incluye canceladas</span>
        </div>
        <span class="text-3xl p-3 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-2xl">🎟️</span>
      </div>

      <!-- Ocupación Promedio -->
      <div class="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between relative overflow-hidden">
        <div class="absolute right-0 top-0 w-24 h-24 bg-brand-violet/5 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex flex-col gap-1">
          <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Ocupación Promedio</span>
          <span class="text-2xl font-black text-white">{{ averageOccupancy.toFixed(1) }}%</span>
          <span class="text-[9px] text-brand-violet font-semibold">Capacidad de slots</span>
        </div>
        
        <!-- Medidor circular SVG rápido -->
        <div class="relative w-12 h-12">
          <svg class="w-full h-full transform -rotate-90">
            <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.05)" stroke-width="4" fill="transparent"/>
            <circle cx="24" cy="24" r="20" stroke="#8b5cf6" stroke-width="4" fill="transparent"
              :stroke-dasharray="125.6"
              :stroke-dashoffset="125.6 - (125.6 * averageOccupancy) / 100"
            />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-300">📈</span>
        </div>
      </div>

      <!-- Atracciones Activas -->
      <div class="glass-card rounded-2xl p-5 border border-white/5 flex items-center justify-between relative overflow-hidden">
        <div class="absolute right-0 top-0 w-24 h-24 bg-brand-rose/5 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex flex-col gap-1">
          <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Atracciones Activas</span>
          <span class="text-2xl font-black text-white">{{ activeAttractionsCount }}</span>
          <span class="text-[9px] text-gray-500">De {{ catalogStore.attractions.length }} creadas</span>
        </div>
        <span class="text-3xl p-3 bg-brand-rose/10 border border-brand-rose/20 text-brand-rose rounded-2xl">⚡</span>
      </div>

    </div>

    <!-- Sección de Enlaces de Gestión Rápida -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button @click="router.push('/admin/pos')" class="p-4 rounded-2xl border border-white/5 glass-panel hover:border-brand-cyan/30 text-center flex flex-col items-center gap-2 transition-all cursor-pointer">
        <span class="text-xl">🖥️</span>
        <span class="text-xs font-bold text-white">POS Terminal</span>
      </button>
      <button @click="router.push('/admin/schedules')" class="p-4 rounded-2xl border border-white/5 glass-panel hover:border-brand-cyan/30 text-center flex flex-col items-center gap-2 transition-all cursor-pointer">
        <span class="text-xl">📅</span>
        <span class="text-xs font-bold text-white">Inventario / Cupos</span>
      </button>
      <button @click="router.push('/admin/bookings')" class="p-4 rounded-2xl border border-white/5 glass-panel hover:border-brand-cyan/30 text-center flex flex-col items-center gap-2 transition-all cursor-pointer">
        <span class="text-xl">🔍</span>
        <span class="text-xs font-bold text-white">Buscar Reservas</span>
      </button>
      <button @click="router.push('/admin/catalogs')" class="p-4 rounded-2xl border border-white/5 glass-panel hover:border-brand-cyan/30 text-center flex flex-col items-center gap-2 transition-all cursor-pointer">
        <span class="text-xl">🗂️</span>
        <span class="text-xs font-bold text-white">Gestionar Catálogos</span>
      </button>
    </div>

    <!-- Lista de Reservas Recientes y Acceso a Edición de Atracciones -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- ÚLTIMAS RESERVAS (2 columnas) -->
      <div class="lg:col-span-2 glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
        <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2">
          <span>Últimas Reservas Registradas</span>
          <router-link to="/admin/bookings" class="text-[10px] text-brand-cyan hover:underline">Ver todas →</router-link>
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="text-gray-500 border-b border-white/5">
                <th class="py-2.5">PNR</th>
                <th>Atracción</th>
                <th>Fecha Actividad</th>
                <th>Total</th>
                <th class="text-right">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr 
                v-for="b in recentBookings" 
                :key="b.id"
                class="hover:bg-white/5 transition-colors"
              >
                <td class="py-3 font-mono font-bold text-brand-cyan">{{ b.pnrCode }}</td>
                <td class="font-semibold text-gray-200 truncate max-w-[150px]">{{ b.attractionName }}</td>
                <td class="text-gray-400">{{ b.slotDate }}</td>
                <td class="font-extrabold text-gray-200">${{ b.totalAmount.toFixed(2) }}</td>
                <td class="text-right">
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" :class="getStatusClass(b.statusId)">
                    {{ b.statusName }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- GESTIÓN DE ATRACCIONES (1 columna) -->
      <div class="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
        <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between border-b border-white/5 pb-2">
          <span>Atracciones</span>
          <button @click="router.push('/admin/attractions')" class="text-[10px] text-brand-cyan hover:underline">➕ Nueva</button>
        </h3>

        <div class="flex flex-col gap-3">
          <div 
            v-for="a in catalogStore.attractions" 
            :key="a.id"
            class="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/15 transition-all text-xs"
          >
            <div class="flex flex-col text-left gap-0.5">
              <span class="font-bold text-gray-200 truncate w-32 md:w-40">{{ a.name }}</span>
              <span class="text-[10px] text-gray-500">Cat: {{ catalogStore.getSubcategoryById(a.subcategory_id)?.name }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="router.push(`/admin/attractions/${a.id}`)"
                class="p-1.5 rounded-lg bg-white/5 hover:bg-brand-cyan/20 hover:text-brand-cyan text-gray-400 transition-colors cursor-pointer"
                title="Editar"
              >
                ✏️
              </button>
              <span 
                class="w-2.5 h-2.5 rounded-full"
                :class="a.is_active && a.is_published ? 'bg-brand-emerald' : 'bg-gray-600'"
                :title="a.is_active && a.is_published ? 'Publicada y Activa' : 'Borrador o Pausada'"
              ></span>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>
