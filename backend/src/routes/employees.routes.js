import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/employees.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect); // protejo todas las rutas de este router

router.get("/users", getUsers);

router.get("/users/:id", getUserById);

router.post("/createUser", createUser);

router.delete("/users/:id", deleteUser);

router.put("/users/:id", updateUser);

export default router;
