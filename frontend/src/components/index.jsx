import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import SkeletonCard from "../SkeletonCard"; // Importar el nuevo componente
const fallbackImage = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800";

const Catalog = ({ user }) => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterMarca, setFilterMarca] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    cliente_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "08:00",
    hora_fin: "08:00",
    kilometraje_inicio: 0,
  });

  const itemsPerPage = 12;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const carsRes = await axios.get("/api/cars/cars");
        setVehicles(carsRes.data.filter(v => v.estado === true || String(v.estado) === "true"));

        // Solo mostramos vehículos disponibles
        // Solo intentamos cargar clientes si el usuario está logueado
        if (user && ['Administrador', 'Vendedor'].includes(user.cargo)) {
          const clientsRes = await axios.get("/api/clients/clients");
          setClients(clientsRes.data);
        }
      } catch (err) {
        console.error("Error loading catalog", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRequestRental = (vehicle) => {
    setSelectedVehicle(vehicle);
    const initialClientId = (user && user.cargo === 'Cliente') ? user.id : "";
    setFormData({ 
      ...formData, 
      kilometraje_inicio: vehicle.kilometraje || 0,
      cliente_id: initialClientId
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        ...formData,
        vehiculo_id: selectedVehicle.id,
        estado_alquiler: "pendiente",
        forma_pago: "Efectivo",
        empleado_id: 1, // Asignación por defecto al sistema o administrador
        total: 0, 
      };

      await axios.post("/api/rentals/createRental", payload);
      setMessage({ type: "success", text: "¡Solicitud enviada! Un vendedor revisará tu reserva pronto." });
      setTimeout(() => setIsModalOpen(false), 2500);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "No se pudo procesar la solicitud." });
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  // Apply filters
  const filteredVehicles = useMemo(() => vehicles.filter(car => {
    const matchesMarca = filterMarca ? car.marca.toLowerCase().includes(filterMarca.toLowerCase()) : true;
    const matchesPrice = filterMaxPrice ? car.tarifa_diaria <= parseFloat(filterMaxPrice) : true;
    return matchesMarca && matchesPrice;
  }), [vehicles, filterMarca, filterMaxPrice]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMarca, filterMaxPrice]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Encuentra tu próximo destino</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Explora nuestra flota exclusiva. Selecciona el vehículo que deseas y solicita tu reserva en segundos.</p>
        </header>

        {/* Filter Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-xl font-black text-slate-900">Filtra tu búsqueda</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label htmlFor="filterMarca" className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Marca</label>
              <input
                id="filterMarca"
                type="text"
                placeholder="Ej. Toyota"
                value={filterMarca}
                onChange={(e) => setFilterMarca(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="filterMaxPrice" className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Precio Máximo Diario</label>
              <input
                id="filterMaxPrice"
                type="number"
                placeholder="Ej. 150"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterMarca(''); setFilterMaxPrice(''); }}
                className="w-full bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-300 transition-all"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.map((car) => (
            <div key={car.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 group">
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img 
                  src={car.image_url || fallbackImage} 
                  alt={`${car.marca} ${car.modelo}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => { e.target.src = fallbackImage; }}
                />
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur px-5 py-2.5 rounded-2xl shadow-xl border border-slate-100">
                  <span className="text-xl font-black text-indigo-600">${car.tarifa_diaria}</span>
                  <span className="text-xs text-slate-400 font-bold uppercase ml-1">/ día</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{car.tipo}</span>
                    <span className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600">{car.year_car}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{car.marca} {car.modelo}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-5 border-y border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <span className="text-sm font-bold text-slate-600">{car.capacidad} Asientos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L17 13" /></svg>
                    </div>
                    <span className="text-sm font-bold text-slate-600 capitalize">{car.color}</span>
                  </div>
                </div>

                <button 
                  onClick={() => user ? handleRequestRental(car) : navigate("/register")}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 active:scale-[0.98]"
                >
                  {user ? "Solicitar Alquiler" : "Regístrate para rentar"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 pt-8">
            <button
              onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo(0, 0); }}
              disabled={currentPage === 1}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm shadow-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Página</span>
              <span className="h-10 w-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl font-black text-sm">{currentPage}</span>
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest text-xs">de {totalPages}</span>
            </div>

            <button
              onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo(0, 0); }}
              disabled={currentPage === totalPages}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-sm shadow-slate-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Detalles de Reserva</h2>
              <p className="text-indigo-600 font-bold uppercase text-xs tracking-widest">{selectedVehicle.marca} {selectedVehicle.modelo}</p>
            </div>

            {message.text && (
              <div className={`p-4 rounded-2xl text-sm font-bold text-center border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {(!user || user.cargo !== 'Cliente') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Selecciona el Cliente</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold transition-all outline-none"
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                  >
                    <option value="">Selecciona una identificación</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} ({c.numero_identificacion})</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Fecha Inicio</label>
                  <input type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none" 
                    value={formData.fecha_inicio} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Fecha Fin</label>
                  <input type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none" 
                    value={formData.fecha_fin} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} />
                </div>
              </div>
              <button 
                disabled={sending}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 active:scale-95"
              >
                {sending ? "Procesando solicitud..." : "Enviar a revisión"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;