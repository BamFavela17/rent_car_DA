import pool from "../config/db.js";

const activeRentalStates = ["activo", "proceso", "en_proceso"];

const normalizeRentalStatus = (status) => {
  const normalized = String(status || "activo").trim().toLowerCase();
  if (normalized === "completado") return "finalizado";
  if (normalized === "en proceso" || normalized === "en_proceso") return "en_proceso";
  return normalized;
};

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

const hasOverlappingActiveRental = async (client, vehicleId, fechaInicio, fechaFin, excludeRentalId = null) => {
  let query = `
    SELECT 1 FROM rentals
    WHERE vehiculo_id = $1
      AND estado_alquiler = ANY($2)
      AND fecha_inicio <= $4
      AND fecha_fin >= $3
  `;
  const params = [vehicleId, activeRentalStates, fechaInicio, fechaFin];
  if (excludeRentalId) {
    query += " AND id != $5";
    params.push(excludeRentalId);
  }
  const { rows } = await client.query(query, params);
  return rows.length > 0;
};

const rentalHasPendingPayment = async (client, rentalId) => {
  const { rows } = await client.query(
    "SELECT 1 FROM payments WHERE alquiler_id = $1 AND estado_pago = 'pendiente' LIMIT 1",
    [rentalId],
  );
  return rows.length > 0;
};

