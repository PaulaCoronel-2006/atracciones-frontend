<template>
  <footer class="border-t border-white/5 bg-dark-900/90 py-8 mt-12">
    <div class="container mx-auto px-4 md:px-6 max-w-7xl">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <!-- Info Principal -->
        <div class="md:col-span-2">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xl">✨</span>
            <span class="font-extrabold text-lg bg-gradient-to-r from-brand-cyan to-brand-violet bg-clip-text text-transparent">
              Atracciones Premium
            </span>
          </div>
          <p class="text-gray-400 text-sm max-w-sm leading-relaxed">
            Plataforma líder para la reserva de experiencias únicas, tours VIP y expediciones naturales con disponibilidad garantizada y control operativo de primer nivel.
          </p>
        </div>

        <!-- Enlaces Rápidos -->
        <div>
          <h4 class="text-sm font-bold text-gray-200 uppercase tracking-wider mb-3">Descubre</h4>
          <ul class="space-y-2 text-sm text-gray-400">
            <li><router-link to="/" class="hover:text-brand-cyan transition-colors">Inicio</router-link></li>
            <li><router-link to="/portal" class="hover:text-brand-cyan transition-colors">Mi Portal de Cliente</router-link></li>
            <li><a href="#" class="hover:text-brand-cyan transition-colors">Términos de Servicio</a></li>
            <li><a href="#" class="hover:text-brand-cyan transition-colors">Políticas de Privacidad</a></li>
          </ul>
        </div>

        <!-- Contacto e Integración -->
        <div>
          <h4 class="text-sm font-bold text-gray-200 uppercase tracking-wider mb-3">Integración</h4>
          <p class="text-gray-400 text-xs leading-relaxed mb-2">
            Proyecto de Integración de Microservicios. Arquitectura distribuida en .NET Core Web API y base de datos relacional Supabase.
          </p>
          <span class="inline-block px-2.5 py-1 rounded bg-white/5 text-[10px] text-gray-400 border border-white/5">
            OS: Windows Dev Env
          </span>
        </div>

      </div>

      <div class="border-t border-white/5 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span class="text-xs text-gray-500">
          &copy; 2026 Atracciones Premium. Todos los derechos reservados. Diseñado para wow.
        </span>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span>Desarrollado con Vue 3 + Tailwind CSS</span>
          <span class="w-1.5 h-1.5 rounded-full bg-brand-emerald"></span>
          <span>Offline Simulator Mode</span>
        </div>
      </div>

    </div>
  </footer>
</template>
