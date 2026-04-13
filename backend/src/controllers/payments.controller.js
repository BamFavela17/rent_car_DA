import pool from "../config/db.js";

const normalizePaymentStatus = (status) => String(status || "pendiente").trim().toLowerCase();

const activeRentalStates = ["activo", "proceso"];

const isVehicleCurrentlyRented = async (client, vehicleId) => {
  const { rows } = await client.query(
    "SELECT 1 FROM rentals WHERE vehiculo_id = $1 AND estado_alquiler = ANY($2) AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin LIMIT 1",
    [vehicleId, activeRentalStates],
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

const getRentalPaymentSummary = async (client, rentalId) => {
  const { rows } = await client.query(
    `SELECT
       SUM(CASE WHEN estado_pago = 'pendiente' THEN 1 ELSE 0 END)::int AS pending_count,
       SUM(CASE WHEN estado_pago = 'completado' THEN 1 ELSE 0 END)::int AS completed_count
     FROM payments
     WHERE alquiler_id = $1`,
    [rentalId],
  );
  return rows[0] || { pending_count: 0, completed_count: 0 };
};

const syncRentalStatusByPayment = async (client, rentalId) => {
  const rentalResult = await client.query(
    "SELECT id, estado_alquiler, fecha_fin, vehiculo_id FROM rentals WHERE id = $1",
    [rentalId],
  );
  if (rentalResult.rows.length === 0) return;

  const rental = rentalResult.rows[0];
  const paymentSummary = await getRentalPaymentSummary(client, rentalId);
  const pendingPayments = Number(paymentSummary.pending_count || 0);
  const completedPayments = Number(paymentSummary.completed_count || 0);

  if (pendingPayments > 0) {
    await client.query(
      "UPDATE rentals SET estado_alquiler = 'proceso' WHERE id = $1 AND estado_alquiler != 'proceso'",
      [rentalId],
    );
    await client.query(
      "UPDATE rentals SET fecha_fin = GREATEST(fecha_fin + INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day')::date WHERE id = $1 AND fecha_fin < CURRENT_DATE",
      [rentalId],
    );
    await setVehicleAvailability(client, rental.vehiculo_id);
    return;
  }

  if (completedPayments > 0) {
    await client.query(
      "UPDATE rentals SET estado_alquiler = 'finalizado' WHERE id = $1 AND estado_alquiler != 'finalizado'",
      [rentalId],
    );
    await setVehicleAvailability(client, rental.vehiculo_id);
  }
};

export const getPayments = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM payments");
    res.json(rows);
  } catch (err) {
    console.error("getPayments error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("getPaymentById error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const data = req.body;
    const estadoPago = normalizePaymentStatus(data.estado_pago);
    const { rows } = await client.query(
      "INSERT INTO payments (alquiler_id, monto, fecha_pago, hora_pago, forma_pago, referencia_pago, estado_pago) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [
        data.alquiler_id,
        data.monto,
        data.fecha_pago,
        data.hora_pago,
        data.forma_pago,
        data.referencia_pago,
        estadoPago,
      ]
    );

    await syncRentalStatusByPayment(client, data.alquiler_id);
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createPayment error", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const deletePayment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const { rows, rowCount } = await client.query(
      "DELETE FROM payments WHERE id = $1 RETURNING alquiler_id",
      [id],
    );
    if (rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }
    const alquilerId = rows[0].alquiler_id;
    await syncRentalStatusByPayment(client, alquilerId);
    await client.query("COMMIT");
    return res.sendStatus(204);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("deletePayment error", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const updatePayment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id } = req.params;
    const data = req.body;
    const previous = await client.query("SELECT alquiler_id FROM payments WHERE id = $1", [id]);
    if (previous.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }
    const previousAlquilerId = previous.rows[0].alquiler_id;
    const estadoPago = normalizePaymentStatus(data.estado_pago);
    const { rows } = await client.query(
      "UPDATE payments SET alquiler_id=$1, monto=$2, fecha_pago=$3, hora_pago=$4, forma_pago=$5, referencia_pago=$6, estado_pago=$7 WHERE id=$8 RETURNING *",
      [
        data.alquiler_id,
        data.monto,
        data.fecha_pago,
        data.hora_pago,
        data.forma_pago,
        data.referencia_pago,
        estadoPago,
        id,
      ]
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }
    await syncRentalStatusByPayment(client, data.alquiler_id);
    if (previousAlquilerId && previousAlquilerId !== data.alquiler_id) {
      await syncRentalStatusByPayment(client, previousAlquilerId);
    }
    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updatePayment error", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};