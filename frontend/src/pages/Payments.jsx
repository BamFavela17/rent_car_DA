import React from "react";
import AdminSection from "./AdminSection";

const Payments = () => {
  return (
    <AdminSection
      endpoint="/api/payments/payments"
      title="Pagos"
      description="Controla los pagos recibidos y su estado."
    />
  );
};

export default Payments;
