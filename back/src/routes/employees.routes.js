import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/employees.controller.js";
const router = Router();

router.get("/users", getUsers);

router.get("/users/:id", getUserById);

router.post("/users", createUser);

router.delete("/users/:id", deleteUser);

router.put("/users/:id", updateUser);

export default router;
