import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBooking, BookingResponse } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const AdminBookingListView: React.FC = () => {
  const { bookings, cancelBooking, fetchManagementBookings } = useBooking();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchManagementBookings(token);
    }
  }, [token]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [expandedBookingId, setExpandedBookingId] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedBookingId(prev => prev === id ? '' : id);
  };

  const getStatusClass = (statusName: string) => {
    switch (statusName) {
      case 'Confirmed':
      case 'Confirmada':
        return 'bg-success-green/10 text-success-green border border-success-green/20';
      case 'Completed':
      case 'Completada':
        return 'bg-secondary/10 text-secondary border border-secondary/20';
      case 'Cancelled':
      case 'Cancelada':
        return 'bg-error/10 text-error border border-error/20';
      default:
        return 'bg-surface-variant text-outline border border-outline-variant';
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Filtro por Estado
      if (selectedStatusFilter !== 'all') {
        const statusLower = (b.statusName || '').toLowerCase();
        if (selectedStatusFilter === 'confirmed' && !statusLower.includes('confirm')) return false;
        if (selectedStatusFilter === 'completed' && !statusLower.includes('complet')) return false;
        if (selectedStatusFilter === 'cancelled' && !statusLower.includes('cancel')) return false;
      }

      // Filtro por buscador (PNR, pasajero, atracción)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPnr = (b.pnrCode || '').toLowerCase().includes(q);
        const matchAttr = (b.attractionName || '').toLowerCase().includes(q);
        const matchPassenger = b.passengers?.some(p => 
          `${p.firstName || ''} ${p.lastName || ''} ${p.fullName || ''}`.toLowerCase().includes(q)
        ) || false;

        return matchPnr || matchAttr || matchPassenger;
      }

      return true;
    });
  }, [bookings, selectedStatusFilter, searchQuery]);

  const handleCancel = (booking: BookingResponse) => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'Debes tener una sesión administrativa activa para realizar esta acción.',
        icon: 'error',
        confirmButtonColor: '#ba1a1a'
      });
      return;
    }

    Swal.fire({
      title: '¿Cancelar esta Reserva?',
      text: `Se liberarán los cupos correspondientes. Por favor, escribe el motivo de la cancelación administrativa:`,
      input: 'text',
      inputPlaceholder: 'Ej: Cancelación solicitada por el cliente...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#747782',
      confirmButtonText: 'Sí, cancelar y liberar',
      cancelButtonText: 'Volver',
      inputValidator: (value) => {
        if (!value) {
          return '¡Es obligatorio indicar un motivo!';
        }
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const reason = result.value;
        const res = await cancelBooking(booking.id, reason, token);
        if (res.success) {
          Swal.fire({
            title: 'Reserva Cancelada',
            text: 'La reserva ha sido anulada y los cupos de disponibilidad fueron devueltos con éxito.',
            icon: 'success',
            confirmButtonColor: '#0058bc'
          });
          fetchManagementBookings(token);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 text-left">
      
      {/* Encabezado */}
      <div className="flex flex-col gap-1 border-b border-surface-variant pb-4">
        <Link to="/admin" className="text-xs font-bold text-secondary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          <span>Volver al Dashboard</span>
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">Buscador y Control de Reservas</h1>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-surface-variant flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Buscador */}
        <div className="flex items-center rounded-xl bg-background border border-outline-variant px-3 py-1.5 w-full md:max-w-sm focus-within:border-secondary">
          <span className="material-symbols-outlined text-outline text-lg">search</span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por PNR, pasajero o atracción..." 
            className="w-full bg-transparent border-none text-primary text-xs pl-2 py-1 placeholder-outline focus:outline-none"
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'confirmed', label: 'Confirmadas' },
            { id: 'completed', label: 'Completadas' },
            { id: 'cancelled', label: 'Canceladas' }
          ].map(f => (
            <button 
              key={f.id}
              onClick={() => setSelectedStatusFilter(f.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                selectedStatusFilter === f.id
                  ? 'bg-secondary text-white border-secondary shadow-sm'
                  : 'bg-background border-surface-variant text-outline hover:border-outline'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listado */}
      <div className="flex flex-col gap-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-surface-variant text-outline text-xs shadow-sm">
            No se encontraron reservas que coincidan con los filtros de búsqueda.
          </div>
        ) : (
          filteredBookings.map(booking => {
            const isExpanded = expandedBookingId === booking.id;
            
            return (
              <div 
                key={booking.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
                  isExpanded ? 'border-secondary' : 'border-surface-variant hover:border-outline'
                }`}
              >
                {/* Cabecera Item */}
                <div 
                  onClick={() => toggleExpand(booking.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-secondary text-2xl">local_activity</span>
                    <div className="flex flex-col text-left gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-secondary font-mono uppercase tracking-wider">
                          {booking.pnrCode}
                        </span>
                        <span className="font-bold text-primary truncate w-40 md:w-56">{booking.attractionName}</span>
                      </div>
                      <span className="text-[10px] text-outline font-semibold">Reserva Digital HospédateEC</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5 border-t border-surface-variant md:border-none pt-3 md:pt-0">
                    <div className="flex flex-col text-right pr-4 border-r border-surface-variant">
                      <span className="text-[8px] text-outline uppercase font-semibold">Actividad programada</span>
                      <span className="font-bold text-primary">
                        {booking.slotDate.split('-').reverse().join('/')} | {booking.slotStartTime} hs
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusClass(booking.statusName)}`}>
                        {booking.statusName}
                      </span>
                      <span className={`material-symbols-outlined text-outline transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalles desplegados */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-surface-variant pt-4 flex flex-col gap-4 text-xs">
                    
                    {/* Pasajeros */}
                    <div>
                      <h4 className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Pasajeros Facturados</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {booking.passengers?.map((p, pIdx) => (
                          <div 
                            key={pIdx}
                            className="p-3 rounded-xl bg-background border border-surface-variant flex flex-col gap-1 text-left"
                          >
                            <div className="font-bold text-primary">{p.fullName || `${p.firstName} ${p.lastName}`}</div>
                            <div className="flex justify-between text-[10px] text-outline font-semibold">
                              <span>Doc: {p.documentNumber}</span>
                              <span className="text-secondary">{p.priceTierLabel || p.ticketCategoryName} (${(p.unitPrice || 0).toFixed(2)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bitácora de cobro */}
                    <div className="p-3.5 rounded-xl bg-background border border-surface-variant grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="flex flex-col text-left gap-0.5">
                        <span className="text-[9px] text-outline font-semibold uppercase">Notas de la Reserva</span>
                        <p className="text-primary italic">"{booking.notes || 'Sin observaciones.'}"</p>
                      </div>

                      <div className="flex flex-col text-left gap-0.5 border-l border-surface-variant pl-4">
                        <span className="text-[9px] text-outline font-semibold uppercase">ID de Cliente</span>
                        <span className="text-primary font-semibold truncate max-w-[150px]">{booking.userId || 'Taquilla / POS'}</span>
                      </div>

                      <div className="flex flex-col text-right border-l border-surface-variant pl-4">
                        <span className="text-[9px] text-outline font-semibold uppercase">Importe Facturado</span>
                        <span className="font-black text-sm text-primary">
                          ${booking.totalAmount.toFixed(2)} {booking.currencyCode || 'USD'}
                        </span>
                      </div>
                    </div>

                    {/* Si está cancelado, mostrar motivo */}
                    {booking.statusName === 'Cancelled' && booking.notes && (
                      <div className="p-3 rounded-xl bg-error/5 border border-error/20 text-left text-error italic">
                        <strong>Motivo de Cancelación:</strong> "{booking.notes}"
                      </div>
                    )}

                    {/* Acciones administrativas */}
                    {(booking.statusName === 'Confirmed' || booking.statusName === 'Confirmada') && (
                      <div className="flex justify-end border-t border-surface-variant pt-4 mt-2">
                        <button 
                          onClick={() => handleCancel(booking)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-error/10 hover:bg-error/20 text-error border border-error/20 transition-all cursor-pointer active:scale-95"
                        >
                          Cancelar y Liberar Cupos
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default AdminBookingListView;
