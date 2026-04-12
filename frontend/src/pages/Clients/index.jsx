import React from "react";
import CrudPage from "../../components/CrudPage";

const fields = [
  { name: "tipo_identificacion", label: "Tipo de identificación", placeholder: "CC", disabledOnEdit: true },
  { name: "numero_identificacion", label: "Número de identificación", placeholder: "123456789", disabledOnEdit: true },
  { name: "nombre", label: "Nombre", placeholder: "Juan" },
  { name: "apellido", label: "Apellido", placeholder: "Pérez" },
  { name: "email", label: "Email", type: "email", placeholder: "juan@mail.com" },
  { name: "telefono", label: "Teléfono", placeholder: "3001234567" },
  { name: "direccion", label: "Dirección", placeholder: "Calle 123" },
  { name: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date" },
  { name: "licencia_conduccion", label: "Licencia de conducción", placeholder: "LIC123" },
  { name: "fecha_vencimiento_licencia", label: "Vencimiento de licencia", type: "date" },
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
    description="Administra los clientes registrados en el sistema."
    listEndpoint="/api/clients/clients"
    createEndpoint="/api/clients/clients"
    updateEndpoint="/api/clients/clients"
    deleteEndpoint="/api/clients/clients"
    fields={fields}
    listColumns={listColumns}
  />
);

export default Clients;
