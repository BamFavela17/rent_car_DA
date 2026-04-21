import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SkeletonCard from "../SkeletonCard";

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
  }, [user]);

  const filteredVehicles = useMemo(() => vehicles.filter(car => {
    const matchesMarca = filterMarca ? car.marca.toLowerCase().includes(filterMarca.toLowerCase()) : true;
    const matchesPrice = filterMaxPrice ? car.tarifa_diaria <= parseFloat(filterMaxPrice) : true;
    return matchesMarca && matchesPrice;
  }), [vehicles, filterMarca, filterMaxPrice]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMarca, filterMaxPrice]);

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
        empleado_id: 1, 
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Encuentra tu próximo destino</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Explora nuestra flota exclusiva. Selecciona el vehículo y solicita tu reserva.</p>
        </header>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              type="text"
              placeholder="Filtrar por marca..."
              value={filterMarca}
              onChange={(e) => setFilterMarca(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
            />
            <input
              type="number"
              placeholder="Precio máximo diario"
              value={filterMaxPrice}
              onChange={(e) => setFilterMaxPrice(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
            />
            <button onClick={() => { setFilterMarca(''); setFilterMaxPrice(''); }} className="bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-sm uppercase">Limpiar</button>
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
                <div className="absolute top-6 right-6 bg-white/95 px-5 py-2.5 rounded-2xl shadow-xl border border-slate-100">
                  <span className="text-xl font-black text-indigo-600">${car.tarifa_diaria}</span>
                  <span className="text-xs text-slate-400 font-bold uppercase ml-1">/ día</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight line-clamp-1">{car.marca} {car.modelo}</h3>
                <button 
                  onClick={() => user ? handleRequestRental(car) : navigate("/register")}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all"
                >
                  {user ? "Solicitar Alquiler" : "Regístrate para rentar"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 pt-8">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-4 rounded-2xl bg-white border border-slate-200">Ant.</button>
            <span className="font-black text-indigo-600">Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-4 rounded-2xl bg-white border border-slate-200">Sig.</button>
          </div>
        )}
      </div>

      {isModalOpen && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] p-10 space-y-8">
            <h2 className="text-3xl font-black text-slate-900 text-center">Reserva: {selectedVehicle.marca}</h2>
            {message.text && (
              <div className={`p-4 rounded-2xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {(!user || user.cargo !== 'Cliente') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400">Selecciona el Perfil del Cliente</label>
                  <select 
                    required
                    className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-bold outline-none"
                    value={formData.cliente_id}
                    onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                  >
                    <option value="">Selecciona una identificación</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} ({c.numero_identificacion})</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <input type="date" required className="bg-slate-50 rounded-2xl p-4 text-sm font-bold" value={formData.fecha_inicio} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} />
                <input type="date" required className="bg-slate-50 rounded-2xl p-4 text-sm font-bold" value={formData.fecha_fin} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} />
              </div>
              <button disabled={sending} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase hover:bg-indigo-700 transition-all">
                {sending ? "Procesando..." : "Enviar a revisión"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;