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
import Cars from "./pages/Cars/index.jsx";
import Clients from "./pages/Clients/index.jsx";
import Rentals from "./pages/Rentals/index.jsx";
import Maintenance from "./pages/Maintenance/index.jsx";
import Payments from "./pages/Payments/index.jsx";
import NotFound from "./components/NotFound";

axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home user={user} error={error} />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login setUser={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register setUser={setUser} />}
        />
        <Route path="/employees" element={user ? <Employees /> : <Navigate to="/login" />} />
        <Route path="/cars" element={user ? <Cars /> : <Navigate to="/login" />} />
        <Route path="/clients" element={user ? <Clients /> : <Navigate to="/login" />} />
        <Route path="/rentals" element={user ? <Rentals /> : <Navigate to="/login" />} />
        <Route path="/maintenance" element={user ? <Maintenance /> : <Navigate to="/login" />} />
        <Route path="/payments" element={user ? <Payments /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
