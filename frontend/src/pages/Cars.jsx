import React from "react";
import AdminSection from "./AdminSection";

const Cars = () => {
  return (
    <AdminSection
      endpoint="/api/cars/cars"
      title="Vehículos"
      description="Gestiona la flota de vehículos disponibles para renta."
    />
  );
};

export default Cars;
