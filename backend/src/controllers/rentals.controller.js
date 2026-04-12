import pool from "../config/db.js";

const isVehicleCurrentlyRented = async (client, vehicleId) => {
  const { rows } = await client.query(
    "SELECT 1 FROM rentals WHERE vehiculo_id = $1 AND estado_alquiler != 'finalizado' AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin LIMIT 1",
    [vehicleId],
  );
  return rows.length > 0;
};

const isVehicleUnderMaintenanceToday = async (client, vehicleId) => {
  const { rows } = await client.query(
    "SELECT 1 FROM maintenance WHERE vehiculo_id = $1 AND estado_mantenimiento != 'completado' AND CURRENT_DATE BETWEEN fecha_mantenimiento AND fechafinal_mantenimiento LIMIT 1",
    [vehicleId],
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

export const getRentals = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.*, 
        c.nombre as cliente_nombre, 
        c.apellido as cliente_apellido, 
        v.marca as vehiculo_marca, 
        v.modelo as vehiculo_modelo, 
        v.placa as vehiculo_placa
      FROM rentals r
      JOIN clients c ON r.cliente_id = c.id
      JOIN vehicles v ON r.vehiculo_id = v.id
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("getRentals error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRentalById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        r.*, 
        c.nombre as cliente_nombre, 
        c.apellido as cliente_apellido, 
        v.marca as vehiculo_marca, 
        v.modelo as vehiculo_modelo, 
        v.placa as vehiculo_placa
      FROM rentals r
      JOIN clients c ON r.cliente_id = c.id
      JOIN vehicles v ON r.vehiculo_id = v.id
      WHERE r.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Rental not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getRentalById error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRentalsReport = async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(r.fecha_fin, 'YYYY-MM') AS mes,
        v.tipo AS categoria,
        SUM(r.total) AS total_recaudado,
        COUNT(r.id) AS total_alquileres
      FROM rentals r
      JOIN vehicles v ON r.vehiculo_id = v.id
      WHERE r.estado_alquiler = 'finalizado'
      GROUP BY mes, categoria
      ORDER BY mes DESC, total_recaudado DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("getRentalsReport error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const computeRentalTotal = async (client, vehicleId, fechaInicio, horaInicio, fechaFin, horaFin) => {
  if (!vehicleId || !fechaInicio || !fechaFin) return 0;
  const { rows: vehicleRows } = await client.query("SELECT tarifa_diaria FROM vehicles WHERE id = $1", [vehicleId]);
  if (vehicleRows.length === 0) return 0;

  const tarifa = Number(vehicleRows[0].tarifa_diaria || 0);
  const start = new Date(`${fechaInicio}T${horaInicio || "00:00"}:00`);
  const end = new Date(`${fechaFin}T${horaFin || "00:00"}:00`);
  const diffMs = end - start;
  const days = diffMs > 0 ? Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 1;
  return Number((days * tarifa).toFixed(2));
};

export const createRental = async (req, res) => {
  const client = await pool.connect();
  try {
    const data = req.body;
    await client.query("BEGIN");

    const computedTotal = await computeRentalTotal(
      client,
      data.vehiculo_id,
      data.fecha_inicio,
      data.hora_inicio,
      data.fecha_fin,
      data.hora_fin,
    );

    const { rows } = await client.query(
      "INSERT INTO rentals (cliente_id, vehiculo_id, id_empleado, fecha_inicio, hora_inicio, fecha_fin, hora_fin, kilometraje_inicio, kilometraje_fin, total, forma_pago, estado_alquiler) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
      [
        data.cliente_id,
        data.vehiculo_id,
        data.id_empleado,
        data.fecha_inicio,
        data.hora_inicio,
        data.fecha_fin,
        data.hora_fin,
        data.kilometraje_inicio,
        data.kilometraje_fin,
        computedTotal,
        data.forma_pago,
        data.estado_alquiler || 'activo',
      ]
    );

    await setVehicleAvailability(client, data.vehiculo_id);

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createRental error", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const deleteRental = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query("BEGIN");

    const { rows, rowCount } = await client.query(
      "DELETE FROM rentals WHERE id = $1 RETURNING vehiculo_id",
      [id]
    );

    if (rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Rental not found" });
    }

    const vehiculoId = rows[0].vehiculo_id;

    await setVehicleAvailability(client, vehiculoId);

    await client.query("COMMIT");
    return res.sendStatus(204);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("deleteRental error", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const updateRental = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const data = req.body;
    await client.query("BEGIN");

    // Obtener datos actuales antes de la actualización
    const currentRental = await client.query(
      "SELECT estado_alquiler, vehiculo_id FROM rentals WHERE id = $1",
      [id]
    );

    if (currentRental.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Rental not found" });
    }

    if (currentRental.rows[0].estado_alquiler === 'finalizado') {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No se puede modificar un alquiler que ya ha sido finalizado" });
    }

    const oldVehiculoId = currentRental.rows[0].vehiculo_id;

    const computedTotal = await computeRentalTotal(
      client,
      data.vehiculo_id,
      data.fecha_inicio,
      data.hora_inicio,
      data.fecha_fin,
      data.hora_fin,
    );

    const { rows } = await client.query(
      "UPDATE rentals SET cliente_id=$1, vehiculo_id=$2, id_empleado=$3, fecha_inicio=$4, hora_inicio=$5, fecha_fin=$6, hora_fin=$7, kilometraje_inicio=$8, kilometraje_fin=$9, total=$10, forma_pago=$11, estado_alquiler=$12, notificado=FALSE WHERE id=$13 RETURNING *",
      [
        data.cliente_id,
        data.vehiculo_id,
        data.id_empleado,
        data.fecha_inicio,
        data.hora_inicio,
        data.fecha_fin,
        data.hora_fin,
        data.kilometraje_inicio,
        data.kilometraje_fin,
        computedTotal,
        data.forma_pago,
        data.estado_alquiler,
        id,
      ]
    );

    // Gestión de estado de vehículos: siempre recalculamos disponibilidad del vehículo afectado.
    if (oldVehiculoId !== parseInt(data.vehiculo_id)) {
      await setVehicleAvailability(client, oldVehiculoId);
      await setVehicleAvailability(client, data.vehiculo_id);
    } else {
      await setVehicleAvailability(client, data.vehiculo_id);
    }

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateRental error", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};