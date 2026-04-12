import pool from "../config/db.js";

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
  try {
    const data = req.body;
    const { rows } = await pool.query(
      "INSERT INTO payments (alquiler_id, monto, fecha_pago, hora_pago, forma_pago, referencia_pago, estado_pago) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [
        data.alquiler_id,
        data.monto,
        data.fecha_pago,
        data.hora_pago,
        data.forma_pago,
        data.referencia_pago,
        data.estado_pago || 'pendiente',
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("createPayment error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query("DELETE FROM payments WHERE id = $1 RETURNING *", [id]);
    if (rowCount === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }
    return res.sendStatus(204);
  } catch (err) {
    console.error("deletePayment error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { rows } = await pool.query(
      "UPDATE payments SET alquiler_id=$1, monto=$2, fecha_pago=$3, hora_pago=$4, forma_pago=$5, referencia_pago=$6, estado_pago=$7 WHERE id=$8 RETURNING *",
      [
        data.alquiler_id,
        data.monto,
        data.fecha_pago,
        data.hora_pago,
        data.forma_pago,
        data.referencia_pago,
        data.estado_pago,
        id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("updatePayment error", err);
    res.status(500).json({ message: "Internal server error" });
  }
};