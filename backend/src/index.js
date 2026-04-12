import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employees.routes.js";
import carRoutes from "./routes/car.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import rentalsRoutes from "./routes/rentals.routes.js";
import maintenanceRoutes from "./routes/maintenance.routes.js";
import paymentRoutes from "./routes/payments.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/rentals", rentalsRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/payments", paymentRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta '${req.path}' no encontrada.` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
