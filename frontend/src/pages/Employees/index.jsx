import React from "react";
import CrudPage from "../../components/CrudPage";

const fields = [
  { 
    name: "tipo_identificacion", 
    label: "Tipo de identificación", 
    required: true,
    options: [
      { label: "Cédula de Ciudadanía", value: "CC" },
      { label: "Cédula de Extranjería", value: "CE" },
      { label: "Pasaporte", value: "Pasaporte" },
    ],
    disabledOnEdit: true 
  },
  { 
    name: "numero_identificacion", 
    label: "Número de identificación", 
    placeholder: "123456789", 
    required: true,
    disabledOnEdit: true 
  },
  { name: "nombre", label: "Nombre", placeholder: "Juan", required: true },
  { name: "apellido", label: "Apellido", placeholder: "Pérez", required: true },
  { name: "email", label: "Email", type: "email", placeholder: "juan@mail.com", required: true },
  { name: "telefono", label: "Teléfono", placeholder: "3001234567", required: true },
  { 
    name: "cargo", 
    label: "Cargo", 
    required: true,
    options: [
      { label: "Vendedor", value: "Vendedor" },
      { label: "Promotor", value: "Promotor" },
      { label: "Administrador", value: "Administrador" },
    ]
  },
  { 
    name: "fecha_contratacion", 
    label: "Fecha de contratación", 
    type: "date", 
    required: true,
    defaultValue: new Date().toISOString().split('T')[0]
  },
  { name: "username", label: "Usuario", placeholder: "juan.perez", required: true },
  { name: "password", label: "Contraseña", type: "password", placeholder: "••••••••", required: true },
  {
    name: "estado",
    label: "Estado Activo",
    type: "boolean",
    valueType: "boolean",
    defaultValue: true,
    helpText: "Indica si el empleado tiene acceso al sistema actualmente.",
  },
];

const listColumns = [
  { name: "id", label: "ID" },
  { name: "nombre", label: "Nombre Completo", render: (row) => `${row.nombre} ${row.apellido}` },
  { name: "email", label: "Correo" },
  { name: "cargo", label: "Cargo" },
  { 
    name: "estado", 
    label: "Estado", 
    render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {row.estado ? 'Activo' : 'Inactivo'}
      </span>
    )
  },
];

const Employees = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contenedor con sombra y bordes redondeados para el CrudPage */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-1 sm:p-4">
             <CrudPage
              title="Gestión de Empleados"
              description="Panel administrativo para el control de personal, roles y accesos al sistema."
              listEndpoint="/api/employees/users"
              createEndpoint="/api/employees/createUser"
              updateEndpoint="/api/employees/users"
              deleteEndpoint="/api/employees/users"
              bulkEndpoint="/api/auth/bulk-employees"
              fields={fields}
              listColumns={listColumns}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;