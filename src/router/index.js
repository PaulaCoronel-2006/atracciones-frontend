import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import HomeView from '../views/HomeView.vue'
import AttractionDetailView from '../views/AttractionDetailView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import CustomerPortalView from '../views/CustomerPortalView.vue'

import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminAttractionEditView from '../views/AdminAttractionEditView.vue'
import AdminScheduleView from '../views/AdminScheduleView.vue'
import AdminPosTerminalView from '../views/AdminPosTerminalView.vue'
import AdminBookingListView from '../views/AdminBookingListView.vue'
import AdminCatalogView from '../views/AdminCatalogView.vue'

const routes = [
  // --- RUTAS PÚBLICAS ---
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/attraction/:slug',
    name: 'attraction-detail',
    component: AttractionDetailView
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: CheckoutView
  },
  {
    path: '/portal',
    name: 'customer-portal',
    component: CustomerPortalView
  },

  // --- RUTAS ADMINISTRATIVAS ---
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/attractions/:id?',
    name: 'admin-attraction-edit',
    component: AdminAttractionEditView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/schedules',
    name: 'admin-schedule',
    component: AdminScheduleView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/pos',
    name: 'admin-pos',
    component: AdminPosTerminalView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/bookings',
    name: 'admin-bookings',
    component: AdminBookingListView,
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/catalogs',
    name: 'admin-catalogs',
    component: AdminCatalogView,
    meta: { requiresAdmin: true }
  },
  
  // Redirección por defecto
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Guardia global para proteger rutas de administración
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAdmin) {
    if (!authStore.hasAdminAccess) {
      next({ name: 'home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
