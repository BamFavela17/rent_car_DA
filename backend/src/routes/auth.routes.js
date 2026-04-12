import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  const user = await pool.query("SELECT * FROM employees WHERE email = $1", [
    email,
  ]);

  if (user.rows.length === 0) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const userData = user.rows[0];

  const isMatch = await bcrypt.compare(password, userData.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid password" });
  }

  const token = generateToken(userData.id);

  res.cookie("token", token, cookieOptions);

  res.json({
    user: {
      id: userData.id,
      name: userData.nombre,
      apellido: userData.apellido,
      email: userData.email,
      cargo: userData.cargo,
      username: userData.username,
    },
  });
});

// Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide name, email and password" });
  }

  const existingUser = await pool.query(
    "SELECT id FROM employees WHERE email = $1 OR username = $2",
    [email, email],
  );

  if (existingUser.rows.length > 0) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const nombre = name;
  const apellido = "";
  const username = email;
  const tipoIdentificacion = "CC";
  const numeroIdentificacion = "0000000000";
  const telefono = "0000000000";
  const cargo = "Empleado";
  const fechaContratacion = new Date().toISOString().split("T")[0];

  const { rows } = await pool.query(
    "INSERT INTO employees (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, cargo, fecha_contratacion, username, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
    [
      tipoIdentificacion,
      numeroIdentificacion,
      nombre,
      apellido,
      email,
      telefono,
      cargo,
      fechaContratacion,
      username,
      hashedPassword,
    ],
  );

  const userData = rows[0];
  const token = generateToken(userData.id);
  res.cookie("token", token, cookieOptions);

  res.json({
    user: {
      id: userData.id,
      name: userData.nombre,
      apellido: userData.apellido,
      email: userData.email,
      cargo: userData.cargo,
      username: userData.username,
    },
  });
});

// Me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
  // return info of the logged in user from protect middleware
});

// Logout
router.post("/logout", (req, res) => {
  res.cookie("token", "", { ...cookieOptions, maxAge: 1 });
  res.json({ message: "Logged out successfully" });
});

export default router;
