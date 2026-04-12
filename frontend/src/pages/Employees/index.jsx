import React from "react";
import CrudPage from "../../components/CrudPage";

const fields = [
  { name: "tipo_identificacion", label: "Tipo de identificación", placeholder: "CC", disabledOnEdit: true },
  { name: "numero_identificacion", label: "Número de identificación", placeholder: "123456789", disabledOnEdit: true },
  { name: "nombre", label: "Nombre", placeholder: "Juan" },
  { name: "apellido", label: "Apellido", placeholder: "Pérez" },
  { name: "email", label: "Email", type: "email", placeholder: "juan@mail.com" },
  { name: "telefono", label: "Teléfono", placeholder: "3001234567" },
  { name: "cargo", label: "Cargo", placeholder: "Gerente", disabledOnEdit: true },
  { name: "fecha_contratacion", label: "Fecha de contratación", type: "date", disabledOnEdit: true },
  { name: "username", label: "Usuario", placeholder: "juan.perez" },
  { name: "password", label: "Contraseña", type: "password", placeholder: "••••••••" },
  {
    name: "estado",
    label: "Activo",
    type: "boolean",
    valueType: "boolean",
    disabledOnEdit: true,
    helpText: "Marca si el empleado está activo en el sistema.",
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
  "cargo",
  "username",
  "estado",
];

const Employees = () => (
  <CrudPage
    title="Empleados"
    description="Administra los empleados registrados en el sistema."
    listEndpoint="/api/employees/users"
    createEndpoint="/api/employees/createUser"
    updateEndpoint="/api/employees/users"
    deleteEndpoint="/api/employees/users"
    fields={fields}
    listColumns={listColumns}
  />
);

export default Employees;
