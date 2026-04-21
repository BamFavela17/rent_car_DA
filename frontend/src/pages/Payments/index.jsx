import React from "react";
import CrudPage from "../../components/CrudPage";

const fields = [
  {
    name: "alquiler_id",
    label: "Alquiler",
    type: "number",
    valueType: "number",
    optionsEndpoint: "/api/rentals/rentals",
    optionLabel: "cliente_nombre cliente_apellido",
    optionValue: "id",
  },
  { 
    name: "monto", 
    label: "Monto", 
    type: "number", 
    step: "0.01", 
    placeholder: "0.00", 
    required: true,
    computed: true,
    readOnly: true,
    compute: (formData, helpers) => {
      const rental = helpers.getOptionByValue("alquiler_id", formData.alquiler_id);
      return rental ? rental.total : "";
    }
  },
  { 
    name: "fecha_pago", 
    label: "Fecha pago", 
    type: "date", 
    required: true,
    computed: true,
    readOnly: true,
    compute: () => new Date().toISOString().split('T')[0]
  },
  { 
    name: "hora_pago", 
    label: "Hora pago", 
    type: "time", 
    required: true,
    computed: true,
    readOnly: true,
    compute: () => new Date().toTimeString().slice(0, 5)
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
  },
  { name: "referencia_pago", label: "Referencia pago", placeholder: "ABC123", required: true },
  {
    name: "estado_pago",
    label: "Estado pago",
    required: true,
    options: [
      { label: "Pendiente", value: "pendiente" },
      { label: "Pagado", value: "pagado" },
      { label: "Rechazado", value: "rechazado" },
      { label: "En revisión", value: "en_revisión" },
    ],
  },
];

const listColumns = [
  "id",
  "alquiler_id",
  "monto",
  "fecha_pago",
  "hora_pago",
  "forma_pago",
  "referencia_pago",
  "estado_pago",
];

const Payments = () => (
  <CrudPage
    title="Pagos"
    description="Administra los pagos y su estado."
    listEndpoint="/api/payments/payments"
    createEndpoint="/api/payments/createPayment"
    updateEndpoint="/api/payments/payments"
    deleteEndpoint="/api/payments/payments"
    bulkEndpoint="/api/auth/bulk-payments"
    fields={fields}
    listColumns={listColumns}
  />
);

export default Payments;
