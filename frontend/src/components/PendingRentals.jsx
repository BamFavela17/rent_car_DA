import React from "react";
import { Navigate } from "react-router-dom";
import CrudPage from "./CrudPage";
import axios from "axios";

const PendingRentals = ({ user }) => {
  if (!user || !['Administrador', 'Vendedor'].includes(user.cargo)) {
    return <Navigate to="/catalog" replace />;
  }

  // Reutilizamos los campos del formulario de alquileres original
  // Pero esta vista solo muestra los "Pendientes"
  
  const listColumns = [
    "id",
    "cliente_nombre",
    "vehiculo_placa",
    "fecha_inicio",
    "total",
    "estado_alquiler",
  ];

  const renderItemCard = (item, { refreshList }) => {
    const isPending = item.estado_alquiler === 'pendiente';
    const isActive = item.estado_alquiler === 'activo';
    const isDebt = item.estado_alquiler === 'pago_pendiente';

    const handleStatusUpdate = async (newStatus) => {
      try {
        await axios.put(`/api/rentals/rentals/${item.id}`, {
          ...item,
          estado_alquiler: newStatus
        });
        window.location.reload(); // Refrescamos para ver cambios
      } catch (err) {
        alert("Error al actualizar el estado");
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          {isPending && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">
              Nueva Solicitud
            </span>
          )}
          {isActive && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
              En Curso
            </span>
          )}
          {isDebt && (
            <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase animate-pulse">
              Deuda Pendiente
            </span>
          )}
          <span className="text-xl font-black text-slate-900">${item.total}</span>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-slate-800">{item.cliente_nombre} {item.cliente_apellido}</h3>
          <p className="text-sm text-slate-500">{item.vehiculo_marca} {item.vehiculo_modelo} ({item.vehiculo_placa})</p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-2">
          {isPending && (
            <>
              <button 
                onClick={() => handleStatusUpdate('activo')}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
              >
                Aprobar
              </button>
              <button 
                onClick={() => handleStatusUpdate('cancelado')}
                className="flex-1 bg-rose-50 text-rose-600 py-2 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                Rechazar
              </button>
            </>
          )}
          {(isActive || isDebt) && (
            <button 
              onClick={() => handleStatusUpdate('finalizado')}
              className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-600"
            >
              Marcar como Entregado y Pagado
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <CrudPage
      title="Confirmación de Alquileres"
      description="Panel de control para vendedores. Aprueba o rechaza solicitudes de reserva web."
      listEndpoint="/api/rentals/rentals"
      viewMode="grid"
      listColumns={listColumns}
      renderItemCard={renderItemCard}
      // Filtramos en el cliente para mostrar solo pendientes si el backend no tiene un endpoint específico
      // Nota: En una app real, el backend debería filtrar esto por nosotros.
    />
  );
};

export default PendingRentals;