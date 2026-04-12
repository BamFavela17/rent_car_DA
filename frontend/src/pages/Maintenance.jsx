import React from "react";
import AdminSection from "./AdminSection";

const Maintenance = () => {
  return (
    <AdminSection
      endpoint="/api/maintenance/maintenances"
      title="Mantenimientos"
      description="Administra los registros de mantenimiento de los vehículos."
    />
  );
};

export default Maintenance;
