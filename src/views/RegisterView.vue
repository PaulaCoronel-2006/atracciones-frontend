<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Swal from 'sweetalert2'

const authStore = useAuthStore()
const router = useRouter()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const phone = ref('')
const location = ref('')
const isLoading = ref(false)

const handleRegister = async () => {
  if (!firstName.value || !lastName.value || !email.value || !password.value) {
    Swal.fire({
      title: 'Campos Vacíos',
      text: 'Por favor, completa todos los campos requeridos (*).',
      icon: 'warning',
      background: '#111827',
      color: '#f3f4f6',
      confirmButtonColor: '#d33'
    })
    return
  }

  isLoading.value = true
  try {
    const result = await authStore.register({
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
      phone: phone.value,
      location: location.value
    })

    if (result.success) {
      Swal.fire({
        title: '¡Registro Exitoso!',
        text: 'Tu cuenta ha sido creada directamente en Supabase.',
        icon: 'success',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#10b981'
      })
      router.push('/')
    } else {
      Swal.fire({
        title: 'Error al Registrarse',
        text: result.message || 'Inténtalo de nuevo con otros datos.',
        icon: 'error',
        background: '#111827',
        color: '#f3f4f6',
        confirmButtonColor: '#ef4444'
      })
    }
  } catch (err) {
    Swal.fire({
      title: 'Error de Conexión',
      text: 'Ocurrió un error al contactar al servidor en la nube.',
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

    <div class="w-full max-w-xl glass-panel border border-white/10 p-8 rounded-2xl shadow-2xl relative">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-brand-cyan to-brand-violet bg-clip-text text-transparent font-outfit">
          Registrar Nueva Cuenta
        </h1>
        <p class="text-gray-400 text-sm mt-2">Crea tu perfil transaccional de cliente en vivo</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Nombre -->
          <div class="flex flex-col text-left">
            <label for="firstName" class="text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Nombre *
            </label>
            <input 
              v-model="firstName"
              type="text" 
              id="firstName" 
              required
              placeholder="Sofía"
              class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>

          <!-- Apellido -->
          <div class="flex flex-col text-left">
            <label for="lastName" class="text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Apellido *
            </label>
            <input 
              v-model="lastName"
              type="text" 
              id="lastName" 
              required
              placeholder="Castillo"
              class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Correo -->
          <div class="flex flex-col text-left">
            <label for="email" class="text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Correo Electrónico *
            </label>
            <input 
              v-model="email"
              type="email" 
              id="email" 
              required
              placeholder="sofia.castillo@correo.com"
              class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>

          <!-- Contraseña -->
          <div class="flex flex-col text-left">
            <label for="password" class="text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Contraseña *
            </label>
            <input 
              v-model="password"
              type="password" 
              id="password" 
              required
              placeholder="Al menos 6 caracteres"
              class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Teléfono -->
          <div class="flex flex-col text-left">
            <label for="phone" class="text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Teléfono Celular
            </label>
            <input 
              v-model="phone"
              type="tel" 
              id="phone" 
              placeholder="+593 988888888"
              class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>

          <!-- Ubicación -->
          <div class="flex flex-col text-left">
            <label for="location" class="text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Ubicación / Ciudad
            </label>
            <input 
              v-model="location"
              type="text" 
              id="location" 
              placeholder="Cuenca, Ecuador"
              class="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
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
          <span v-else>Completar Registro</span>
        </button>
      </form>

      <!-- Pie de Formulario -->
      <div class="text-center mt-6">
        <p class="text-xs text-gray-400">
          ¿Ya posees una cuenta registrada?
          <router-link to="/login" class="text-brand-cyan hover:underline font-semibold ml-1">
            Inicia sesión aquí
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
