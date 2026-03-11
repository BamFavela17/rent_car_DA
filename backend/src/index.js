import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employees.routes.js";
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

app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta '${req.path}' no encontrada.` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
