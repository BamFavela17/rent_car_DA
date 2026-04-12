import React from "react";
import AdminSection from "./AdminSection";

const Rentals = () => {
  return (
    <AdminSection
      endpoint="/api/rentals/rentals"
      title="Alquileres"
      description="Visualiza y administra los contratos de alquiler."
    />
  );
};

export default Rentals;
