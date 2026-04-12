import pool from "../config/db.js";

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
      "INSERT INTO clients (tipo_identificacion, numero_identificacion, nombre, apellido, email, telefono, direccion, fecha_nacimiento, licencia_conduccion, fecha_vencimiento_licencia) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [
        data.tipo_identificacion,
        data.numero_identificacion,
        data.nombre,
        data.apellido,
        data.email,
        data.telefono,
        data.direccion,
        data.fecha_nacimiento,
        data.licencia_conduccion,
        data.fecha_vencimiento_licencia,
      ],
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("createClients error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      "DELETE FROM clients WHERE id = $1 RETURNING *",
      [id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    return res.sendStatus(204);
  } catch (err) {
    console.log("deleteClient error", err);
  }
};

export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { rows } = await pool.query(
      "UPDATE clients SET nombre=$1, apellido=$2, email=$3, telefono=$4, direccion=$5, fecha_nacimiento=$6, licencia_conduccion=$7, fecha_vencimiento_licencia=$8 WHERE id=$9 RETURNING *",
      [
        data.nombre,
        data.apellido,
        data.email,
        data.telefono,
        data.direccion,
        data.fecha_nacimiento,
        data.licencia_conduccion,
        data.fecha_vencimiento_licencia,
        id,
      ],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.log("updateClient error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
