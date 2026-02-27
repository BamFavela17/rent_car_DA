import { Router } from "express";
import {} from "../controllers/clients.controller.js";
const router = Router();

router.get("/clients", getClients);

router.get("/clients/:id", getClientById);

router.post("/clients", createClient);

router.delete("/clients/:id", deleteClient);

router.put("/clients/:id", updateClient);

export default router;