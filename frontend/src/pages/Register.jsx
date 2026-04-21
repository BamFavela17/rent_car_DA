import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Toast from "../Toast.jsx";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipo_identificacion: "CC",
    numero_identificacion: "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
    licencia_conduccion: "",
    fecha_vencimiento_licencia: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isAdminRegister, setIsAdminRegister] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await axios.get("/api/auth/check-admin");
        setAdminExists(res.data.exists);
        if (res.data.exists) {
          setIsAdminRegister(false);
        }
      } catch (err) {
        console.error("Error verificando administrador:", err);
      }
    };
    verifyAdmin();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Expresiones regulares para validación
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10,15}$/; // Ajustado para 10-15 dígitos numéricos

    if (!emailRegex.test(formData.email)) {
      setError("Por favor, ingresa un correo electrónico con formato válido.");
      setLoading(false);
      return;
    }

    if (!phoneRegex.test(formData.telefono.replace(/\D/g, ""))) {
      setError("El teléfono debe contener entre 10 y 15 dígitos numéricos.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (!isAdminRegister && formData.fecha_nacimiento) {
      const age = new Date().getFullYear() - new Date(formData.fecha_nacimiento).getFullYear();
      if (age < 18) {
        setError("Debes ser mayor de 18 años para registrarte como cliente.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isAdminRegister) {
        await axios.post("/api/auth/createadmin", formData);
        setSuccessToast("¡Administrador inicial creado con éxito!");
      } else {
        await axios.post("/api/auth/register", formData);
        setSuccessToast("¡Registro de cliente exitoso!");
      }
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al procesar el registro. Revisa que los datos sean correctos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      {successToast && <Toast message={successToast} type="success" onClose={() => setSuccessToast(null)} />}
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-8 md:p-12 space-y-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Crea tu Perfil</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Únete a la flota de Rent-to-Car</p>
        </div>

        {/* Toggle de Modo de Registro */}
        <div className="flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-2">
            <button
              type="button"
              disabled={adminExists}
              onClick={() => setIsAdminRegister(true)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                isAdminRegister 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600 disabled:opacity-50"
              }`}
            >
              ADMINISTRADOR {adminExists && "(YA EXISTE)"}
            </button>
            <button
              type="button"
              onClick={() => setIsAdminRegister(false)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                !isAdminRegister 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              CLIENTE
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {/* Columna 1: Datos Personales y Contacto */}
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-2">Información Básica</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nombre</label>
                  <input name="nombre" type="text" required placeholder="Ej. Juan" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.nombre} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Apellido</label>
                  <input name="apellido" type="text" required placeholder="Ej. Pérez" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.apellido} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Email Corporativo/Personal</label>
                <input name="email" type="email" required placeholder="juan@ejemplo.com" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.email} onChange={handleChange} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Teléfono de Contacto</label>
                <input name="telefono" type="text" required placeholder="300 123 4567" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.telefono} onChange={handleChange} />
              </div>
              {!isAdminRegister && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Dirección de Residencia</label>
                    <input name="direccion" type="text" required placeholder="Calle 123 #45-67" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.direccion} onChange={handleChange} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Fecha de Nacimiento</label>
                    <input name="fecha_nacimiento" type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.fecha_nacimiento} onChange={handleChange} />
                  </div>
                </>
              )}
            </div>

            {/* Columna 2: Documentación y Cuenta */}
            <div className="space-y-6">
              <h2 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-2">Identidad y Seguridad</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Tipo ID</label>
                  <select name="tipo_identificacion" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.tipo_identificacion} onChange={handleChange}>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Número ID</label>
                  <input name="numero_identificacion" type="text" required placeholder="1234..." className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.numero_identificacion} onChange={handleChange} />
                </div>
              </div>
              {!isAdminRegister && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Licencia de Conducción</label>
                    <input name="licencia_conduccion" type="text" required placeholder="Número de licencia" className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.licencia_conduccion} onChange={handleChange} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Vencimiento Licencia</label>
                    <input name="fecha_vencimiento_licencia" type="date" required className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.fecha_vencimiento_licencia} onChange={handleChange} />
                  </div>
                </>
              )}
              
              <div className="pt-4 space-y-4">
                <h2 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">Credenciales de Acceso</h2>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Nombre de Usuario</label>
                  <input name="username" type="text" required placeholder="Ej. j_perez" className="w-full bg-indigo-50/30 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.username} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Contraseña</label>
                  <input name="password" type="password" required placeholder="••••••••" className="w-full bg-indigo-50/30 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.password} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Confirmar Contraseña</label>
                  <input name="confirmPassword" type="password" required placeholder="••••••••" className="w-full bg-indigo-50/30 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={formData.confirmPassword} onChange={handleChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full max-w-md bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 disabled:opacity-50 active:scale-95"
            >
              {loading ? "Procesando Registro..." : "Completar Registro"}
            </button>
            
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              ¿Ya tienes una cuenta? <Link to="/login" className="text-indigo-600 hover:text-indigo-500 transition-colors">Inicia Sesión aquí</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;