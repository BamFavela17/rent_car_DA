import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post("/api/auth/logout");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-xl">
            Rent-to-Car
          </Link>
          {user && (
            <div className="flex flex-wrap gap-2 text-sm">
              <Link to="/employees" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600">
                Empleados
              </Link>
              <Link to="/cars" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600">
                Vehículos
              </Link>
              <Link to="/clients" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600">
                Clientes
              </Link>
              <Link to="/rentals" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600">
                Alquileres
              </Link>
              <Link to="/maintenance" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600">
                Mantenimientos
              </Link>
              <Link to="/payments" className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600">
                Pagos
              </Link>
            </div>
          )}
        </div>
        <div>
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 px-3 py-1 rounded"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="mx-2">
                Login
              </Link>
              <Link to="/register" className="mx-2">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
