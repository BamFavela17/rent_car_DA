import React, { useState } from "react";
import CrudPage from "../../components/CrudPage";

const PendingByPeriod = ({ user }) => {
  const [period, setPeriod] = useState("day");
  const [status, setStatus] = useState(""); // "" significa "Todos"

  const listColumns = [
    { name: "id", label: "ID" },
    { name: "cliente_nombre", label: "Cliente", render: (row) => `${row.cliente_nombre} ${row.cliente_apellido}` },
    { name: "vehiculo_placa", label: "Placa" },
    { name: "fecha_inicio", label: "Fecha Inicio" },
    { name: "total", label: "Total" },
    { name: "estado_alquiler", label: "Estado" },
  ];

  const periods = [
    { id: "day", label: "Hoy" },
    { id: "week", label: "Esta Semana" },
    { id: "month", label: "Este Mes" },
  ];

  const statuses = [
    { id: "", label: "Todos" },
    { id: "activo", label: "Activos" },
    { id: "pendiente", label: "Pendientes" },
    { id: "finalizado", label: "Finalizados" },
    { id: "cancelado", label: "Cancelados" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Agenda de Alquileres</h1>
            <p className="text-gray-500">Consulta el cronograma filtrando por tiempo y estado de contrato.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Filtro de Periodo */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    period === p.id 
                      ? "bg-indigo-600 text-white shadow-md" 
                      : "text-gray-500 hover:text-indigo-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Filtro de Estado */}
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              {statuses.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    status === s.id 
                      ? "bg-slate-800 text-white shadow-md" 
                      : "text-gray-500 hover:text-slate-800"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <CrudPage
            key={`${period}-${status}`} // Forzamos re-render al cambiar cualquier filtro
            title={`Resultados: ${periods.find(p => p.id === period).label} ${status ? `(${status})` : "(Todos)"}`}
            listEndpoint={`/api/rentals/rentals?period=${period}${status ? `&status=${status}` : ""}`}
            listColumns={listColumns}
            // Deshabilitamos creación/edición si solo queremos que sea una vista de consulta
            hideCreate={true} 
            hideEdit={user?.cargo === 'Cliente'}
            hideDelete={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PendingByPeriod;