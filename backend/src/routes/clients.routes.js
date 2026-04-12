import { Router } from "express";
import { createClients, deleteClient, getClients, getClientsById, updateClient } from "../controllers/clients.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
router.use(protect); // protejo todas las rutas de este router

router.get("/clients", getClients);

router.get("/clients/:id", getClientsById);

router.post("/clients", createClients);

router.delete("/clients/:id", deleteClient);

router.put("/clients/:id", updateClient);

export default router;