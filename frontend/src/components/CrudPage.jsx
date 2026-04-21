import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Toast from "../Toast.jsx";

const DEFAULT_FIELDS = [];
const DEFAULT_COLUMNS = [];

const CrudPage = ({
  title,
  description,
  instructions,
  listEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  bulkEndpoint,
  fields = DEFAULT_FIELDS,
  listColumns = DEFAULT_COLUMNS,
  viewMode = "table",
  SkeletonComponent,
  skeletonCount = 6,
  dataFilter,
  renderItemCard,
}) => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [localToast, setLocalToast] = useState(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [optionsByField, setOptionsByField] = useState({});
  const [optionsLoading, setOptionsLoading] = useState({});
  const [optionsErrorByField, setOptionsErrorByField] = useState({});
  const [computedValues, setComputedValues] = useState({});

  const refreshList = async () => {
    try {
      setLoading(true);
      const res = await axios.get(listEndpoint);
      setItems(res.data);
    } catch (err) {
      setError("No se pudo cargar la información del servidor.");
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    const selectFields = fields.filter((field) => field.optionsEndpoint);
    if (!selectFields.length) return;

    const newOptions = {};
    const loadingState = {};
    const errorState = {};

    await Promise.all(
      selectFields.map(async (field) => {
        loadingState[field.name] = true;
        try {
          const res = await axios.get(field.optionsEndpoint);
          newOptions[field.name] = res.data;
          errorState[field.name] = false;
        } catch (err) {
          newOptions[field.name] = [];
          errorState[field.name] = true;
        } finally {
          loadingState[field.name] = false;
        }
      }),
    );

    setOptionsByField(newOptions);
    setOptionsLoading(loadingState);
    setOptionsErrorByField(errorState);
  };

  useEffect(() => {
    refreshList();
    loadOptions();
  }, [listEndpoint, fields]);

  const handleChange = (name, value, type) => {
    let parsedValue = value;
    if (type === "number") {
      parsedValue = value === "" ? "" : Number(value);
    }
    if (type === "boolean") {
      parsedValue = value === "true";
    }
    setFormData((prev) => {
      const nextData = { ...prev, [name]: parsedValue };
      const computed = computeFieldValues(nextData);
      setComputedValues(computed);
      // Sincronizamos los valores calculados directamente en el estado del formulario
      return { ...nextData, ...computed };
    });
  };

  const getOptionLabel = (option, field) => {
    if (field.optionLabel) {
      const tokens = field.optionLabel.split(" ");
      return tokens
        .map((token) => String(option[token] ?? ""))
        .filter(Boolean)
        .join(" ");
    }

    if (typeof option.label !== "undefined") {
      return String(option.label);
    }

    return String(option[field.optionValue || "id"] ?? option.id ?? option.value ?? "");
  };

  const getOptionValue = (option, field) => {
    if (field.optionValue) return option[field.optionValue];
    return option.value ?? option.id ?? "";
  };

  const normalizeFieldValue = (field, value) => {
    if (value == null) return "";
    if (field.type === "date") {
      const stringValue = String(value);
      return stringValue.includes("T") ? stringValue.slice(0, 10) : stringValue;
    }
    if (field.type === "time") {
      const stringValue = String(value);
      if (stringValue.includes("T")) {
        return stringValue.slice(11, 16);
      }
      return stringValue.length > 5 ? stringValue.slice(0, 5) : stringValue;
    }
    return value;
  };

  const getOptionByValue = (fieldName, value) => {
    const fieldConfig = fields.find((field) => field.name === fieldName);
    const options = optionsByField[fieldName] || [];
    if (!fieldConfig) return null;
    return options.find((option) => String(getOptionValue(option, fieldConfig)) === String(value)) || null;
  };

  const calculateRentalDays = (fechaInicio, horaInicio, fechaFin, horaFin) => {
    if (!fechaInicio || !fechaFin) return null;
    const start = new Date(`${fechaInicio}T${horaInicio || "00:00"}:00`);
    const end = new Date(`${fechaFin}T${horaFin || "00:00"}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    const diffMs = end - start;
    if (diffMs <= 0) return null;
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  const computeFieldValues = (formDataValue) => {
    const result = {};
    fields.forEach((field) => {
      if (typeof field.compute === "function") {
        result[field.name] = field.compute(formDataValue, {
          optionsByField,
          getOptionValue,
          getOptionByValue,
          calculateRentalDays,
        });
      }
    });
    return result;
  };

  // Aplicamos el filtro de datos si existe antes de renderizar o contar
  const displayItems = dataFilter ? items.filter(dataFilter) : items;

  const readableHeader = (text) => {
    if (typeof text !== "string") return "";
    return text.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const singularTitle = (text) => {
    if (text.endsWith("es")) return text.slice(0, -2);
    if (text.endsWith("s")) return text.slice(0, -1);
    return text;
  };

  const StatusBadge = ({ value }) => {
    const val = String(value || "").toLowerCase();
    let base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ";
    if (['activo', 'completado', 'pagado', 'sí', 'true', 'disponible'].includes(val)) {
      base += "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (['pendiente', 'proceso', 'en_proceso', 'en servicio', 'en revisión'].includes(val)) {
      base += "bg-amber-50 text-amber-700 border-amber-200";
    } else if (['cancelado', 'no', 'false', 'ocupado'].includes(val)) {
      base += "bg-rose-50 text-rose-700 border-rose-200";
    } else if (['finalizado'].includes(val)) {
      base += "bg-blue-50 text-blue-700 border-blue-200";
    } else {
      base += "bg-slate-50 text-slate-700 border-slate-200";
    }
    const label = (value === true || value === "true") ? "Sí" : (value === false || value === "false") ? "No" : value;
    return <span className={base}>{label}</span>;
  };

  const formatCellValue = (column, value) => {
    const isBool = value === true || value === false || String(value) === "true" || String(value) === "false";
    const isStatus = String(column).toLowerCase().includes('estado');
    
    if (isBool || isStatus) return <StatusBadge value={value} />;

    const lowerCol = String(column).toLowerCase();
    const moneyFields = ["total", "costo", "tarifa_diaria", "monto"];
    if (moneyFields.includes(lowerCol)) {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value || 0);
    }
    
    return String(value ?? "-");
  };

  const exportToCSV = () => {
    if (!displayItems.length) return;

    const headers = listColumns.map((col) => (typeof col === "object" ? col.label || readableHeader(col.name) : readableHeader(col))).join(",");
    const rows = displayItems.map((item) => {
      return listColumns
        .map((col) => {
          const colName = typeof col === "object" ? col.name : col;
          let val = item[colName];
          if (val === true || val === "true") val = "Sí";
          else if (val === false || val === "false") val = "No";

          let stringVal = String(val ?? "");
          if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
            stringVal = `"${stringVal.replace(/"/g, '""')}"`;
          }
          return stringVal;
        })
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openModal = (item = null) => {
    if (item) {
      setSelectedId(item.id);
      const initialData = fields.reduce((acc, field) => {
        acc[field.name] = normalizeFieldValue(field, item[field.name] ?? "");
        return acc;
      }, {});
      const computed = computeFieldValues(initialData);
      setFormData({ ...initialData, ...computed });
      setComputedValues(computed);
    } else {
      setSelectedId(null);
      const initialData = fields.reduce((acc, field) => {
        if (field.defaultValue !== undefined) {
          acc[field.name] = typeof field.defaultValue === 'function' 
            ? field.defaultValue() 
            : field.defaultValue;
        }
        return acc;
      }, {});
      const computed = computeFieldValues(initialData);
      setFormData({ ...initialData, ...computed });
      setComputedValues(computed);
    }
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
    setFormData({});
    setError("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este registro?")) return;
    try {
      await axios.delete(`${deleteEndpoint}/${id}`);
      await refreshList();
    } catch (err) {
      setError("No se pudo eliminar el registro.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    // Refrescamos los valores calculados (como fecha/hora actual) justo antes de enviar al servidor
    const latestComputed = computeFieldValues(formData);
    const payload = { ...formData, ...latestComputed };

    try {
      if (selectedId) {
        await axios.put(`${updateEndpoint}/${selectedId}`, payload);
      } else {
        await axios.post(createEndpoint, payload);
      }
      setFormData({});
      setSelectedId(null);
      setIsModalOpen(false);
      await refreshList();
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      setError(serverMessage || "No se pudo guardar el registro. Revisa los datos e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        if (!Array.isArray(jsonData)) {
          throw new Error("El archivo debe contener un arreglo de objetos JSON.");
        }

        setIsBulkUploading(true);
        const res = await axios.post(bulkEndpoint, jsonData);
        setLocalToast({ message: res.data.message || "Carga masiva completada con éxito.", type: "success" });
        if (res.data.ignored?.length > 0) {
          console.warn("Algunos registros fueron ignorados por ser duplicados:", res.data.ignored);
        }
        await refreshList();
      } catch (err) {
        setLocalToast({ message: err.response?.data?.message || "Error al procesar el archivo JSON.", type: "error" });
      } finally {
        setIsBulkUploading(false);
        event.target.value = ""; // Reset del input
      }
    };
    reader.readAsText(file);
  };

  const renderTableHeaders = () => {
    if (!listColumns?.length) return null;
    return (
      <tr>
        {listColumns.map((column) => {
          const colKey = typeof column === "object" ? column.name : column;
          const colLabel = typeof column === "object" ? column.label || readableHeader(column.name) : readableHeader(column);
          return (
            <th key={colKey} className="px-8 py-4 border-b border-slate-100 first:pl-8 last:pr-8">
              {colLabel}
            </th>
          );
        })}
        <th className="px-8 py-4 border-b border-slate-100 text-right pr-12">Acciones</th>
      </tr>
    );
  };

  const renderTableRows = () => {
    if (!displayItems.length) {
      return (
        <tr>
          <td colSpan={listColumns.length + 1} className="px-4 py-6 text-center text-gray-600">
            No hay registros todavía.
          </td>
        </tr>
      );
    }

    return displayItems.map((item) => (
      <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors duration-150">
        {listColumns.map((column) => {
          const colName = typeof column === "object" ? column.name : column;
          const content = (typeof column === "object" && column.render) ? column.render(item) : formatCellValue(colName, item[colName]);
          return (
            <td key={`${item.id}-${colName}`} className="px-8 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
              {content}
            </td>
          );
        })}
        <td className="px-8 py-4 text-right pr-12">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => openModal(item)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Editar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Eliminar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderCardGrid = () => {
    if (!displayItems.length) {
      return <div className="p-20 text-center text-slate-500 font-medium">No hay registros todavía.</div>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {displayItems.map((item) => (
          <div key={item.id} className="group bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {renderItemCard ? renderItemCard(item, { openModal, handleDelete, formatCellValue, StatusBadge }) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 line-clamp-1">
                      {item.marca || item.nombre || 'Registro'} {item.modelo || item.apellido || `#${item.id}`}
                    </h3>
                    <p className="text-sm font-semibold text-indigo-600 uppercase tracking-tighter">{item.placa || item.email || item.tipo_identificacion}</p>
                  </div>
                  <StatusBadge value={item.estado ?? item.estado_alquiler ?? item.estado_mantenimiento} />
                </div>
                
                <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-50">
                  {listColumns.filter(c => {
                    const name = typeof c === 'object' ? c.name : c;
                    return !['id', 'estado', 'estado_alquiler', 'marca', 'modelo', 'nombre', 'apellido', 'placa'].includes(name);
                  }).slice(0, 4).map(col => {
                    const colName = typeof col === 'object' ? col.name : col;
                    return (
                    <div key={colName}>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{typeof col === 'object' ? col.label : readableHeader(col)}</p>
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {typeof col === 'object' && col.render ? col.render(item) : formatCellValue(colName, item[colName])}
                      </p>
                    </div>
                  )})}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <button onClick={() => openModal(item)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const isEditMode = Boolean(selectedId);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-sans selection:bg-indigo-100">
      {localToast && <Toast message={localToast.message} type={localToast.type} onClose={() => setLocalToast(null)} />}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm border border-slate-200/60">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              <p className="text-lg text-slate-500 max-w-2xl">{description}</p>
              {instructions?.length && (
                <div className="mt-6 flex items-start gap-3 rounded-2xl bg-indigo-50/50 p-5 border border-indigo-100/50">
                  <div className="mt-1 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm leading-relaxed text-slate-600">
                    <p className="font-bold text-indigo-900 mb-1">Guía de uso</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {instructions.map((step, index) => <li key={index}>{step}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {bulkEndpoint && (
                <>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleBulkUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBulkUploading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-6 py-3.5 text-sm font-semibold text-amber-700 shadow-sm transition-all hover:bg-amber-100 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {isBulkUploading ? "Cargando..." : "Carga Masiva"}
                  </button>
                </>
              )}
              <button
                onClick={exportToCSV}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar CSV
              </button>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Nuevo registro
              </button>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-50/30 blur-3xl" />
        </div>

        <div className="rounded-3xl bg-white shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">Registros</h2>
              {!loading && (
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500 border border-slate-200">
                  {displayItems.length}
                </span>
              )}
            </div>
            {loading && <div className="animate-pulse text-sm text-indigo-600 font-medium">Sincronizando...</div>}
          </div>
            {loading ? (
              viewMode === "grid" && SkeletonComponent ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                  {[...Array(skeletonCount)].map((_, i) => (
                    <SkeletonComponent key={i} />
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" /></div>
              )
            ) : (
            viewMode === "grid" ? (
              renderCardGrid()
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {renderTableHeaders()}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {renderTableRows()}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200 transition-all flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {isEditMode ? `Editar ${singularTitle(title)}` : `Nuevo ${singularTitle(title)}`}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {isEditMode ? "Modifica los campos necesarios." : "Ingresa la información requerida."}
                </p>
              </div>
              <button onClick={closeModal} className="group rounded-full p-2 hover:bg-slate-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 pt-6 scrollbar-thin scrollbar-thumb-slate-200">
              {error && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-rose-50 p-4 border border-rose-100 text-rose-700 text-sm font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
                {fields.map((field) => {
                  const disabled = isEditMode && field.disabledOnEdit;
                  const defaultOptions = field.options || optionsByField[field.name] || (field.type === "boolean" ? [
                    { label: "Sí", value: "true" },
                    { label: "No", value: "false" },
                  ] : []);
                  let options = defaultOptions;
                  if (field.optionsFilter) {
                    options = defaultOptions.filter(field.optionsFilter);
                    const selectedValue = String(formData[field.name] ?? "");
                    if (selectedValue) {
                      const selectedOption = defaultOptions.find((option) => String(getOptionValue(option, field)) === selectedValue);
                      if (selectedOption && !options.some((option) => String(getOptionValue(option, field)) === selectedValue)) {
                        options = [...options, selectedOption];
                      }
                    }
                  }
                  const loadingOptions = optionsLoading[field.name];
                  return (
                    <div key={field.name} className={field.fullWidth ? "col-span-full" : ""}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="ml-2 text-sm font-semibold text-red-600">*</span>}
                        {disabled && <span className="ml-2 text-xs font-normal text-gray-500">(bloqueado en edición)</span>}
                      </label>
                      {field.options || field.optionsEndpoint || field.type === "boolean" ? (
                        <select
                          value={String(formData[field.name] ?? "")}
                          onChange={(event) => handleChange(field.name, event.target.value, field.type)}
                          className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 disabled:bg-gray-100"
                          disabled={disabled || loadingOptions}
                          required={field.required}
                        >
                          <option value="">
                            {loadingOptions ? "Cargando opciones..." : options.length ? "Selecciona una opción" : "No hay opciones disponibles"}
                          </option>
                          {options.map((option) => {
                            const optionValue = field.type === "boolean" ? String(option.value ?? option.label) : String(getOptionValue(option, field));
                            const optionLabel = field.type === "boolean" ? String(option.label) : getOptionLabel(option, field);
                            return (
                              <option key={optionValue} value={optionValue}>
                                {optionLabel}
                              </option>
                            );
                          })}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          value={field.computed || field.readOnly ? computedValues[field.name] ?? formData[field.name] ?? "" : formData[field.name] ?? ""}
                          onChange={(event) => handleChange(field.name, event.target.value)}
                          className="w-full min-h-[120px] rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100"
                          placeholder={field.placeholder || ""}
                          disabled={disabled || field.readOnly}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.type || "text"}
                          value={field.computed || field.readOnly ? computedValues[field.name] ?? formData[field.name] ?? "" : formData[field.name] ?? ""}
                          onChange={(event) => handleChange(field.name, event.target.value, field.valueType)}
                          className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-100 disabled:text-slate-400"
                          placeholder={field.placeholder || ""}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          disabled={disabled || field.readOnly}
                          required={field.required}
                        />
                      )}
                      {optionsErrorByField[field.name] && (
                        <p className="mt-1 text-xs text-red-600">No se pudieron cargar las opciones. Intenta recargar la página.</p>
                      )}
                      {field.helpText && (
                        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
                      )}
                    </div>
                  );
                })}

                <div className="col-span-full mt-8 flex flex-col gap-3 border-t border-slate-100 pt-8 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-2xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-indigo-600 px-10 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                  >
                    {saving ? "Procesando..." : isEditMode ? "Guardar cambios" : "Crear registro"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrudPage;
