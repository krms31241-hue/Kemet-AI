import { Router } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { agentController } from "./agent.controller.js";
const router = Router();
router.post("/", asyncHandler((req, res) => agentController.create(req, res)));
router.get("/", asyncHandler((req, res) => agentController.findAll(req, res)));
router.put("/:id", asyncHandler((req, res) => agentController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => agentController.delete(req, res)));
export default router;
