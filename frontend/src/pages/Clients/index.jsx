import React from "react";
import CrudPage from "../../components/CrudPage";

const fields = [
  {
    name: "tipo_identificacion",
    label: "Tipo de identificación",
    disabledOnEdit: true,
    required: true,
    options: [
      { label: "Cédula de Ciudadanía", value: "CC" },
      { label: "Cédula de Extranjería", value: "CE" },
      { label: "Pasaporte", value: "Pasaporte" },
    ],
  },
  {
    name: "numero_identificacion",
    label: "Número de identificación",
    placeholder: "123456789",
    disabledOnEdit: true,
    required: true,
  },
  { name: "nombre", label: "Nombre", placeholder: "Juan", required: true },
  { name: "apellido", label: "Apellido", placeholder: "Pérez", required: true },
  { name: "email", label: "Email", type: "email", placeholder: "juan@mail.com", required: true },
  { name: "telefono", label: "Teléfono", placeholder: "3001234567", required: true },
  { name: "direccion", label: "Dirección", placeholder: "Calle 123", required: true },
  {
    name: "fecha_nacimiento",
    label: "Fecha de nacimiento",
    type: "date",
    required: true,
    helpText: "El cliente debe ser mayor de edad para alquilar un vehículo.",
  },
  {
    name: "licencia_conduccion",
    label: "Licencia de conducción",
    placeholder: "LIC123",
    required: true,
  },
  {
    name: "fecha_vencimiento_licencia",
    label: "Vencimiento de licencia",
    type: "date",
    required: true,
    helpText: "Verifica que la licencia no esté vencida al momento del registro.",
  },
];

const listColumns = [
  "id",
  "tipo_identificacion",
  "numero_identificacion",
  "nombre",
  "apellido",
  "email",
  "telefono",
  "direccion",
  "fecha_nacimiento",
  "licencia_conduccion",
  "fecha_vencimiento_licencia",
];

const Clients = () => (
  <CrudPage
    title="Clientes"
    description="Gestiona la base de datos de clientes, sus licencias y datos de contacto."
    instructions={[
      "Registra la información personal del cliente verificando sus documentos.",
      "Es obligatorio incluir el correo electrónico para el envío de contratos.",
      "Asegúrate de que la fecha de vencimiento de la licencia sea posterior a la fecha actual.",
    ]}
    listEndpoint="/api/clients/clients"
    createEndpoint="/api/clients/clients"
    updateEndpoint="/api/clients/clients"
    deleteEndpoint="/api/clients/clients"
    bulkEndpoint="/api/auth/bulk-register"
    fields={fields}
    listColumns={listColumns}
    viewMode="grid"
    modalScrollable={true}
    renderItemCard={(item, { openModal, handleDelete, formatCellValue }) => {
      const isExpired = item.fecha_vencimiento_licencia && new Date(item.fecha_vencimiento_licencia) < new Date();
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                {item.tipo_identificacion}
              </span>
              {isExpired ? (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-600 border border-rose-200">
                  Licencia Vencida
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-600">
                  Licencia Vigente
                </span>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-tight">{item.nombre} {item.apellido}</h3>
            <p className="text-sm font-bold text-blue-500 tracking-wide">{item.numero_identificacion}</p>
          </div>
          <div className="space-y-2 border-t border-slate-50 pt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 012 2H5a2 2 0 01-2-2z" /></svg>
              {item.email}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {item.telefono}
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold ${isExpired ? 'text-rose-600' : 'text-slate-500'}`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.333 0 4 1 4 3" /></svg>
              Licencia: {item.licencia_conduccion} ({formatCellValue('fecha_vencimiento_licencia', item.fecha_vencimiento_licencia)})
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <div className="flex gap-1">
              <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      );
    }}
  />
);

export default Clients;
