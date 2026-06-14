import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contextos
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { BookingProvider } from './context/BookingContext';
import { CartProvider } from './context/CartContext';

// Componentes compartidos
import { Navbar } from './components/shared/Navbar';
import { Footer } from './components/shared/Footer';
import { PrivateRoute } from './components/shared/PrivateRoute';

// Vistas públicas
import HomeView from './views/HomeView';
import ExploreView from './views/ExploreView';
import AttractionDetailView from './views/AttractionDetailView';
import CheckoutView from './views/CheckoutView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';

// Vistas privadas/admin (Carga perezosa para optimización)
const CustomerPortalView = lazy(() => import('./views/CustomerPortalView'));
const AdminDashboardView = lazy(() => import('./views/AdminDashboardView'));
const AdminCatalogView = lazy(() => import('./views/AdminCatalogView'));
const AdminAttractionEditView = lazy(() => import('./views/AdminAttractionEditView'));
const AdminScheduleView = lazy(() => import('./views/AdminScheduleView'));
const AdminPosTerminalView = lazy(() => import('./views/AdminPosTerminalView'));
const AdminBookingListView = lazy(() => import('./views/AdminBookingListView'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CatalogProvider>
        <BookingProvider>
          <CartProvider>
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                
                <main className="flex-grow">
                  <Suspense fallback={
                    <div className="flex justify-center items-center h-96 bg-background">
                      <div className="flex flex-col items-center space-y-4">
                        <span className="material-symbols-outlined animate-spin text-5xl text-secondary">
                          progress_activity
                        </span>
                        <p className="text-sm font-semibold text-primary">Cargando HospédateEC...</p>
                      </div>
                    </div>
                  }>
                    <Routes>
                      {/* Rutas Públicas */}
                      <Route path="/" element={<HomeView />} />
                      <Route path="/explorar" element={<ExploreView />} />
                      <Route path="/attraction/:slug" element={<AttractionDetailView />} />
                      <Route path="/checkout" element={<CheckoutView />} />
                      <Route path="/login" element={<LoginView />} />
                      <Route path="/register" element={<RegisterView />} />

                      {/* Rutas Privadas Clientes */}
                      <Route element={<PrivateRoute />}>
                        <Route path="/portal" element={<CustomerPortalView />} />
                      </Route>

                      {/* Rutas Privadas Administrador */}
                      <Route element={<PrivateRoute requireAdmin={true} />}>
                        <Route path="/admin" element={<AdminDashboardView />} />
                        <Route path="/admin/catalog" element={<AdminCatalogView />} />
                        <Route path="/admin/catalog/new" element={<AdminAttractionEditView />} />
                        <Route path="/admin/catalog/edit/:id" element={<AdminAttractionEditView />} />
                        <Route path="/admin/schedule" element={<AdminScheduleView />} />
                        <Route path="/admin/pos" element={<AdminPosTerminalView />} />
                        <Route path="/admin/bookings" element={<AdminBookingListView />} />
                      </Route>

                      {/* Redirección por defecto */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </main>

                <Footer />
              </div>
            </BrowserRouter>
          </CartProvider>
        </BookingProvider>
      </CatalogProvider>
    </AuthProvider>
  );
};

export default App;
