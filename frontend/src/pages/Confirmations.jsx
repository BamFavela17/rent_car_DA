import React from "react";
import { Navigate } from "react-router-dom";
import CrudPage from "../components/CrudPage";
import axios from "axios";
import Toast from "../Toast.jsx";
import ConfirmationSkeleton from "../ConfirmationSkeleton";

const Confirmations = ({ user }) => {
  const [notification, setNotification] = React.useState(null);
  const fallbackImage = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800";

  if (!user || !['Administrador', 'Vendedor'].includes(user.cargo)) {
    return <Navigate to="/catalog" replace />;
  }

  const renderItemCard = (item, { refreshList }) => {
    const handleStatusUpdate = async (newStatus) => {
      try {
        // Enviamos el objeto completo para cumplir con las validaciones de la ruta PUT
        await axios.put(`/api/rentals/rentals/${item.id}`, {
          ...item,
          estado_alquiler: newStatus,
          empleado_id: user.id // El vendedor que aprueba toma la responsabilidad
        });
        setNotification({ message: `Alquiler ${newStatus === 'activo' ? 'aprobado' : 'rechazado'} con éxito`, type: "success" });
        refreshList(); // Actualiza los datos sin recargar la página completa
      } catch (err) {
        setNotification({ message: "Error al actualizar el estado", type: "error" });
      }
    };

    return (
      <div className="overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className="h-32 bg-slate-100 relative">
          <img 
            src={item.vehiculo_image_url || fallbackImage} 
            alt={item.vehiculo_marca}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className="px-3 py-1 bg-white/90 backdrop-blur text-indigo-600 rounded-full text-[10px] font-black uppercase">
              ${item.total}
            </span>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Solicitud Pendiente</span>
          <h3 className="text-lg font-bold text-slate-800">{item.cliente_nombre} {item.cliente_apellido}</h3>
            <p className="text-xs font-bold text-slate-400">{item.vehiculo_marca} {item.vehiculo_modelo} • {item.vehiculo_placa}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleStatusUpdate('activo')} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">
              Aprobar
            </button>
            <button onClick={() => handleStatusUpdate('cancelado')} className="flex-1 bg-rose-50 text-rose-600 py-2.5 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors">
              Rechazar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <CrudPage
      title="Confirmaciones"
      description="Gestiona las solicitudes de reserva realizadas por los clientes desde el catálogo."
      listEndpoint="/api/rentals/rentals"
      viewMode="grid"
      SkeletonComponent={ConfirmationSkeleton}
      skeletonCount={6}
      dataFilter={(item) => item.estado_alquiler === 'pendiente'}
      listColumns={["id", "cliente_nombre", "vehiculo_placa", "fecha_inicio", "total", "estado_alquiler"]}
      renderItemCard={renderItemCard}
      />
    </>
  );
};

export default Confirmations;