export const getRentals = async (req, res) => {
  try {
    let query = `
      SELECT 
        r.*, 
        r.empleado_id,
        c.nombre as cliente_nombre, 
        c.apellido as cliente_apellido, 
        v.marca as vehiculo_marca, 
        v.modelo as vehiculo_modelo, 
        v.placa as vehiculo_placa,
        v.image_url as vehiculo_image_url
      FROM rentals r
      JOIN clients c ON r.cliente_id = c.id
      JOIN vehicles v ON r.vehiculo_id = v.id
    `;
    const params = [];

    // Si el usuario es un Cliente, solo puede ver su propio historial
    if (req.user && req.user.cargo === 'Cliente') {
      query += " WHERE r.cliente_id = $1";
      params.push(req.user.id);
    }

    const { rows } = await pool.query(query, params);
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
        r.empleado_id,
        c.nombre as cliente_nombre, 
        c.apellido as cliente_apellido, 
        v.marca as vehiculo_marca, 
        v.modelo as vehiculo_modelo, 
        v.placa as vehiculo_placa,
        v.image_url as vehiculo_image_url
      FROM rentals r
      JOIN clients c ON r.cliente_id = c.id
      JOIN vehicles v ON r.vehiculo_id = v.id
      WHERE r.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Rental not found" });
    }

    // Seguridad: Un cliente no puede ver detalles de alquileres que no le pertenecen
    if (req.user && req.user.cargo === 'Cliente' && rows[0].cliente_id !== req.user.id) {
      return res.status(403).json({ message: "No tienes permiso para ver este alquiler" });
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
  const days = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 1;
  const total = days * tarifa;
  // Evitamos enviar NaN a la base de datos, lo que causaría un Error 500
  return isNaN(total) ? 0 : Number(total.toFixed(2));
};

export const createRental = async (req, res) => {
  const client = await pool.connect();
  try {
    const data = { ...req.body };
    // Ensure IDs are numbers
    data.cliente_id = parseInt(data.cliente_id);
    data.vehiculo_id = parseInt(data.vehiculo_id);

    if (isNaN(data.cliente_id) || isNaN(data.vehiculo_id)) {
      return res.status(400).json({ message: "ID de cliente y vehículo son obligatorios" });
    }

    const computedTotal = await computeRentalTotal(
      client,
      data.vehiculo_id,
      data.fecha_inicio,
      data.hora_inicio,
      data.fecha_fin,
      data.hora_fin,
    );

    await client.query("BEGIN");

    const estadoAlquiler = normalizeRentalStatus(data.estado_alquiler || 'activo');
    
    // Buscamos un empleado responsable válido en lugar de usar un ID estático que puede no existir
    let empleadoId = parseInt(data.empleado_id);
    const empCheck = await client.query("SELECT id FROM employees WHERE id = $1", [empleadoId]);

    if (empCheck.rows.length === 0 || (req.user && req.user.cargo === 'Cliente')) {
      const adminRes = await client.query(
        "SELECT id FROM employees WHERE cargo = 'Administrador' ORDER BY id ASC LIMIT 1"
      );
      if (adminRes.rows.length > 0) {
        empleadoId = adminRes.rows[0].id;
      } else {
        const anyEmpRes = await client.query("SELECT id FROM employees ORDER BY id ASC LIMIT 1");
        if (anyEmpRes.rows.length > 0) empleadoId = anyEmpRes.rows[0].id;
      }
    }

    if (activeRentalStates.includes(estadoAlquiler)) {
      const isBlocked = await hasOverlappingActiveRental(
        client,
        data.vehiculo_id,
        data.fecha_inicio,
        data.fecha_fin,
      );
      if (isBlocked) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "El vehículo ya está ocupado en el rango de fechas seleccionado" });
      }
    }

    const { rows } = await client.query(
      "INSERT INTO rentals (cliente_id, vehiculo_id, empleado_id, fecha_inicio, hora_inicio, fecha_fin, hora_fin, kilometraje_inicio, kilometraje_fin, total, forma_pago, estado_alquiler) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
      [
        data.cliente_id,
        data.vehiculo_id,
        empleadoId,
        data.fecha_inicio,
        data.hora_inicio,
        data.fecha_fin,
        data.hora_fin,
        data.kilometraje_inicio,
        data.kilometraje_fin || null, // Aseguramos que sea null y no undefined
        computedTotal,
        data.forma_pago,
        estadoAlquiler,
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
      "SELECT estado_alquiler, vehiculo_id, empleado_id FROM rentals WHERE id = $1",
      [id]
    );

    if (currentRental.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Rental not found" });
    }

    // Seguridad: Un Vendedor solo puede modificar alquileres donde él sea el responsable o que pertenezcan al sistema (ID 1)
    if (req.user && req.user.cargo === 'Vendedor' && currentRental.rows[0].empleado_id !== req.user.id && currentRental.rows[0].empleado_id !== 1) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "No tienes permiso para modificar alquileres de otros empleados" });
    }

    if (currentRental.rows[0].estado_alquiler === 'finalizado') {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No se puede modificar un alquiler que ya ha sido finalizado" });
    }

    const oldVehiculoId = currentRental.rows[0].vehiculo_id;
    const currentStatus = normalizeRentalStatus(currentRental.rows[0].estado_alquiler || '');
    const newStatus = normalizeRentalStatus(data.estado_alquiler || currentStatus);

    // Lógica Automática: Si se intenta finalizar pero hay deudas, forzamos estado de pago_pendiente
    if (newStatus === 'finalizado' && await rentalHasPendingPayment(client, id)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        message: "No se puede finalizar: El cliente tiene pagos pendientes.",
        status_suggested: "pago_pendiente" 
      });
    }

    if (activeRentalStates.includes(newStatus)) {
      const isBlocked = await hasOverlappingActiveRental(
        client,
        data.vehiculo_id,
        data.fecha_inicio,
        data.fecha_fin,
        id,
      );
      if (isBlocked) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "El vehículo ya está ocupado en el rango de fechas seleccionado" });
      }
    }

    const computedTotal = await computeRentalTotal(
      client,
      data.vehiculo_id,
      data.fecha_inicio,
      data.hora_inicio,
      data.fecha_fin,
      data.hora_fin,
    );

    const employeeId = data.id_empleado ?? data.empleado_id;
    const { rows } = await client.query(
      "UPDATE rentals SET cliente_id=$1, vehiculo_id=$2, empleado_id=$3, fecha_inicio=$4, hora_inicio=$5, fecha_fin=$6, hora_fin=$7, kilometraje_inicio=$8, kilometraje_fin=$9, total=$10, forma_pago=$11, estado_alquiler=$12, notificado=FALSE WHERE id=$13 RETURNING *",
      [
        data.cliente_id,
        data.vehiculo_id,
        employeeId,
        data.fecha_inicio,
        data.hora_inicio,
        data.fecha_fin,
        data.hora_fin,
        data.kilometraje_inicio,
        data.kilometraje_fin,
        computedTotal,
        data.forma_pago,
        newStatus,
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