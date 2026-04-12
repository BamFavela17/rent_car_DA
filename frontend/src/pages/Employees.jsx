import React from "react";
import AdminSection from "./AdminSection";

const Employees = () => {
  return (
    <AdminSection
      endpoint="/api/employees/users"
      title="Empleados"
      description="Administra los usuarios y empleados registrados en el sistema."
    />
  );
};

export default Employees;
