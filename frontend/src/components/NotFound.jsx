import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="space-y-6 animate-in fade-in zoom-in duration-500">
        <h1 className="text-9xl font-black text-indigo-600 tracking-tighter">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ruta no encontrada</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">
            Parece que te has desviado del camino. La página que buscas no existe o ha sido movida.
          </p>
        </div>
        <Link 
          to="/" 
          className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;