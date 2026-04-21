import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-transparent border-b-indigo-400/30 animate-pulse"></div>
      </div>
      <h2 className="mt-6 text-xl font-black text-slate-800 tracking-tight">Rent-to-Car</h2>
      <p className="mt-2 text-slate-500 font-bold text-sm uppercase tracking-widest animate-pulse">Verificando credenciales...</p>
    </div>
  );
};

export default LoadingSpinner;