import { Router } from "express";
import { body, validationResult } from "express-validator";
import {
  getRentals,
  getRentalById,
  createRental,
  deleteRental,
  updateRental,
  getRentalsReport,
} from "../controllers/rentals.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect);

// Middleware para control de acceso basado en roles (RBAC)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.cargo)) {
      return res.status(403).json({ message: "No tienes permiso para realizar esta acción" });
    }
    next();
  };
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

// Reglas de validación para Alquileres
const rentalValidationRules = [
  body("cliente_id")
    .isInt().withMessage("El ID del cliente debe ser un número entero"),
  body("vehiculo_id")
    .isInt().withMessage("El ID del vehículo debe ser un número entero"),
  body("empleado_id").isInt().withMessage("El ID del empleado debe ser un número entero"),
  body("estado_alquiler")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["activo", "proceso", "en_proceso", "pendiente", "finalizado", "completado", "cancelado", "pago_pendiente"])
    .withMessage("El estado del alquiler no es válido"),
  body("fecha_inicio").isDate().withMessage("Fecha de inicio inválida"),
  body("fecha_fin").isDate().withMessage("Fecha de fin inválida")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.fecha_inicio)) {
        throw new Error("La fecha de fin no puede ser anterior a la de inicio");
      }
      return true;
    }),
  body("kilometraje_inicio").isInt({ min: 0 }).withMessage("El kilometraje inicial no puede ser negativo"),
  body("total").isFloat({ min: 0 }).withMessage("El total debe ser un número positivo (mínimo 0)"),
  body("forma_pago")
    .notEmpty().trim().escape()
    .withMessage("La forma de pago es obligatoria"),
];

// @desc    Listar todos los contratos de alquiler
router.get("/rentals", getRentals);

// @desc    Obtener reporte de ingresos mensuales (Solo Gerencia/Admin)
router.get("/rentals/report", restrictTo("Administrador"), getRentalsReport);

// @desc    Consultar un contrato de alquiler por ID
router.get("/rentals/:id", getRentalById);

// @desc    Generar un nuevo contrato de alquiler
router.post("/createRental", rentalValidationRules, handleValidationErrors, createRental);

// @desc    Anular o eliminar un registro de alquiler
router.delete("/rentals/:id", restrictTo("Administrador"), deleteRental);

// @desc    Actualizar kilometraje final, fechas o estado del alquiler
router.put("/rentals/:id", rentalValidationRules, updateRental);

export default router;