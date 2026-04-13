import pool from "../config/db.js";

const activeRentalStates = ["activo", "proceso"];

const isVehicleCurrentlyRented = async (client, vehicleId) => {
  const { rows } = await client.query(
    "SELECT 1 FROM rentals WHERE vehiculo_id = $1 AND estado_alquiler = ANY($2) AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin LIMIT 1",
    [vehicleId, activeRentalStates],
  );
  return rows.length > 0;
};

const activeMaintenanceStates = ["pendiente", "en servicio"];

const isVehicleUnderMaintenanceToday = async (client, vehicleId) => {
  const { rows } = await client.query(
    "SELECT 1 FROM maintenance WHERE vehiculo_id = $1 AND estado_mantenimiento = ANY($2) AND CURRENT_DATE BETWEEN fecha_mantenimiento AND fechafinal_mantenimiento LIMIT 1",
    [vehicleId, activeMaintenanceStates],
  );
  return rows.length > 0;
};

const setVehicleAvailability = async (client, vehicleId) => {
  const rented = await isVehicleCurrentlyRented(client, vehicleId);
  const underMaintenance = await isVehicleUnderMaintenanceToday(client, vehicleId);
  const available = !rented && !underMaintenance;
  await client.query("UPDATE vehicles SET estado = $1 WHERE id = $2", [available, vehicleId]);
  return available;
};

export const getMaintenances = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM maintenance");
    res.json(rows);
  } catch (err) {
    console.error("getMaintenances error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM maintenance WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getMaintenanceById error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createMaintenance = async (req, res) => {
  try {
    const data = req.body;
    const estado = String(data.estado_mantenimiento || 'pendiente').toLowerCase();
    const { rows } = await pool.query(
      "INSERT INTO maintenance (vehiculo_id, fecha_mantenimiento, fechafinal_mantenimiento, fecha_proximo_mantenimiento, tipo_mantenimiento, descripcion, costo, estado_mantenimiento, taller, responsable) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [
        data.vehiculo_id,
        data.fecha_mantenimiento,
        data.fechafinal_mantenimiento,
        data.fecha_proximo_mantenimiento,
        data.tipo_mantenimiento,
        data.descripcion,
        data.costo,
        estado,
        data.taller,
        data.responsable,
      ]
    );

    await setVehicleAvailability(pool, data.vehiculo_id);

    res.json(rows[0]);
  } catch (err) {
    console.error("createMaintenance error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows, rowCount } = await pool.query(
      "DELETE FROM maintenance WHERE id = $1 RETURNING vehiculo_id",
      [id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    const vehiculoId = rows[0].vehiculo_id;
    await setVehicleAvailability(pool, vehiculoId);

    return res.sendStatus(204);
  } catch (err) {
    console.error("deleteMaintenance error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const currentRecord = await pool.query(
      "SELECT vehiculo_id FROM maintenance WHERE id = $1",
      [id]
    );
    if (currentRecord.rows.length === 0) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }
    const previousVehicleId = currentRecord.rows[0].vehiculo_id;
    const estado = String(data.estado_mantenimiento || '').toLowerCase();
    const { rows } = await pool.query(
      "UPDATE maintenance SET vehiculo_id=$1, fecha_mantenimiento=$2, fechafinal_mantenimiento=$3, fecha_proximo_mantenimiento=$4, tipo_mantenimiento=$5, descripcion=$6, costo=$7, estado_mantenimiento=$8, taller=$9, responsable=$10 WHERE id=$11 RETURNING *",
      [
        data.vehiculo_id,
        data.fecha_mantenimiento,
        data.fechafinal_mantenimiento,
        data.fecha_proximo_mantenimiento,
        data.tipo_mantenimiento,
        data.descripcion,
        data.costo,
        estado,
        data.taller,
        data.responsable,
        id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    if (previousVehicleId !== data.vehiculo_id) {
      await setVehicleAvailability(pool, previousVehicleId);
    }

    await setVehicleAvailability(pool, data.vehiculo_id);

    res.json(rows[0]);
  } catch (err) {
    console.error("updateMaintenance error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};