import { pool } from "../config/db.js";

export const getVehicles = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM vehicles");
    res.json(rows);
  } catch (err) {
    console.error("getVehicles error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM vehicles WHERE id = $1", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getVehicleById error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const data = req.body;
    const { rows } = await pool.query(
      "INSERT INTO vehicles (placa, marca, modelo, year_car, color,tipo,capacidad, tarifa_diaria, año) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
      [
        data.placa,
        data.marca,
        data.modelo,
        data.year_car,
        data.color,
        data.tipo,
        data.capacidad,
        data.tarifa_diaria,
        data.año,
      ],
    );
    res.json(rows[0]);
  } catch (err) {
    console.log("createVehicle error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      "DELETE FROM vehicles WHERE id = $1 RETURNING *",
      [id],
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    return res.sendStatus(204);
  } catch (err) {
    console.log("deletedVehicle error", err);
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { rows } = await pool.query(
      "UPDATE vehicles SET placa=$1, marca=$2, modelo=$3, year_car=$4, color=$5, tipo=$6, capacidad=$7, tarifa_diaria=$8, año=$9, estado=$10 WHERE id=$11 RETURNING *",
      [
        data.placa,
        data.marca,
        data.modelo,
        data.year_car,
        data.color,
        data.tipo,
        data.capacidad,
        data.tarifa_diaria,
        data.año,
        data.estadp,
        id,
      ],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.log("updateVehicle error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
