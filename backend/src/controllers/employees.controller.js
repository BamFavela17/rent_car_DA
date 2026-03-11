import pool  from "../config/db.js"; 
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM employees");
    rows.forEach((r) => delete r.password);
    res.json(rows);
  } catch (err) {
    console.error("getUsers error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM employees WHERE id = $1", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employee = rows[0];
    delete employee.password; // hide hash
    res.json(employee);
  } catch (err) {
    console.error("getUserById error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const data = req.body;
    // hash the password before storing
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    const { rows } = await pool.query(
      "INSERT INTO employees (tipo_identificacion,numero_identificacion, nombre, apellido, email, telefono, cargo, fecha_contratacion, username, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [
        data.tipo_identificacion,
        data.numero_identificacion,
        data.nombre,
        data.apellido,
        data.email,
        data.telefono,
        data.cargo,
        data.fecha_contratacion,
        data.username,
        hashed,
      ],
    );
    const employee = rows[0];
    delete employee.password;
    res.json(employee);
  } catch (err) {
    console.error("createUser error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    return res.sendStatus(204);
  } catch (err) {
    console.error("deleteUser error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // if password provided, hash it
    let hashedPassword = data.password;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    const { rows } = await pool.query(
      "UPDATE employees SET username = $1, email = $2, password = $3, nombre = $4, apellido = $5, telefono = $6 WHERE id = $7 RETURNING *",
      [
        data.username,
        data.email,
        hashedPassword,
        data.nombre,
        data.apellido,
        data.telefono,
        id,
      ],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employee = rows[0];
    delete employee.password;
    return res.json(employee);
  } catch (err) {
    console.error("updateUser error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
