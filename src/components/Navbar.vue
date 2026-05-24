<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Swal from 'sweetalert2'

const authStore = useAuthStore()
const router = useRouter()

const isMobileMenuOpen = ref(false)
const isRoleSelectorOpen = ref(false)

const currentUser = computed(() => authStore.user)
const currentRole = computed(() => currentUser.value?.role || 'Invitado')

const roles = [
  { label: 'Invitado (Sin Login)', role: null, desc: 'Ver atracciones y explorar' },
  { label: 'Cliente (Sofía)', role: 'Client', desc: 'Comprar, ver reservas y reviews' },
  { label: 'Socio (Partner)', role: 'Partner', desc: 'Gestionar horarios y atracciones' },
  { label: 'Administrador (Yanick)', role: 'Admin', desc: 'Control total de catálogos y POS' }
]

const changeSimulationRole = (role) => {
  isRoleSelectorOpen.value = false
  isMobileMenuOpen.value = false
  
  if (role === null) {
    authStore.logout()
    Swal.fire({
      title: 'Sesión Cerrada',
      text: 'Ahora estás navegando de forma pública.',
      icon: 'info',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#06b6d4'
    })
    router.push('/')
  } else {
    authStore.login(null, null, role)
    Swal.fire({
      title: `Rol Cambiado: ${role}`,
      text: `Has iniciado sesión como ${authStore.user.firstName} ${authStore.user.lastName}.`,
      icon: 'success',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#10b981'
    })
    
    if (role === 'Admin' || role === 'Partner') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <nav class="sticky top-0 z-50 glass-panel shadow-lg border-b border-white/5 py-4">
    <div class="container mx-auto px-4 md:px-6 max-w-7xl flex items-center justify-between">
      
      <!-- Logo y Título -->
      <router-link to="/" class="flex items-center gap-2 group">
        <span class="text-2xl animate-pulse">✨</span>
        <span class="font-extrabold text-xl md:text-2xl bg-gradient-to-r from-brand-cyan via-brand-violet to-brand-emerald bg-clip-text text-transparent group-hover:scale-102 transition-transform duration-300">
          Atracciones Premium
        </span>
      </router-link>

      <!-- Enlaces de Escritorio -->
      <div class="hidden lg:flex items-center gap-6">
        <router-link to="/" class="text-sm font-medium text-gray-300 hover:text-brand-cyan transition-colors" active-class="text-brand-cyan font-bold">
          Explorar
        </router-link>

        <router-link v-if="authStore.isClient || !authStore.isAuthenticated" to="/portal" class="text-sm font-medium text-gray-300 hover:text-brand-cyan transition-colors" active-class="text-brand-cyan font-bold">
          Mis Reservas
        </router-link>

        <!-- Accesos de Administrador / Partner -->
        <template v-if="authStore.hasAdminAccess">
          <router-link to="/admin" class="text-sm font-medium text-gray-300 hover:text-brand-cyan transition-colors" active-class="text-brand-cyan font-bold">
            Dashboard
          </router-link>
          <router-link to="/admin/pos" class="text-sm font-medium text-gray-300 hover:text-brand-cyan transition-colors" active-class="text-brand-cyan font-bold">
            Terminal POS
          </router-link>
          <router-link to="/admin/schedules" class="text-sm font-medium text-gray-300 hover:text-brand-cyan transition-colors" active-class="text-brand-cyan font-bold">
            Horarios
          </router-link>
          <router-link to="/admin/bookings" class="text-sm font-medium text-gray-300 hover:text-brand-cyan transition-colors" active-class="text-brand-cyan font-bold">
            Reservas
          </router-link>
          <router-link to="/admin/catalogs" class="text-sm font-medium text-gray-300 hover:text-brand-cyan transition-colors" active-class="text-brand-cyan font-bold">
            Catálogos
          </router-link>
        </template>
      </div>

      <!-- Selector de Rol y Usuario -->
      <div class="hidden lg:flex items-center gap-4">
        <!-- Selector flotante de roles de prueba -->
        <div class="relative">
          <button @click="isRoleSelectorOpen = !isRoleSelectorOpen" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold glass-card border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/10 transition-all cursor-pointer">
            <span class="w-2 h-2 rounded-full bg-brand-cyan animate-ping"></span>
            Rol: {{ currentRole }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': isRoleSelectorOpen }">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <!-- Dropdown del Selector de Roles -->
          <div v-if="isRoleSelectorOpen" class="absolute right-0 mt-2 w-64 rounded-xl glass-panel border border-white/10 shadow-2xl p-2 animate-fade-in z-50">
            <div class="text-gray-400 text-[10px] uppercase font-bold tracking-wider px-3 py-1 border-b border-white/5 mb-1">
              Simulador de Roles
            </div>
            <button v-for="item in roles" :key="item.label" @click="changeSimulationRole(item.role)" class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5 flex flex-col gap-0.5 cursor-pointer">
              <span class="font-semibold" :class="item.role === authStore.user?.role ? 'text-brand-cyan' : 'text-gray-200'">
                {{ item.label }}
              </span>
              <span class="text-[11px] text-gray-400">{{ item.desc }}</span>
            </button>
          </div>
        </div>

        <!-- Perfil Breve -->
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-2 border-l border-white/10 pl-4">
          <div class="w-8 h-8 rounded-full bg-brand-violet/20 flex items-center justify-center border border-brand-violet text-brand-violet text-sm font-bold uppercase">
            {{ authStore.user.firstName[0] }}{{ authStore.user.lastName[0] }}
          </div>
          <div class="flex flex-col text-left">
            <span class="text-xs font-semibold text-gray-200">{{ authStore.user.firstName }}</span>
            <span class="text-[9px] text-gray-400">{{ authStore.user.role }}</span>
          </div>
        </div>
      </div>

      <!-- Hamburguesa Móvil -->
      <div class="lg:hidden flex items-center gap-3">
        <button @click="isRoleSelectorOpen = !isRoleSelectorOpen" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold glass-card border border-brand-cyan/20 text-brand-cyan">
          {{ currentRole }}
        </button>
        
        <button @click="toggleMobileMenu" class="text-gray-300 hover:text-white p-1" aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

    </div>

    <!-- Menú Móvil Desplegable -->
    <div v-if="isMobileMenuOpen" class="lg:hidden border-t border-white/5 mt-4 px-4 py-3 flex flex-col gap-3 glass-panel">
      <router-link to="/" @click="isMobileMenuOpen = false" class="text-sm font-semibold text-gray-300 py-1 hover:text-brand-cyan">
        Explorar Atracciones
      </router-link>
      <router-link v-if="authStore.isClient || !authStore.isAuthenticated" to="/portal" @click="isMobileMenuOpen = false" class="text-sm font-semibold text-gray-300 py-1 hover:text-brand-cyan">
        Mis Reservas
      </router-link>

      <!-- Panel Admin para Móvil -->
      <template v-if="authStore.hasAdminAccess">
        <div class="h-px bg-white/5 my-1"></div>
        <router-link to="/admin" @click="isMobileMenuOpen = false" class="text-sm font-semibold text-brand-violet py-1">
          Admin Dashboard
        </router-link>
        <router-link to="/admin/pos" @click="isMobileMenuOpen = false" class="text-sm font-semibold text-brand-violet py-1">
          Terminal POS
        </router-link>
        <router-link to="/admin/schedules" @click="isMobileMenuOpen = false" class="text-sm font-semibold text-brand-violet py-1">
          Inventario y Horarios
        </router-link>
      </template>

      <!-- Selección de roles flotante para móviles -->
      <div class="h-px bg-white/5 my-1"></div>
      <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Cambiar Rol:</div>
      <div class="grid grid-cols-2 gap-2">
        <button v-for="item in roles" :key="item.label" @click="changeSimulationRole(item.role)" class="px-2.5 py-2 rounded-lg text-xs font-semibold glass-card border border-white/5 text-center text-gray-300">
          {{ item.role === null ? 'Público' : item.role }}
        </button>
      </div>
    </div>

    <!-- Selector Móvil Flotante si el menú está cerrado pero haces click en el badge -->
    <div v-if="isRoleSelectorOpen && !isMobileMenuOpen" class="lg:hidden absolute left-4 right-4 mt-2 rounded-xl glass-panel border border-white/10 shadow-2xl p-2 z-50">
      <div class="text-gray-400 text-[10px] uppercase font-bold tracking-wider px-3 py-1 border-b border-white/5 mb-1">
        Simulador de Roles
      </div>
      <button v-for="item in roles" :key="item.label" @click="changeSimulationRole(item.role)" class="w-full text-left px-3 py-2 rounded-lg text-xs transition-all hover:bg-white/5 flex flex-col gap-0.5">
        <span class="font-semibold" :class="item.role === authStore.user?.role ? 'text-brand-cyan' : 'text-gray-200'">
          {{ item.label }}
        </span>
        <span class="text-[10px] text-gray-400">{{ item.desc }}</span>
      </button>
    </div>

  </nav>
</template>
