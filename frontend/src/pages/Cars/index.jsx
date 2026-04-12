import React from "react";
import CrudPage from "../../components/CrudPage";

const fields = [
  { name: "placa", label: "Placa", placeholder: "ABC-123" },
  { name: "marca", label: "Marca", placeholder: "Toyota" },
  { name: "modelo", label: "Modelo", placeholder: "Corolla" },
  { name: "year_car", label: "Año", type: "number", placeholder: "2024" },
  { name: "color", label: "Color", placeholder: "Blanco" },
  { name: "tipo", label: "Tipo", placeholder: "Sedán" },
  { name: "capacidad", label: "Capacidad", type: "number", placeholder: "5" },
  { name: "tarifa_diaria", label: "Tarifa diaria", type: "number", step: "0.01", placeholder: "150.00" },
  {
    name: "estado",
    label: "Disponible",
    type: "boolean",
    valueType: "boolean",
    helpText: "Indica si el vehículo está disponible para renta.",
  },
];

const listColumns = [
  "id",
  "placa",
  "marca",
  "modelo",
  "year_car",
  "color",
  "tipo",
  "capacidad",
  "tarifa_diaria",
  "estado",
];

const Cars = () => (
  <CrudPage
    title="Vehículos"
    description="Gestiona la flota de vehículos disponibles para renta."
    listEndpoint="/api/cars/cars"
    createEndpoint="/api/cars/cars"
    updateEndpoint="/api/cars/cars"
    deleteEndpoint="/api/cars/cars"
    fields={fields}
    listColumns={listColumns}
  />
);

export default Cars;
