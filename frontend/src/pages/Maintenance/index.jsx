import React from "react";
import CrudPage from "../../components/CrudPage";

const fields = [
  {
    name: "vehiculo_id",
    label: "Vehículo",
    type: "number",
    valueType: "number",
    required: true,
    optionsEndpoint: "/api/cars/cars",
    optionLabel: "placa",
    optionValue: "id",
    helpText: "Selecciona el vehículo que recibirá el mantenimiento.",
  },
  {
    name: "fecha_mantenimiento",
    label: "Fecha de mantenimiento",
    type: "date",
    required: true,
    defaultValue: () => new Date().toISOString().split('T')[0],
    helpText: "Fecha de inicio del mantenimiento.",
  },
  {
    name: "fechafinal_mantenimiento",
    label: "Fecha final de mantenimiento",
    type: "date",
    required: true,
    defaultValue: () => new Date().toISOString().split('T')[0],
    helpText: "Fecha estimada de finalización del mantenimiento.",
  },
  {
    name: "fecha_proximo_mantenimiento",
    label: "Fecha del próximo mantenimiento",
    type: "date",
    required: true,
    defaultValue: () => new Date().toISOString().split('T')[0],
    helpText: "Fecha recomendada para el siguiente mantenimiento.",
  },
  {
    name: "tipo_mantenimiento",
    label: "Tipo de mantenimiento",
    placeholder: "Preventivo",
    required: true,
    helpText: "Indica si es preventivo, correctivo u otro.",
  },
  {
    name: "descripcion",
    label: "Descripción",
    type: "textarea",
    placeholder: "Detalles del servicio",
    fullWidth: true,
    required: true,
    helpText: "Describe el trabajo realizado o programado.",
  },
  {
    name: "costo",
    label: "Costo",
    type: "number",
    step: "0.01",
    placeholder: "150.00",
    required: true,
    helpText: "Costo total del servicio.",
  },
  {
    name: "estado_mantenimiento",
    label: "Estado del mantenimiento",
    required: true,
    defaultValue: "pendiente",
    options: [
      { label: "Pendiente", value: "pendiente" },
      { label: "En servicio", value: "en servicio" },
      { label: "Completado", value: "completado" },
      { label: "Cancelado", value: "cancelado" },
    ],
    helpText: "Selecciona el estado del servicio. El vehículo solo estará bloqueado si está pendiente o en servicio.",
  },
  {
    name: "taller",
    label: "Taller",
    placeholder: "Taller ABC",
    required: true,
    helpText: "Nombre del taller o taller interno responsable.",
  },
  {
    name: "responsable",
    label: "Responsable",
    placeholder: "Mecánico",
    required: true,
    helpText: "Persona que está a cargo del servicio.",
  },
];

const listColumns = [
  { name: "id", label: "ID" },
  { name: "vehiculo_id", label: "Vehículo ID" },
  { name: "tipo_mantenimiento", label: "Tipo" },
  { name: "estado_mantenimiento", label: "Estado" },
  { name: "fecha_mantenimiento", label: "Inicio" },
  { name: "fechafinal_mantenimiento", label: "Fin" },
  { name: "fecha_proximo_mantenimiento", label: "Próxima Cita" },
];

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-1 sm:p-4">
            <CrudPage
              title="Control de Mantenimiento"
              description="Seguimiento detallado de servicios preventivos y correctivos de la flota."
              instructions={[
                "Selecciona el vehículo y registra las fechas del servicio.",
                "Describe el tipo de mantenimiento y el trabajo realizado.",
                "Registra costos y responsables para auditorías internas.",
                "El sistema liberará el vehículo automáticamente al completar el servicio.",
              ]}
              listEndpoint="/api/maintenance/maintenances"
              createEndpoint="/api/maintenance/createMaintenance"
              updateEndpoint="/api/maintenance/maintenances"
              deleteEndpoint="/api/maintenance/maintenances"
              bulkEndpoint="/api/auth/bulk-maintenance"
              fields={fields}
              listColumns={listColumns}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
