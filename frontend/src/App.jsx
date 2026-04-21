import { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Employees from "./pages/Employees/index.jsx";
import Cars from "./pages/Cars.jsx";
import Clients from "./pages/Clients/index.jsx";
import Rentals from "./pages/Rentals/index.jsx";
import Maintenance from "./pages/Maintenance/index.jsx";
import Payments from "./pages/Payments/index.jsx";
import Catalog from "./pages/Catalog";
import Confirmations from "./pages/Confirmations";
import PageWrapper from "./PageWrapper.jsx";
import Toast from "./Toast.jsx";
import NotFound from "./components/NotFound";
import ProtectedRoute from "./ProtectedRoute.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

axios.defaults.withCredentials = true;

function App() {
  // Inicializar el estado desde localStorage para evitar la pérdida de datos al recargar
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me");
        setUser(res.data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Interceptor para detectar expiración de sesión (401)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Solo mostrar Toast si no es la petición de perfil inicial y el usuario estaba intentando
        // acceder a una ruta protegida.
        if (error.response?.status === 401 && !error.config.url.includes('/api/auth/me')) {
          setToast({ message: "Tu sesión ha expirado. Ingresa de nuevo.", type: "error" });
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // Sincronizar el estado del usuario con localStorage cada vez que cambie
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<PageWrapper><Home user={user} error={error} /></PageWrapper>} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <PageWrapper><Login setUser={setUser} /></PageWrapper>}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <PageWrapper><Register setUser={setUser} /></PageWrapper>}
        />

        <Route 
          path="/catalog" 
          element={<PageWrapper><Catalog user={user} /></PageWrapper>} 
        />

        <Route 
          path="/pending-rentals" 
          element={
            <ProtectedRoute user={user} allowedRoles={['Administrador', 'Vendedor']}>
              <PageWrapper><Confirmations user={user} /></PageWrapper>
            </ProtectedRoute>
          } 
        />

        {/* Rutas protegidas con RBAC */}
        <Route 
          path="/employees" 
          element={
            <ProtectedRoute user={user} allowedRoles={['Administrador']}>
              <PageWrapper><Employees user={user} /></PageWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cars" 
          element={
            <ProtectedRoute user={user} allowedRoles={['Administrador', 'Vendedor', 'Promotor']}>
              <PageWrapper><Cars /></PageWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients" 
          element={
            <ProtectedRoute user={user} allowedRoles={['Administrador', 'Vendedor', 'Promotor']}>
              <PageWrapper><Clients /></PageWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rentals" 
          element={
            <ProtectedRoute user={user} allowedRoles={['Administrador', 'Vendedor', 'Promotor']}>
              <PageWrapper><Rentals /></PageWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/maintenance" 
          element={
            <ProtectedRoute user={user} allowedRoles={['Administrador', 'Vendedor', 'Promotor']}>
              <PageWrapper><Maintenance /></PageWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payments" 
          element={
            <ProtectedRoute user={user} allowedRoles={['Administrador', 'Vendedor', 'Promotor']}>
              <PageWrapper><Payments /></PageWrapper>
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
