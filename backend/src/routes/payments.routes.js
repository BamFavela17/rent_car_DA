import { Router } from "express";
import {
  getPayments,
  getPaymentById,
  createPayment,
  deletePayment,
  updatePayment,
} from "../controllers/payments.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect);

// @desc    Obtener historial global de pagos
router.get("/payments", getPayments);

// @desc    Obtener el detalle de un pago específico
router.get("/payments/:id", getPaymentById);

// @desc    Registrar un nuevo pago asociado a un alquiler
router.post("/createPayment", createPayment);

// @desc    Eliminar un registro de pago
router.delete("/payments/:id", deletePayment);

// @desc    Modificar información de un pago (referencia, estado)
router.put("/payments/:id", updatePayment);

export default router;