import { pool } from "../db.js";

export const getClients = async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM clients");
        res.json(rows);
    } catch (err) {
        console.error("getClients error", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getClientsById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query("SELECT * FROM clients WHERE id = $1", [id]); 
        if (rows.length === 0) {
            return res.status(404).json({ message: "Client not found" });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error("getClientsById error", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createClients = async (req, res) => {
  try {
    const data = req.body;
    const { rows } = await pool.query(
      "INSERT INTO clients (nombre, apellido, email, telefono, cargo, fecha_contratacion, username, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [
        data.nombre,
        data.apellido,
        data.email,
        data.telefono,
        data.cargo,
        data.fecha_contratacion,
        data.username,
        data.password,
      ],
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("createClients error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};