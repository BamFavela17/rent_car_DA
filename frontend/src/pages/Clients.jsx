import React from "react";
import AdminSection from "./AdminSection";

const Clients = () => {
  return (
    <AdminSection
      endpoint="/api/clients/clients"
      title="Clientes"
      description="Revisa y administra los clientes registrados en el sistema."
    />
  );
};

export default Clients;
