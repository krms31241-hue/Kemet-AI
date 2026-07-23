import { Router } from "express";
import { asyncHandler } from "../../middlewares/async-handler.js";
import { workflowController } from "./workflow.controller.js";
const router = Router();
router.post("/", asyncHandler((req, res) => workflowController.create(req, res)));
router.get("/", asyncHandler((req, res) => workflowController.findAll(req, res)));
router.put("/:id", asyncHandler((req, res) => workflowController.update(req, res)));
router.delete("/:id", asyncHandler((req, res) => workflowController.delete(req, res)));
export default router;
