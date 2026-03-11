import { Router } from "express";
import {} from "../controllers/car.controller.js";
import { protect } from "../middleware/auth.middleeare.js";

const router = Router();
router.use(protect); // protejo todas las rutas de este router

router.get("/cars", getCars);

router.get("/cars/:id", getCarById);

router.post("/cars", createCar);

router.delete("/cars/:id", deleteCar);

router.put("/cars/:id", updateCar);

export default router;