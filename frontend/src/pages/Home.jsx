import React from "react";
import { Link } from "react-router-dom";

const Home = ({ user, error }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-12 md:p-20 text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
                Libertad sobre <span className="text-indigo-600">ruedas.</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                La forma más simple y elegante de gestionar y alquilar vehículos de alta gama.
              </p>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-3 rounded-2xl text-sm font-bold inline-block">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/catalog"
                className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1"
              >
                Ver Vehículos
              </Link>
              
              {!user && (
                <>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto bg-white border-2 border-slate-100 text-slate-600 px-10 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>

            {user && (
              <div className="pt-8 border-t border-slate-50">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sesión Iniciada como</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">{user.nombre || user.username}</h3>
                <p className="text-slate-500 font-medium">{user.email}</p>
                <p className="mt-2 inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                  {user.cargo}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
