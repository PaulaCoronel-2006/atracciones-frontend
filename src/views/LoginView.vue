<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Swal from 'sweetalert2'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) {
    Swal.fire({
      title: 'Campos Vacíos',
      text: 'Por favor, completa todos los campos obligatorios.',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#d33'
    })
    return
  }

  isLoading.value = true
  try {
    const result = await authStore.login(email.value, password.value)
    if (result.success) {
      Swal.fire({
        title: '¡Bienvenido de vuelta!',
        text: `Sesión iniciada con éxito como ${result.user.firstName || 'Usuario'}.`,
        icon: 'success',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#10b981'
      })
      
      const redirectPath = route.query.redirect || (authStore.hasAdminAccess ? '/admin' : '/')
      router.push(redirectPath)
    } else {
      Swal.fire({
        title: 'Error de Autenticación',
        text: result.message || 'Verifica tu correo y contraseña.',
        icon: 'error',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#ef4444'
      })
    }
  } catch (err) {
    Swal.fire({
      title: 'Error de Red',
      text: 'Hubo un problema al conectar con el servidor de autenticación.',
      icon: 'error',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#ef4444'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
    <!-- Efecto de Fondo Decorativo -->
    <div class="absolute -top-40 -right-40 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl -z-10"></div>
    <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-violet/20 rounded-full blur-3xl -z-10"></div>

    <div class="w-full max-w-md glass-panel border border-white/10 p-8 rounded-2xl shadow-2xl relative">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-brand-cyan to-brand-violet bg-clip-text text-transparent font-outfit">
          Iniciar Sesión
        </h1>
        <p class="text-gray-400 text-sm mt-2">Ingresa a tu cuenta real en TerraQuest Experiences</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Campo Correo -->
        <div class="flex flex-col text-left">
          <label for="email" class="text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
            Correo Electrónico
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              ✉️
            </span>
            <input 
              v-model="email"
              type="email" 
              id="email" 
              required
              placeholder="cliente@ejemplo.com"
              class="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>
        </div>

        <!-- Campo Contraseña -->
        <div class="flex flex-col text-left">
          <label for="password" class="text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
            Contraseña
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
              🔒
            </span>
            <input 
              v-model="password"
              type="password" 
              id="password" 
              required
              placeholder="••••••••"
              class="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>
        </div>

        <!-- Botón de Envío -->
        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-gradient-to-r from-brand-cyan to-brand-violet hover:from-brand-cyan/90 hover:to-brand-violet/90 text-dark-900 font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-brand-cyan/25 transition-all duration-300 flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <span v-if="isLoading" class="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></span>
          <span v-else>Acceder a la Cuenta</span>
        </button>
      </form>

      <!-- Pie de Formulario -->
      <div class="text-center mt-6">
        <p class="text-xs text-gray-400">
          ¿No tienes una cuenta aún?
          <router-link to="/register" class="text-brand-cyan hover:underline font-semibold ml-1">
            Regístrate aquí
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
