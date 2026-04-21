import React from "react";
import CrudPage from "../components/CrudPage";

const fields = [
  { name: "placa", label: "Placa", required: true, placeholder: "ABC-123", fullWidth: false },
  { name: "marca", label: "Marca", required: true, placeholder: "Ej: Toyota" },
  { name: "modelo", label: "Modelo", required: true, placeholder: "Ej: Corolla" },
  { name: "year_car", label: "Año", type: "number", required: true, min: 1900 },
  { name: "color", label: "Color", required: true },
  { 
    name: "tipo", 
    label: "Tipo de Vehículo", 
    required: true, 
    options: [
      { label: "Sedan", value: "Sedan" },
      { label: "SUV", value: "SUV" },
      { label: "Hatchback", value: "Hatchback" },
      { label: "4x4", value: "4x4" },
      { label: "Van", value: "Van" },
    ] 
  },
  { name: "capacidad", label: "Capacidad (Pasajeros)", type: "number", required: true, min: 1 },
  { name: "tarifa_diaria", label: "Tarifa Diaria ($)", type: "number", step: "0.01", required: true },
  { 
    name: "estado", 
    label: "Disponibilidad", 
    type: "boolean", 
    defaultValue: "true",
    helpText: "Indica si el vehículo está listo para ser rentado." 
  },
];

const listColumns = [
  "placa",
  "marca",
  "modelo",
  "year_car",
  "tipo",
  "tarifa_diaria",
  "estado"
];

const Cars = () => {
  return (
    <CrudPage
      title="Vehículos"
      description="Administra la flota de vehículos, tarifas y disponibilidad en tiempo real."
      instructions={[
        "Registra nuevos vehículos con sus especificaciones técnicas.",
        "Actualiza las tarifas diarias según la temporada o demanda.",
        "Cambia el estado de disponibilidad manualmente si es necesario.",
        "Exporta la lista completa para control de inventario."
      ]}
      listEndpoint="/api/cars/cars"
      createEndpoint="/api/cars/cars"
      updateEndpoint="/api/cars/cars"
      deleteEndpoint="/api/cars/cars"
      bulkEndpoint="/api/auth/bulk-vehicles"
      fields={fields}
      listColumns={listColumns}
      viewMode="grid"
      renderItemCard={(item, { openModal, handleDelete, formatCellValue, StatusBadge }) => (
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <StatusBadge value={item.estado} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">{item.marca} {item.modelo}</h3>
            <p className="text-sm font-bold text-indigo-500 tracking-widest">{item.placa}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {item.tipo}</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {item.year_car}</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" /> {item.capacidad} asientos</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-[10px] uppercase font-black text-slate-400">Tarifa Diaria</p>
              <p className="text-xl font-black text-slate-900">{formatCellValue('tarifa_diaria', item.tarifa_diaria)}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    />
  );
};

export default Cars;
