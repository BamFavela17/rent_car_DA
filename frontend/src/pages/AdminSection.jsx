import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminSection = ({ endpoint, title, description }) => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get(endpoint);
        setItems(res.data);
      } catch (err) {
        setError("No se pudo cargar la información. Verifica la conexión con el backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [endpoint]);

  const renderTable = () => {
    if (!Array.isArray(items)) {
      return <p className="text-red-500">Los datos recibidos no tienen el formato esperado.</p>;
    }

    if (items.length === 0) {
      return <p className="text-gray-700">No hay registros para mostrar.</p>;
    }

    const columns = Object.keys(items[0] || {}).slice(0, 8);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left text-sm text-gray-700">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 border-b border-gray-200 uppercase tracking-wide">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {columns.map((col) => (
                  <td key={`${index}-${col}`} className="px-4 py-3 border-b border-gray-200 text-sm text-gray-800">
                    {String(item[col] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-[80vh] p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-2">{description}</p>
            </div>
            <button className="self-start md:self-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Nuevo registro
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loading ? (
            <p className="text-gray-700">Cargando datos...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            renderTable()
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSection;
