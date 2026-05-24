<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Navegación Principal -->
    <Navbar />

    <!-- Área de Contenido Principal con Transición Animada -->
    <main class="flex-grow container mx-auto px-4 md:px-6 py-6 max-w-7xl">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Pie de Página -->
    <Footer />
  </div>
</template>

<style>
/* Las transiciones globales están definidas en style.css */
</style>
