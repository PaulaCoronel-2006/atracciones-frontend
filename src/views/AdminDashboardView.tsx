import React, { useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useCatalog } from '../context/CatalogContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const AdminDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { bookings, slots, fetchManagementBookings } = useBooking();
  const { attractions, getSubcategoryById, deleteAttraction } = useCatalog();
  const { token } = useAuth();

  const handleDeleteAttraction = (id: string, name: string) => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No tienes una sesión activa o autorizada.',
        icon: 'error',
        confirmButtonColor: '#ba1a1a'
      });
      return;
    }

    Swal.fire({
      title: '¿Eliminar Experiencia?',
      text: `¿Estás seguro de que deseas eliminar la atracción "${name}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ba1a1a',
      cancelButtonColor: '#747782',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deleteAttraction(id, token);
          if (res.success) {
            Swal.fire({
              title: 'Eliminada',
              text: 'La atracción ha sido eliminada del catálogo.',
              icon: 'success',
              confirmButtonColor: '#0058bc'
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la atracción.',
              icon: 'error',
              confirmButtonColor: '#ba1a1a'
            });
          }
        } catch (error) {
          Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al intentar eliminar la atracción.',
            icon: 'error',
            confirmButtonColor: '#ba1a1a'
          });
        }
      }
    });
  };

  useEffect(() => {
    if (token) {
      fetchManagementBookings(token);
    }
  }, [token, fetchManagementBookings]);

  // Ingresos Netos
  const totalSales = useMemo(() => {
    const active = bookings.filter(b => b.statusName !== 'Cancelled' && b.statusName !== 'Cancelada');
    return active.reduce((sum, b) => sum + b.totalAmount, 0);
  }, [bookings]);

  // Cantidad de reservas
  const totalBookingsCount = bookings.length;

  // Atracciones publicadas y activas
  const activeAttractionsCount = useMemo(() => {
    return attractions.filter(a => a.is_active && a.is_published).length;
  }, [attractions]);

  // Ocupación promedio
  const averageOccupancy = useMemo(() => {
    const totalSlots = slots.length;
    if (totalSlots === 0) return 0;
    
    const totalCapacity = slots.reduce((sum, s) => sum + s.capacityTotal, 0);
    const totalAvailable = slots.reduce((sum, s) => sum + s.capacityAvailable, 0);
    const sold = totalCapacity - totalAvailable;
    
    if (totalCapacity === 0) return 0;
    return (sold / totalCapacity) * 100;
  }, [slots]);

  // Últimas 5 reservas
  const recentBookings = useMemo(() => {
    return bookings.slice(0, 5);
  }, [bookings]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 text-left">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-variant pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Panel de Administración</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary">Dashboard de Operaciones</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/admin/pos')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-secondary text-white hover:bg-secondary-container transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">point_of_sale</span>
            <span>Nueva Venta POS</span>
          </button>
        </div>
      </div>

      {/* Malla de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI Ventas */}
        <div className="bg-white rounded-2xl p-5 border border-surface-variant flex items-center justify-between relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-24 h-24 bg-success-green/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Ingresos Netos</span>
            <span className="text-2xl font-black text-primary">
              ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-success-green font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">update</span>
              <span>Tiempo real</span>
            </span>
          </div>
          <span className="material-symbols-outlined text-2xl p-3 bg-success-green/10 border border-success-green/20 text-success-green rounded-2xl">
            payments
          </span>
        </div>

        {/* KPI Reservas */}
        <div className="bg-white rounded-2xl p-5 border border-surface-variant flex items-center justify-between relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-24 h-24 bg-secondary/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Reservas Totales</span>
            <span className="text-2xl font-black text-primary">{totalBookingsCount}</span>
            <span className="text-[9px] text-secondary font-bold">Historial consolidado</span>
          </div>
          <span className="material-symbols-outlined text-2xl p-3 bg-secondary/10 border border-secondary/20 text-secondary rounded-2xl">
            local_activity
          </span>
        </div>

        {/* KPI Ocupación */}
        <div className="bg-white rounded-2xl p-5 border border-surface-variant flex items-center justify-between relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-24 h-24 bg-secondary-fixed-dim/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Ocupación Promedio</span>
            <span className="text-2xl font-black text-primary">{averageOccupancy.toFixed(1)}%</span>
            <span className="text-[9px] text-outline font-semibold">Uso total de slots</span>
          </div>
          <div className="relative w-12 h-12">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#f3f3f3" strokeWidth="4" fill="transparent"/>
              <circle cx="24" cy="24" r="20" stroke="#0058bc" strokeWidth="4" fill="transparent"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * averageOccupancy) / 100}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs text-secondary font-bold">
              <span className="material-symbols-outlined text-xs">trending_up</span>
            </span>
          </div>
        </div>

        {/* KPI Atracciones */}
        <div className="bg-white rounded-2xl p-5 border border-surface-variant flex items-center justify-between relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-24 h-24 bg-error/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Atracciones Activas</span>
            <span className="text-2xl font-black text-primary">{activeAttractionsCount}</span>
            <span className="text-[9px] text-outline font-semibold">De {attractions.length} registradas</span>
          </div>
          <span className="material-symbols-outlined text-2xl p-3 bg-error/10 border border-error/20 text-error rounded-2xl">
            bolt
          </span>
        </div>

      </div>

      {/* Enlaces de Gestión Rápida */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => navigate('/admin/pos')} 
          className="p-4 rounded-2xl border border-surface-variant bg-white hover:border-secondary text-center flex flex-col items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl text-secondary">point_of_sale</span>
          <span className="text-xs font-bold text-primary">Terminal POS</span>
        </button>

        <button 
          onClick={() => navigate('/admin/schedule')} 
          className="p-4 rounded-2xl border border-surface-variant bg-white hover:border-secondary text-center flex flex-col items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl text-secondary">calendar_today</span>
          <span className="text-xs font-bold text-primary">Gestión de Slots</span>
        </button>

        <button 
          onClick={() => navigate('/admin/bookings')} 
          className="p-4 rounded-2xl border border-surface-variant bg-white hover:border-secondary text-center flex flex-col items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl text-secondary">search</span>
          <span className="text-xs font-bold text-primary">Buscar Reservas</span>
        </button>

        <button 
          onClick={() => navigate('/admin/catalog')} 
          className="p-4 rounded-2xl border border-surface-variant bg-white hover:border-secondary text-center flex flex-col items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl text-secondary">folder_open</span>
          <span className="text-xs font-bold text-primary">Catálogo Global</span>
        </button>
      </div>

      {/* Reservas Recientes y Edición rápida */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Últimas Reservas (2 columnas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center justify-between border-b border-surface-variant pb-2">
            <span>Últimas Reservas Registradas</span>
            <Link to="/admin/bookings" className="text-[10px] text-secondary hover:underline font-bold">Ver todas →</Link>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-outline border-b border-surface-variant">
                  <th className="py-2.5">PNR</th>
                  <th>Atracción</th>
                  <th>Fecha Actividad</th>
                  <th>Total</th>
                  <th className="text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {recentBookings.map(b => (
                  <tr key={b.id} className="hover:bg-background transition-colors">
                    <td className="py-3 font-mono font-bold text-secondary">{b.pnrCode}</td>
                    <td className="font-semibold text-primary truncate max-w-[150px]">{b.attractionName}</td>
                    <td className="text-on-surface-variant">
                       {b.slotDate?.includes('-') ? b.slotDate.split('-').reverse().join('/') : (b.slotDate || 'Sin fecha')}
                    </td>
                    <td className="font-extrabold text-primary">
                      ${(b.totalAmount ?? 0).toFixed(2)}
                    </td>
                    <td className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusClass(b.statusName)}`}>
                        {b.statusName}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista rápida de atracciones (1 columna) */}
        <div className="bg-white rounded-2xl p-5 border border-surface-variant flex flex-col gap-4 shadow-sm">
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center justify-between border-b border-surface-variant pb-2">
            <span>Atracciones</span>
            <button 
              onClick={() => navigate('/admin/catalog/new')} 
              className="text-[10px] text-secondary hover:underline font-bold flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[10px]">add</span>
              <span>Nueva</span>
            </button>
          </h3>

          <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
            {attractions.map(a => (
              <div 
                key={a.id}
                className="p-3 rounded-xl bg-background border border-surface-variant flex items-center justify-between hover:border-outline transition-all text-xs mr-0.5"
              >
                <div className="flex flex-col text-left gap-0.5">
                  <span className="font-bold text-primary truncate w-32 md:w-40">{a.name}</span>
                  <span className="text-[10px] text-outline">Cat: {getSubcategoryById(a.subcategory_id)?.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(`/admin/catalog/edit/${a.id}`)}
                    className="p-1.5 rounded-lg bg-white border border-surface-variant hover:border-secondary hover:text-secondary text-outline transition-colors cursor-pointer flex items-center justify-center"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-xs">edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteAttraction(a.id, a.name)}
                    className="p-1.5 rounded-lg bg-white border border-surface-variant hover:border-error hover:text-error text-outline transition-colors cursor-pointer flex items-center justify-center"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                  </button>
                  <span 
                    className={`w-2.5 h-2.5 rounded-full ${
                      a.is_active && a.is_published ? 'bg-success-green animate-pulse' : 'bg-outline/40'
                    }`}
                    title={a.is_active && a.is_published ? 'Publicada y Activa' : 'Borrador o Pausada'}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboardView;
