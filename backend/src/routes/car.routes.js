import { Router } from "express";
import {
  getCars,
  getCarById,
  createCar,
  deleteCar,
  updateCar,
} from "../controllers/car.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/cars", getCars); // Ruta pública

router.get("/cars/:id", getCarById); // Ruta pública

router.post("/cars", protect, createCar);

router.delete("/cars/:id", protect, deleteCar);

router.put("/cars/:id", protect, updateCar);

export default router;