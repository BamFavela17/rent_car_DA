import pool from "../config/db.js";

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

export const createRental = async (req, res) => {
  const client = await pool.connect();
  try {
    const data = req.body;
    await client.query("BEGIN");

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
        data.total,
        data.forma_pago,
        data.estado_alquiler || 'activo',
      ]
    );

    // Automatización: Cambiar el estado del vehículo a no disponible (false)
    await client.query("UPDATE vehicles SET estado = false WHERE id = $1", [data.vehiculo_id]);

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

    // Automatización: Volver a poner el vehículo como disponible (true)
    await client.query("UPDATE vehicles SET estado = true WHERE id = $1", [vehiculoId]);

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
        data.total,
        data.forma_pago,
        data.estado_alquiler,
        id,
      ]
    );

    // Gestión de estado de vehículos
    if (oldVehiculoId !== parseInt(data.vehiculo_id)) {
      // Si el vehículo cambió, liberamos el viejo y ocupamos el nuevo
      await client.query("UPDATE vehicles SET estado = true WHERE id = $1", [oldVehiculoId]);
      await client.query("UPDATE vehicles SET estado = false WHERE id = $1", [data.vehiculo_id]);
    }

    if (data.estado_alquiler === 'finalizado') {
      await client.query("UPDATE vehicles SET estado = true WHERE id = $1", [data.vehiculo_id]);
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