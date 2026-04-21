import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = ({ user, setUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setUser(null);
      setIsOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const closeMenu = () => setIsOpen(false);

  // Grupos de permisos para limpiar el JSX
  const isAdminOrSeller = user && ['Administrador', 'Vendedor'].includes(user.cargo);
  const isStaff = user && ['Administrador', 'Vendedor', 'Promotor'].includes(user.cargo);

  return (
    <nav className="bg-gray-900 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="font-extrabold text-2xl tracking-tighter text-indigo-400">
              RENT<span className="text-white">TO</span>CAR
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <Link to="/catalog" className="hover:text-indigo-400 px-3 py-2 text-sm font-medium transition-colors">
              Catálogo
            </Link>

            {user && (
              <div className="flex items-center gap-2 border-l border-gray-700 ml-2 pl-4">
                {isAdminOrSeller && (
                  <Link to="/pending-rentals" className="bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all">
                    Confirmaciones
                  </Link>
                )}
                
                {user.cargo === 'Administrador' && (
                  <Link to="/employees" className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm transition-all">Empleados</Link>
                )}

                {isStaff && (
                  <>
                    <Link to="/cars" className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm transition-all">Vehículos</Link>
                    <Link to="/clients" className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm transition-all">Clientes</Link>
                    <Link to="/rentals" className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm transition-all">Alquileres</Link>
                    <Link to="/maintenance" className="hover:bg-gray-800 px-3 py-2 rounded-md text-sm transition-all">Mantenimientos</Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-xs italic">{user.username} ({user.cargo})</span>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-900/20">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium hover:text-indigo-400">Login</Link>
                <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-bold transition-all">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile Button (Hamburguesa) */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      <div className={`${isOpen ? "block" : "hidden"} lg:hidden bg-gray-800 border-t border-gray-700`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link to="/catalog" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700">Catálogo</Link>
          
          {user && (
            <div className="pt-4 pb-2 border-t border-gray-700 mt-2">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gestión</p>
              {isAdminOrSeller && (
                <Link to="/pending-rentals" onClick={closeMenu} className="block px-3 py-2 text-amber-400 font-bold">Confirmaciones</Link>
              )}
              {user.cargo === 'Administrador' && (
                <Link to="/employees" onClick={closeMenu} className="block px-3 py-2 hover:bg-gray-700">Empleados</Link>
              )}
              {isStaff && (
                <>
                  <Link to="/cars" onClick={closeMenu} className="block px-3 py-2 hover:bg-gray-700">Vehículos</Link>
                  <Link to="/clients" onClick={closeMenu} className="block px-3 py-2 hover:bg-gray-700">Clientes</Link>
                  <Link to="/rentals" onClick={closeMenu} className="block px-3 py-2 hover:bg-gray-700">Alquileres</Link>
                  <Link to="/maintenance" onClick={closeMenu} className="block px-3 py-2 hover:bg-gray-700">Mantenimientos</Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Auth Section */}
        <div className="pt-4 pb-3 border-t border-gray-700">
          {user ? (
            <div className="px-5 flex flex-col gap-3">
              <div className="text-sm text-gray-400">Usuario: {user.username}</div>
              <button onClick={handleLogout} className="w-full bg-red-600 px-4 py-2 rounded-md font-bold">Logout</button>
            </div>
          ) : (
            <div className="px-5 flex flex-col gap-2">
              <Link to="/login" onClick={closeMenu} className="w-full text-center py-2 hover:bg-gray-700 rounded-md">Login</Link>
              <Link to="/register" onClick={closeMenu} className="w-full text-center bg-indigo-600 py-2 rounded-md font-bold">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;