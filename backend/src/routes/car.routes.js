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
router.use(protect); // protejo todas las rutas de este router

router.get("/cars", getCars);

router.get("/cars/:id", getCarById);

router.post("/cars", createCar);

router.delete("/cars/:id", deleteCar);

router.put("/cars/:id", updateCar);

export default router;