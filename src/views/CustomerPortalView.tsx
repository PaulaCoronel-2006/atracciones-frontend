import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking, BookingResponse } from '../context/BookingContext';
import Swal from 'sweetalert2';

const CustomerPortalView: React.FC = () => {
  const { user, token, updateProfile, changePassword } = useAuth();
  const { bookings, fetchMisReservas, cancelBooking } = useBooking();

  const [activeTab, setActiveTab] = useState<'reservas' | 'perfil'>('reservas');
  const [expandedBookingId, setExpandedBookingId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de edición de perfil
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Estados de cambio de contraseña
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      fetchMisReservas(token).finally(() => setIsLoading(false));
    }
  }, [token]);

  const toggleExpand = (id: string) => {
    setExpandedBookingId(prev => prev === id ? '' : id);
  };

  const handleCancel = (booking: BookingResponse) => {
    Swal.fire({
      title: '¿Cancelar esta Reserva?',
      text: `Se liberarán los cupos de esta reserva. Por favor, especifica el motivo:`,
      input: 'text',
      inputPlaceholder: 'Ej: Cambio de planes de vuelo...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#747782',
      confirmButtonText: 'Sí, cancelar reserva',
      cancelButtonText: 'Volver',
      inputValidator: (value) => {
        if (!value) {
          return '¡Es obligatorio escribir un motivo para cancelar!';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed && token) {
        const reason = result.value;
        const res = await cancelBooking(booking.id, reason, token);
        
        if (res.success) {
          Swal.fire({
            title: 'Reserva Cancelada',
            text: 'La reserva ha sido cancelada con éxito y el inventario ha sido actualizado.',
            icon: 'success',
            confirmButtonColor: '#0058bc'
          });
          // Recargar reservas
          fetchMisReservas(token);
        } else {
          Swal.fire({
            title: 'Error',
            text: res.message || 'No se pudo cancelar la reserva.',
            icon: 'error',
            confirmButtonColor: '#ba1a1a'
          });
        }
      }
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await updateProfile({ firstName, lastName, phone, location });
      if (res.success) {
        Swal.fire({
          title: 'Perfil Actualizado',
          text: 'Tus datos personales se han modificado de forma correcta.',
          icon: 'success',
          confirmButtonColor: '#0058bc'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: res.message || 'Ocurrió un error al actualizar el perfil.',
          icon: 'error',
          confirmButtonColor: '#ba1a1a'
        });
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'Error',
        text: 'La nueva contraseña y su confirmación no coinciden.',
        icon: 'error',
        confirmButtonColor: '#ba1a1a'
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        Swal.fire({
          title: 'Contraseña Actualizada',
          text: 'Tu contraseña de acceso ha sido actualizada con éxito.',
          icon: 'success',
          confirmButtonColor: '#0058bc'
        });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Verifica tu contraseña actual.',
          icon: 'error',
          confirmButtonColor: '#ba1a1a'
        });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 text-left">
      
      {/* Columna Menú Lateral */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
        {/* Ficha Perfil Rapida */}
        <div className="bg-white border border-surface-variant rounded-2xl p-5 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-3">
            <span className="material-symbols-outlined text-3xl">account_circle</span>
          </div>
          <h2 className="font-extrabold text-primary text-base">
            {user?.firstName} {user?.lastName}
          </h2>
          <span className="text-xs text-outline font-semibold uppercase tracking-wider mt-0.5">
            {user?.role === 'Client' ? 'Cliente' : user?.role}
          </span>
        </div>

        {/* Botones de Navegación de Pestañas */}
        <div className="bg-white border border-surface-variant rounded-2xl p-2.5 shadow-sm flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('reservas')}
            className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'reservas' 
                ? 'bg-secondary text-white' 
                : 'hover:bg-background text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-lg">confirmation_number</span>
            <span>Historial de Reservas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'perfil' 
                ? 'bg-secondary text-white' 
                : 'hover:bg-background text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-lg">manage_accounts</span>
            <span>Mi Perfil & Seguridad</span>
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-grow">
        
        {/* PESTAÑA RESERVAS */}
        {activeTab === 'reservas' && (
          <div className="flex flex-col gap-6">
            <div className="border-b border-surface-variant pb-3">
              <h2 className="text-lg font-bold text-primary uppercase tracking-wider">Mis Reservas y Actividades</h2>
            </div>

            {isLoading && (
              <div className="bg-white rounded-2xl p-16 text-center border border-surface-variant flex flex-col items-center justify-center gap-3 shadow-sm">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mb-2"></div>
                <h3 className="text-primary font-bold text-base">Cargando reservas...</h3>
              </div>
            )}

            {!isLoading && bookings.length === 0 && (
              <div className="bg-white rounded-2xl p-16 text-center border border-surface-variant shadow-sm">
                <span className="material-symbols-outlined text-5xl text-outline mb-2">confirmation_number</span>
                <h3 className="text-primary font-bold text-lg">Aún no tienes reservas</h3>
                <p className="text-on-surface-variant text-sm mt-1">Explora nuestro catálogo para reservar tu primera experiencia.</p>
              </div>
            )}

            {!isLoading && bookings.length > 0 && (
              <div className="flex flex-col gap-4">
                {bookings.map(booking => {
                  const isExpanded = expandedBookingId === booking.id;
                  
                  // Color del Badge del estado
                  let badgeClass = 'bg-surface-variant text-primary border-outline-variant';
                  if (booking.statusName === 'Confirmed' || booking.statusName === 'Confirmada') {
                    badgeClass = 'bg-success-green/10 text-success-green border border-success-green/20';
                  } else if (booking.statusName === 'Completed' || booking.statusName === 'Completada') {
                    badgeClass = 'bg-secondary/10 text-secondary border border-secondary/20';
                  } else if (booking.statusName === 'Cancelled' || booking.statusName === 'Cancelada') {
                    badgeClass = 'bg-error/10 text-error border border-error/20';
                  }

                  return (
                    <div 
                      key={booking.id}
                      className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
                        isExpanded ? 'border-secondary' : 'border-surface-variant hover:border-outline'
                      }`}
                    >
                      {/* Cabecera de la Reserva */}
                      <div 
                        onClick={() => toggleExpand(booking.id)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-3xl text-secondary">local_activity</span>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm md:text-base text-primary">{booking.attractionName}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-surface-variant text-outline font-bold">
                                PNR: {booking.pnrCode}
                              </span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant font-semibold">Reserva Digital HospédateEC</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between md:justify-end border-t border-surface-variant md:border-none pt-3 md:pt-0">
                          <div className="flex flex-col text-right pr-4 border-r border-surface-variant">
                            <span className="text-[9px] text-outline uppercase font-semibold">Fecha de Viaje</span>
                            <span className="text-xs font-bold text-primary">
                              {booking.slotDate.split('-').reverse().join('/')} a las {booking.slotStartTime} hs
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                              {booking.statusName}
                            </span>
                            <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                              expand_more
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contenido Expandible */}
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-surface-variant pt-4 flex flex-col gap-4">
                          
                          {/* Pasajeros */}
                          <div>
                            <h4 className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2">Pasajeros Vinculados</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {booking.passengers?.map((p, pIdx) => (
                                <div 
                                  key={pIdx}
                                  className="p-3 rounded-xl bg-background border border-surface-variant text-xs flex flex-col gap-1 text-left"
                                >
                                  <div className="font-bold text-primary">{p.fullName || `${p.firstName} ${p.lastName}`}</div>
                                  <div className="flex justify-between text-outline text-[10px] font-semibold">
                                    <span>Doc: {p.documentNumber}</span>
                                    <span className="text-secondary">{p.priceTierLabel || p.ticketCategoryName}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Facturación y Total */}
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-3.5 rounded-xl bg-background border border-surface-variant text-xs">
                            <div className="flex flex-col gap-1 text-left">
                              <span className="text-[10px] text-outline font-semibold uppercase">Método de Reserva</span>
                              <span className="text-primary font-semibold">Web Checkout HospédateEC</span>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col text-right">
                                <span className="text-[9px] text-outline font-semibold">TOTAL FACTURADO</span>
                                <span className="font-black text-sm text-primary">
                                  ${booking.totalAmount.toFixed(2)} {booking.currencyCode || 'USD'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Motivo de cancelación */}
                          {booking.statusName === 'Cancelled' && booking.notes && (
                            <div className="p-3 rounded-xl bg-error/5 border border-error/20 text-xs text-error text-left italic">
                              <strong>Notas / Motivo de Cancelación:</strong> "{booking.notes}"
                            </div>
                          )}

                          {/* Acciones */}
                          {booking.statusName === 'Confirmed' && (
                            <div className="flex justify-end gap-3 border-t border-surface-variant pt-4 mt-2">
                              <button 
                                type="button"
                                onClick={() => handleCancel(booking)}
                                className="px-4 py-2 rounded-xl text-xs font-bold bg-error/10 hover:bg-error/20 text-error border border-error/20 transition-all cursor-pointer active:scale-95"
                              >
                                Cancelar Reserva
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA PERFIL Y SEGURIDAD */}
        {activeTab === 'perfil' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Datos Personales */}
            <div className="bg-white border border-surface-variant rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-surface-variant pb-2">
                Datos Personales
              </h3>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-outline font-semibold">Nombre</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-outline font-semibold">Apellido</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm focus:outline-none focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-outline font-semibold">Teléfono Celular</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-outline font-semibold">Ubicación / Ciudad</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm focus:outline-none focus:border-secondary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-3 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer disabled:opacity-50 active:scale-95 text-xs shadow-sm"
                >
                  {isUpdatingProfile ? 'Guardando Cambios...' : 'Guardar Cambios'}
                </button>
              </form>
            </div>

            {/* Cambio de Contraseña */}
            <div className="bg-white border border-surface-variant rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-surface-variant pb-2">
                Seguridad de la Cuenta
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-outline font-semibold">Contraseña Actual</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-outline font-semibold">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm focus:outline-none focus:border-secondary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-outline font-semibold">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="px-4 py-2.5 rounded-xl bg-background border border-outline-variant text-sm focus:outline-none focus:border-secondary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-3 rounded-xl font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer disabled:opacity-50 active:scale-95 text-xs shadow-sm"
                >
                  {isUpdatingPassword ? 'Actualizando Contraseña...' : 'Actualizar Contraseña'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default CustomerPortalView;
