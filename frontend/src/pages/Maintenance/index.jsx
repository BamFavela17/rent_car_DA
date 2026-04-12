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
    helpText: "Fecha de inicio del mantenimiento.",
  },
  {
    name: "fechafinal_mantenimiento",
    label: "Fecha final de mantenimiento",
    type: "date",
    required: true,
    helpText: "Fecha estimada de finalización del mantenimiento.",
  },
  {
    name: "fecha_proximo_mantenimiento",
    label: "Fecha del próximo mantenimiento",
    type: "date",
    required: true,
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
  "id",
  "vehiculo_id",
  "tipo_mantenimiento",
  "estado_mantenimiento",
  "fecha_mantenimiento",
  "fechafinal_mantenimiento",
  "fecha_proximo_mantenimiento",
];

const Maintenance = () => (
  <CrudPage
    title="Mantenimientos"
    description="Administra los registros de mantenimiento de los vehículos."
    instructions={[
      "Selecciona el vehículo y registra las fechas del servicio.",
      "Describe el tipo de mantenimiento y el trabajo a realizar.",
      "Indica el costo, estado, taller y responsable para un registro completo.",
      "Guarda el registro solo cuando todos los datos sean correctos.",
    ]}
    listEndpoint="/api/maintenance/maintenances"
    createEndpoint="/api/maintenance/createMaintenance"
    updateEndpoint="/api/maintenance/maintenances"
    deleteEndpoint="/api/maintenance/maintenances"
    fields={fields}
    listColumns={listColumns}
  />
);

export default Maintenance;
