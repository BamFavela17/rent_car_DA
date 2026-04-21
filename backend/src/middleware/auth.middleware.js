import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 1. Intentar buscar en la tabla de empleados (debe estar activo)
    let result = await pool.query(
      "SELECT id, nombre, apellido, email, cargo, username FROM employees WHERE id = $1 AND estado = TRUE",
      [decoded.id]
    );

    let user = result.rows[0];

    // 2. Si no es empleado, buscar en la tabla de clientes
    if (!user) {
      result = await pool.query(
        "SELECT id, nombre, apellido, email, cargo, username FROM clients WHERE id = $1",
        [decoded.id]
      );
      user = result.rows[0];
    }

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const optionalProtect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.user = null; // No hay usuario autenticado, pero permitimos el acceso
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let result = await pool.query(
      "SELECT id, nombre, apellido, email, cargo, username FROM employees WHERE id = $1 AND estado = TRUE",
      [decoded.id]
    );

    let user = result.rows[0];

    if (!user) {
      result = await pool.query(
        "SELECT id, nombre, apellido, email, cargo, username FROM clients WHERE id = $1",
        [decoded.id]
      );
      user = result.rows[0];
    }

    req.user = user || null; // Asignar el usuario si existe, o null si no
    next();
  } catch (error) {
    console.error("OptionalProtect error:", error);
    req.user = null; // Si el token es inválido, no hay usuario autenticado
    next();
  }
};
