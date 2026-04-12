import { Router } from "express";
import {
  getMaintenances,
  getMaintenanceById,
  createMaintenance,
  deleteMaintenance,
  updateMaintenance,
} from "../controllers/maintenance.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect);

// @desc    Listar todos los registros de mantenimiento
router.get("/maintenances", getMaintenances);

// @desc    Obtener detalles de un mantenimiento por ID
router.get("/maintenances/:id", getMaintenanceById);

// @desc    Registrar una nueva entrada de mantenimiento para un vehículo
router.post("/createMaintenance", createMaintenance);

// @desc    Remover un registro de mantenimiento
router.delete("/maintenances/:id", deleteMaintenance);

// @desc    Actualizar costos, taller o estado del mantenimiento
router.put("/maintenances/:id", updateMaintenance);

export default router;