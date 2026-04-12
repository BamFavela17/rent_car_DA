import pool from "../config/db.js";

export const getCars = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM vehicles");
    res.json(rows);
  } catch (err) {
    console.error("getCars error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCarById = async (req, res) => {
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

export const createCar = async (req, res) => {
  try {
    const data = req.body;
    const { rows } = await pool.query(
      "INSERT INTO vehicles (placa, marca, modelo, year_car, color, tipo, capacidad, tarifa_diaria) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [
        data.placa,
        data.marca,
        data.modelo,
        data.year_car,
        data.color,
        data.tipo,
        data.capacidad,
        data.tarifa_diaria,
      ],
    );
    res.json(rows[0]);
  } catch (err) {
    console.log("createCar error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteCar = async (req, res) => {
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
    console.log("deleteCar error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateCar = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { rows } = await pool.query(
      "UPDATE vehicles SET placa=$1, marca=$2, modelo=$3, year_car=$4, color=$5, tipo=$6, capacidad=$7, tarifa_diaria=$8, estado=$9 WHERE id=$10 RETURNING *",
      [
        data.placa,
        data.marca,
        data.modelo,
        data.year_car,
        data.color,
        data.tipo,
        data.capacidad,
        data.tarifa_diaria,
        data.estado,
        id,
      ],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.log("updateCar error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
