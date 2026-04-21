import React from "react";
import CrudPage from "../../components/CrudPage";

const fields = [
  {
    name: "cliente_id",
    label: "Cliente",
    type: "number",
    valueType: "number",
    required: true,
    optionsEndpoint: "/api/clients/clients",
    optionLabel: "nombre apellido",
    optionValue: "id",
    helpText: "Selecciona el cliente que realizará el alquiler.",
  },
  {
    name: "vehiculo_id",
    label: "Vehículo",
    type: "number",
    valueType: "number",
    required: true,
    optionsEndpoint: "/api/cars/cars",
    optionLabel: "placa marca",
    optionValue: "id",
    helpText: "Selecciona el vehículo para que se use su tarifa diaria en el cálculo.",
    optionsFilter: (option) => option.estado === true || String(option.estado) === "true",
  },
  {
    name: "empleado_id",
    label: "Empleado",
    type: "number",
    valueType: "number",
    required: true,
    optionsEndpoint: "/api/employees/users",
    optionLabel: "nombre apellido",
    optionValue: "id",
    helpText: "El empleado responsable del contrato de alquiler.",
  },
  {
    name: "fecha_inicio",
    label: "Fecha de inicio",
    type: "date",
    required: true,
    defaultValue: () => new Date().toISOString().split('T')[0],
    helpText: "Fecha en que comienza el alquiler.",
  },
  {
    name: "hora_inicio",
    label: "Hora de inicio",
    type: "time",
    required: true,
    defaultValue: () => new Date().toTimeString().slice(0, 5),
    helpText: "Hora en la que inicia el alquiler.",
  },
  {
    name: "fecha_fin",
    label: "Fecha de fin",
    type: "date",
    required: true,
    defaultValue: () => new Date().toISOString().split('T')[0],
    helpText: "Fecha en que finaliza el alquiler.",
  },
  {
    name: "hora_fin",
    label: "Hora de fin",
    type: "time",
    required: true,
    defaultValue: () => new Date().toTimeString().slice(0, 5),
    helpText: "Hora en la que termina el alquiler.",
  },
  {
    name: "tarifa_diaria",
    label: "Tarifa diaria",
    type: "number",
    readOnly: true,
    computed: true,
    helpText: "Precio por día del vehículo seleccionado.",
    compute: (formData, helpers) => {
      const vehicle = helpers.getOptionByValue("vehiculo_id", formData.vehiculo_id);
      if (!vehicle) return "";
      const tarifa = Number(vehicle.tarifa_diaria ?? vehicle.tarifa_diaria ?? 0);
      return tarifa ? Number(tarifa.toFixed(2)) : "";
    },
  },
  
  {
    name: "kilometraje_inicio",
    label: "Kilometraje inicial",
    type: "number",
    placeholder: "0",
    required: true,
    helpText: "Kilometraje del vehículo al inicio del alquiler.",
  },
  {
    name: "dias_alquiler",
    label: "Días de alquiler",
    type: "number",
    readOnly: true,
    computed: true,
    helpText: "Cantidad de días calculada automáticamente según fechas de inicio y fin.",
    compute: (formData, helpers) => {
      return helpers.calculateRentalDays(
        formData.fecha_inicio,
        formData.hora_inicio,
        formData.fecha_fin,
        formData.hora_fin,
      ) || "";
    },
  },
  {
    name: "kilometraje_fin",
    label: "Kilometraje final",
    type: "number",
    placeholder: "0",
    required: true,
    helpText: "Kilometraje del vehículo al finalizar el alquiler.",
  },
  {
    name: "total",
    label: "Total",
    type: "number",
    step: "0.01",
    placeholder: "0.00",
    required: true,
    readOnly: true,
    computed: true,
    helpText: "Total calculado automáticamente según días de alquiler y tarifa diaria.",
    compute: (formData, helpers) => {
      const { getOptionByValue, calculateRentalDays } = helpers;
      const days = calculateRentalDays(
        formData.fecha_inicio,
        formData.hora_inicio,
        formData.fecha_fin,
        formData.hora_fin,
      );
      const vehicle = getOptionByValue("vehiculo_id", formData.vehiculo_id);
      const price = vehicle ? Number(vehicle.tarifa_diaria ?? vehicle.tarifa_diaria ?? 0) : 0;
      if (!days || !price) return "";
      return Number((days * price).toFixed(2));
    },
  },
  {
    name: "forma_pago",
    label: "Forma de pago",
    required: true,
    options: [
      { label: "Efectivo", value: "Efectivo" },
      { label: "Tarjeta", value: "Tarjeta" },
      { label: "Transferencia", value: "Transferencia" },
      { label: "Otro", value: "Otro" },
    ],
    helpText: "Selecciona el método de pago acordado.",
  },
  {
    name: "estado_alquiler",
    label: "Estado del alquiler",
    required: true,
    options: [
      { label: "Activo", value: "activo" },
      { label: "Finalizado", value: "finalizado" },
      { label: "En Proceso...", value: "en_proceso" },
      { label: "Cancelado", value: "cancelado" },
      { label: "Pendiente", value: "pendiente" },
    ],
    helpText: "Selecciona el estado actual del alquiler.",
  },
];

const listColumns = [
  { name: "id", label: "ID" },
  { name: "cliente_nombre", label: "Cliente", render: (row) => `${row.cliente_nombre} ${row.cliente_apellido}` },
  { name: "vehiculo_marca", label: "Vehículo", render: (row) => `${row.vehiculo_marca} ${row.vehiculo_modelo} (${row.vehiculo_placa})` },
  { name: "fecha_inicio", label: "Inicio" },
  { name: "fecha_fin", label: "Fin" },
  { name: "total", label: "Total" },
  { name: "estado_alquiler", label: "Estado" },
];

const Rentals = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-1 sm:p-4">
            <CrudPage
              title="Gestión de Alquileres"
              description="Administra los contratos de alquiler, control de kilometraje y estados de facturación."
              instructions={[
                "Selecciona el cliente, vehículo y empleado responsable.",
                "Registra las fechas y horas de inicio y fin del alquiler.",
                "El total se calcula automáticamente según la tarifa diaria y los días.",
                "Introduce el kilometraje para mantener el control de la flota.",
              ]}
              listEndpoint="/api/rentals/rentals"
              createEndpoint="/api/rentals/createRental"
              updateEndpoint="/api/rentals/rentals"
              deleteEndpoint="/api/rentals/rentals"
              bulkEndpoint="/api/auth/bulk-rentals"
              fields={fields}
              listColumns={listColumns}
              modalScrollable={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rentals;
