import React, { useEffect, useState } from "react";
import axios from "axios";

const CrudPage = ({
  title,
  description,
  instructions,
  listEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  fields,
  listColumns,
}) => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const computed = computeFieldValues(formData);
    setComputedValues(computed);
  }, [formData, optionsByField, fields]);

  useEffect(() => {
    if (!formData) return;
    const needsUpdate = fields.some((field) => field.computed && formData[field.name] !== computedValues[field.name]);
    if (needsUpdate) {
      setFormData((prev) => ({ ...prev, ...computedValues }));
    }
  }, [computedValues, fields, formData]);

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

  const readableHeader = (text) => text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const singularTitle = (text) => {
    if (text.endsWith("es")) return text.slice(0, -2);
    if (text.endsWith("s")) return text.slice(0, -1);
    return text;
  };

  const formatCellValue = (value) => {
    if (value === true || value === "true") return "Sí";
    if (value === false || value === "false") return "No";
    return String(value ?? "-");
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
          acc[field.name] = field.defaultValue;
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

    const payload = { ...formData, ...computedValues };

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
      setError("No se pudo guardar el registro. Revisa los datos e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const renderTableHeaders = () => {
    if (!listColumns?.length) return null;
    return (
      <tr className="bg-gray-100 text-left text-sm text-gray-700">
        {listColumns.map((column) => (
          <th key={column} className="px-4 py-3 border-b border-gray-200 uppercase tracking-wide">
            {readableHeader(column)}
          </th>
        ))}
        <th className="px-4 py-3 border-b border-gray-200">Acciones</th>
      </tr>
    );
  };

  const renderTableRows = () => {
    if (!items.length) {
      return (
        <tr>
          <td colSpan={listColumns.length + 1} className="px-4 py-6 text-center text-gray-600">
            No hay registros todavía.
          </td>
        </tr>
      );
    }

    return items.map((item) => (
      <tr key={item.id} className={item.id % 2 === 0 ? "bg-white" : "bg-gray-50"}>
        {listColumns.map((column) => (
          <td key={`${item.id}-${column}`} className="px-4 py-3 border-b border-gray-200 text-sm text-gray-800">
            {formatCellValue(item[column])}
          </td>
        ))}
        <td className="px-4 py-3 border-b border-gray-200 text-sm text-gray-800">
          <button
            onClick={() => openModal(item)}
            className="mr-2 text-blue-600 hover:text-blue-800"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="text-red-600 hover:text-red-800"
          >
            Eliminar
          </button>
        </td>
      </tr>
    ));
  };

  const isEditMode = Boolean(selectedId);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
              <p className="mt-2 text-gray-600">{description}</p>
              {instructions?.length ? (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Flujo recomendado</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    {instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
            <button
              onClick={() => openModal()}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Nuevo registro
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 overflow-x-auto">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Lista</h2>
              <p className="text-sm text-gray-600">
                {loading ? "Esperando datos del servidor..." : `Total de registros: ${items.length}`}
              </p>
            </div>
            <p className="text-sm text-gray-500">Usa los botones de la tabla para editar o eliminar registros.</p>
          </div>
          {loading ? (
            <p className="text-gray-700">Cargando...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>{renderTableHeaders()}</thead>
              <tbody>{renderTableRows()}</tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[90vh]">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {isEditMode ? `Editar ${singularTitle(title)}` : `Nuevo ${singularTitle(title)}`}
                </h2>
                <p className="text-sm text-gray-600">
                  {isEditMode ? "Ajusta los datos que estén disponibles para editar." : "Completa los datos para crear un nuevo registro."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-14rem)]">
              {error && <p className="mb-4 text-red-600">{error}</p>}
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => {
                  const disabled = isEditMode && field.disabledOnEdit;
                  const options = field.options || optionsByField[field.name] || (field.type === "boolean" ? [
                    { label: "Sí", value: "true" },
                    { label: "No", value: "false" },
                  ] : []);
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
                          className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900"
                          placeholder={field.placeholder || ""}
                          disabled={disabled || field.readOnly}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.type || "text"}
                          value={field.computed || field.readOnly ? computedValues[field.name] ?? formData[field.name] ?? "" : formData[field.name] ?? ""}
                          onChange={(event) => handleChange(field.name, event.target.value, field.valueType)}
                          className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 disabled:bg-gray-100"
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

                <div className="col-span-full flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {saving ? "Guardando..." : isEditMode ? "Actualizar" : "Crear"}
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
