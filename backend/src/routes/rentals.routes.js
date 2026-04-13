import { Router } from "express";
import { body } from "express-validator";
import pool from "../config/db.js";
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

// Reglas de validación para Alquileres
const rentalValidationRules = [
  body("cliente_id")
    .isInt().withMessage("El ID del cliente debe ser un número entero")
    .custom(async (value, { req }) => {
      const { fecha_inicio, fecha_fin } = req.body;
      const rentalId = req.params.id;

      if (!fecha_inicio || !fecha_fin) return true;

      // Consulta para verificar si el cliente ya tiene alquileres en curso que se solapen
      let query = `
        SELECT id FROM rentals 
        WHERE cliente_id = $1 
        AND estado_alquiler IN ('activo','proceso')
        AND (fecha_inicio <= $3 AND fecha_fin >= $2)
      `;
      const params = [value, fecha_inicio, fecha_fin];

      // Excluir el registro actual si es una actualización
      if (rentalId) {
        query += " AND id != $4";
        params.push(rentalId);
      }

      const { rows } = await pool.query(query, params);
      if (rows.length > 0) {
        throw new Error("El cliente ya tiene un alquiler activo en el rango de fechas seleccionado");
      }
      return true;
    }),
  body("vehiculo_id")
    .isInt().withMessage("El ID del vehículo debe ser un número entero")
    .custom(async (value, { req }) => {
      const { fecha_inicio, fecha_fin } = req.body;
      const rentalId = req.params.id; // Se usa para excluir el alquiler actual si estamos editando

      // Solo realizamos la comprobación si tenemos ambas fechas
      if (!fecha_inicio || !fecha_fin) return true;

      // Consulta para verificar si existen alquileres en curso que se solapen
      let query = `
        SELECT id FROM rentals 
        WHERE vehiculo_id = $1 
        AND estado_alquiler IN ('activo','proceso')
        AND (fecha_inicio <= $3 AND fecha_fin >= $2)
      `;
      const params = [value, fecha_inicio, fecha_fin];

      // Si es un PUT (actualización), no queremos que choque consigo mismo
      if (rentalId) {
        query += " AND id != $4";
        params.push(rentalId);
      }

      const { rows } = await pool.query(query, params);
      if (rows.length > 0) {
        throw new Error("El vehículo ya se encuentra alquilado en el rango de fechas seleccionado");
      }
      return true;
    }),
  body("id_empleado").isInt().withMessage("El ID del empleado debe ser un número entero"),
  body("estado_alquiler")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["activo", "proceso", "finalizado", "cancelado"])
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
  body("forma_pago").notEmpty().trim().withMessage("La forma de pago es obligatoria"),
];

// @desc    Listar todos los contratos de alquiler
router.get("/rentals", getRentals);

// @desc    Obtener reporte de ingresos mensuales por alquileres finalizados
router.get("/rentals/report", getRentalsReport);

// @desc    Consultar un contrato de alquiler por ID
router.get("/rentals/:id", getRentalById);

// @desc    Generar un nuevo contrato de alquiler
router.post("/createRental", rentalValidationRules, createRental);

// @desc    Anular o eliminar un registro de alquiler
router.delete("/rentals/:id", deleteRental);

// @desc    Actualizar kilometraje final, fechas o estado del alquiler
router.put("/rentals/:id", rentalValidationRules, updateRental);

export default router;