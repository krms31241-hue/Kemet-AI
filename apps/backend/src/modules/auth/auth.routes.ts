import { Router } from "express";

import { authController } from "./auth.controller.js";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  asyncHandler((req, res) =>
    authController.register(req, res),
  ),
);

router.post(
  "/login",
  asyncHandler((req, res) =>
    authController.login(req, res),
  ),
);

router.get(
  "/me",
  authMiddleware,
  asyncHandler((req, res) =>
    authController.me(req, res),
  ),
);

export default router;
