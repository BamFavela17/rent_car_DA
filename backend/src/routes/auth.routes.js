import express from "express";
import bcrypt from "bcryptjs";
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

const generateToken = (id, cargo) => {
  return jwt.sign({ id, cargo }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Login
router.post("/login", async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = email || username;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "Por favor, proporcione usuario y contraseña" });
  }

  // Intentar buscar en empleados primero (debe estar activo)
  let user = await pool.query(
    "SELECT * FROM employees WHERE (email = $1 OR username = $1) AND estado = TRUE",
    [identifier]
  );

  // Si no se encuentra en empleados, buscar en clientes
  if (user.rows.length === 0) {
    user = await pool.query(
      "SELECT * FROM clients WHERE email = $1 OR username = $1",
      [identifier]
    );
  }

  if (user.rows.length === 0) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const userData = user.rows[0];
  const isMatch = await bcrypt.compare(password, userData.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const token = generateToken(userData.id, userData.cargo);

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
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      username,
      tipo_identificacion,
      numero_identificacion,
      telefono,
      direccion,
      fecha_nacimiento,
      licencia_conduccion,
      fecha_vencimiento_licencia
    } = req.body;

    if (!nombre || !email || !password || !username) {
      return res
        .status(400)
        .json({ message: "Nombre, email, usuario y contraseña son requeridos" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM clients WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "El usuario o email ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO clients (
        tipo_identificacion, numero_identificacion, nombre, apellido, email, 
        telefono, direccion, fecha_nacimiento, licencia_conduccion, 
        fecha_vencimiento_licencia, username, password, cargo
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        tipo_identificacion || "CC",
        numero_identificacion || "",
        nombre,
        apellido || "",
        email,
        telefono || "",
        direccion || "",
        fecha_nacimiento || null,
        licencia_conduccion || "",
        fecha_vencimiento_licencia || null,
        username,
        hashedPassword,
        "Cliente"
      ]
    );

    const userData = rows[0];
    const token = generateToken(userData.id, userData.cargo);
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      user: {
        id: userData.id,
        name: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        cargo: userData.cargo,
        username: userData.username,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// Verificar si existe un administrador
router.get("/check-admin", async (req, res) => {
  const result = await pool.query(
    "SELECT 1 FROM employees WHERE cargo = 'Administrador' LIMIT 1"
  );
  res.json({ exists: result.rows.length > 0 });
});

// Registro inicial de Administrador (Condicional)
router.post("/createadmin", async (req, res) => {
  try {
    // Verificar si ya existe un administrador en el sistema
    const adminCheck = await pool.query(
      "SELECT 1 FROM employees WHERE cargo = 'Administrador' LIMIT 1"
    );

    if (adminCheck.rows.length > 0) {
      return res.status(403).json({ 
        message: "Operación no permitida: Ya existe un administrador en el sistema." 
      });
    }

    const { 
      tipo_identificacion, 
      numero_identificacion, 
      nombre, 
      apellido, 
      email, 
      telefono, 
      username, 
      password 
    } = req.body;

    // Validación básica de campos obligatorios
    if (!tipo_identificacion || !numero_identificacion || !nombre || !apellido || !email || !telefono || !username || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios para el registro inicial." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const cargo = 'Administrador';
    const fechaContratacion = new Date().toISOString().split("T")[0];

    const { rows } = await pool.query(
      "INSERT INTO employees (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, cargo, fecha_contratacion, username, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, nombre, apellido, email, cargo, username",
      [tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, cargo, fechaContratacion, username, hashedPassword]
    );

    res.status(201).json({
      message: "Administrador inicial creado con éxito.",
      user: rows[0]
    });
  } catch (error) {
    console.error("Error en Create Admin:", error);
    if (error.code === '23505') { // Error de duplicidad en Postgres (Unique constraint)
      return res.status(400).json({ message: "El nombre de usuario o email ya están en uso." });
    }
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// Registro masivo de clientes desde JSON (Ignorando duplicados)
router.post("/bulk-register", protect, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ message: "Acceso denegado: Se requiere rol de Administrador." });
  }

  const clientsData = req.body;
  if (!Array.isArray(clientsData)) {
    return res.status(400).json({ message: "El formato de datos debe ser un arreglo JSON." });
  }

  let successfulInserts = 0;
  const ignoredDuplicates = [];

  for (const item of clientsData) {
    try {
      const hashedPassword = await bcrypt.hash(String(item.password || 'clientPass123'), 10);
      await pool.query(
        `INSERT INTO clients (
          tipo_identificacion, numero_identificacion, nombre, apellido, email, 
          telefono, direccion, fecha_nacimiento, licencia_conduccion, 
          fecha_vencimiento_licencia, username, password, cargo
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          item.tipo_identificacion,
          item.numero_identificacion,
          item.nombre,
          item.apellido,
          item.email,
          item.telefono,
          item.direccion,
          item.fecha_nacimiento,
          item.licencia_conduccion,
          item.fecha_vencimiento_licencia,
          item.username,
          hashedPassword,
          "Cliente"
        ]
      );
      successfulInserts++;
    } catch (error) {
      const identifier = item.username || item.email || item.numero_identificacion || "Desconocido";
      if (error.code === '23505') {
        ignoredDuplicates.push({ identifier, reason: "Duplicado (Usuario/Email/ID ya existe)" });
      } else {
        ignoredDuplicates.push({ identifier, reason: error.message });
      }
    }
  }

  res.status(201).json({
    message: `Procesamiento masivo completado. ${successfulInserts} registros creados.`,
    ignored: ignoredDuplicates
  });
});

// Registro masivo de empleados desde JSON
router.post("/bulk-employees", protect, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ message: "Acceso denegado: Se requiere rol de Administrador." });
  }

  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ message: "El formato debe ser un arreglo JSON." });
  }

  let successfulInserts = 0;
  const ignoredDuplicates = [];

  for (const item of data) {
    try {
      const hashedPassword = await bcrypt.hash(String(item.password || 'admin123'), 10);
      await pool.query(
        `INSERT INTO employees (
          tipo_identificacion, numero_identificacion, nombre, apellido, email, 
          telefono, cargo, fecha_contratacion, username, password
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          item.tipo_identificacion,
          item.numero_identificacion,
          item.nombre,
          item.apellido,
          item.email,
          item.telefono,
          item.cargo,
          item.fecha_contratacion || new Date(),
          item.username,
          hashedPassword
        ]
      );
      successfulInserts++;
    } catch (error) {
      const identifier = item.username || item.email || "Desconocido";
      if (error.code === '23505') {
        ignoredDuplicates.push({ identifier, reason: "Duplicado" });
      } else {
        ignoredDuplicates.push({ identifier, reason: error.message });
      }
    }
  }

  res.status(201).json({
    message: `Procesamiento masivo completado. ${successfulInserts} empleados creados.`,
    ignored: ignoredDuplicates
  });
});

// Registro masivo de vehículos desde JSON
router.post("/bulk-vehicles", protect, async (req, res) => {
  if (req.user.cargo !== 'Administrador') {
    return res.status(403).json({ message: "Acceso denegado: Se requiere rol de Administrador." });
  }

  const data = req.body;
  if (!Array.isArray(data)) {
    return res.status(400).json({ message: "El formato debe ser un arreglo JSON." });
  }

  let successfulInserts = 0;
  const ignoredDuplicates = [];

  for (const item of data) {
    try {
      await pool.query(
        `INSERT INTO vehicles (
          placa, marca, modelo, year_car, color, tipo, capacidad, tarifa_diaria
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          item.placa,
          item.marca,
          item.modelo,
          item.year_car,
          item.color,
          item.tipo,
          item.capacidad,
          item.tarifa_diaria
        ]
      );
      successfulInserts++;
    } catch (error) {
      if (error.code === '23505') {
        ignoredDuplicates.push({ identifier: item.placa, reason: "Duplicado" });
      } else {
        ignoredDuplicates.push({ identifier: item.placa, reason: error.message });
      }
    }
  }

  res.status(201).json({
    message: `Procesamiento masivo completado. ${successfulInserts} vehículos creados.`,
    ignored: ignoredDuplicates
  });
});

// Registro masivo de alquileres desde JSON
router.post("/bulk-rentals", protect, async (req, res) => {
  if (req.user.cargo !== 'Administrador') return res.status(403).json({ message: "Acceso denegado." });
  const data = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ message: "Se requiere un arreglo JSON." });

  let successful = 0;
  const ignored = [];

  for (const item of data) {
    try {
      await pool.query(
        `INSERT INTO rentals (cliente_id, vehiculo_id, empleado_id, fecha_inicio, hora_inicio, fecha_fin, hora_fin, kilometraje_inicio, kilometraje_fin, total, forma_pago, estado_alquiler) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [item.cliente_id, item.vehiculo_id, item.empleado_id, item.fecha_inicio, item.hora_inicio, item.fecha_fin, item.hora_fin, item.kilometraje_inicio, item.kilometraje_fin, item.total, item.forma_pago, item.estado_alquiler || 'activo']
      );
      successful++;
    } catch (error) {
      ignored.push({ identifier: `Vehículo: ${item.vehiculo_id} - Cliente: ${item.cliente_id}`, reason: error.message });
    }
  }
  res.status(201).json({ message: `Carga completada: ${successful} alquileres creados.`, ignored });
});

// Registro masivo de mantenimientos desde JSON
router.post("/bulk-maintenance", protect, async (req, res) => {
  if (req.user.cargo !== 'Administrador') return res.status(403).json({ message: "Acceso denegado." });
  const data = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ message: "Se requiere un arreglo JSON." });

  let successful = 0;
  const ignored = [];

  for (const item of data) {
    try {
      // Validar si el vehículo tiene un alquiler activo que se cruce con las fechas de mantenimiento
      const overlapCheck = await pool.query(
        `SELECT 1 FROM public.rentals 
         WHERE vehiculo_id = $1 
           AND estado_alquiler IN ('activo', 'proceso', 'en_proceso')
           AND fecha_inicio <= $3
           AND fecha_fin >= $2
         LIMIT 1`,
        [item.vehiculo_id, item.fecha_mantenimiento, item.fechafinal_mantenimiento]
      );

      if (overlapCheck.rows.length > 0) {
        ignored.push({ identifier: `Vehículo: ${item.vehiculo_id} - Fecha: ${item.fecha_mantenimiento}`, reason: "Conflicto de agenda: El vehículo tiene un alquiler activo en este rango de fechas." });
        continue;
      }

      await pool.query(
        `INSERT INTO maintenance (vehiculo_id, fecha_mantenimiento, fechafinal_mantenimiento, fecha_proximo_mantenimiento, tipo_mantenimiento, descripcion, costo, estado_mantenimiento, taller, responsable) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          item.vehiculo_id, 
          item.fecha_mantenimiento, 
          item.fechafinal_mantenimiento, 
          item.fecha_proximo_mantenimiento, 
          item.tipo_mantenimiento, 
          item.descripcion, 
          item.costo, 
          item.estado_mantenimiento || 'pendiente', 
          item.taller, 
          item.responsable
        ]
      );
      successful++;
    } catch (error) {
      ignored.push({ identifier: `Vehículo: ${item.vehiculo_id} - Fecha: ${item.fecha_mantenimiento}`, reason: error.message });
    }
  }
  res.status(201).json({ message: `Carga completada: ${successful} mantenimientos creados.`, ignored });
});

// Registro masivo de pagos desde JSON
router.post("/bulk-payments", protect, async (req, res) => {
  if (req.user.cargo !== 'Administrador') return res.status(403).json({ message: "Acceso denegado." });
  const data = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ message: "Se requiere un arreglo JSON." });

  let successful = 0;
  const ignored = [];

  for (const item of data) {
    try {
      await pool.query(
        `INSERT INTO payments (alquiler_id, monto, fecha_pago, hora_pago, forma_pago, referencia_pago, estado_pago) 
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          item.alquiler_id, 
          item.monto, 
          item.fecha_pago, 
          item.hora_pago, 
          item.forma_pago, 
          item.referencia_pago, 
          item.estado_pago || 'pendiente'
        ]
      );
      successful++;
    } catch (error) {
      ignored.push({ identifier: `Alquiler ID: ${item.alquiler_id} - Ref: ${item.referencia_pago}`, reason: error.message });
    }
  }
  res.status(201).json({ message: `Carga completada: ${successful} pagos creados.`, ignored });
});

// Me
router.get("/me", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar en empleados
    let result = await pool.query(
      "SELECT id, nombre, apellido, email, cargo, username FROM employees WHERE id = $1 AND estado = TRUE",
      [userId]
    );

    let user = result.rows[0];

    // Si no es empleado, buscar en clientes
    if (!user) {
      result = await pool.query(
        "SELECT id, nombre, apellido, email, cargo, username FROM clients WHERE id = $1",
        [userId]
      );
      user = result.rows[0];
    }

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener perfil" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.cookie("token", "", { ...cookieOptions, maxAge: 1 });
  res.json({ message: "Logged out successfully" });
});

export default router;
