import { Router } from "express";
import {} from "../controllers/car.controller.js";
const router = Router();

router.get("/cars", getCars);

router.get("/cars/:id", getCarById);

router.post("/cars", createCar);

router.delete("/cars/:id", deleteCar);

router.put("/cars/:id", updateCar);

export default router;