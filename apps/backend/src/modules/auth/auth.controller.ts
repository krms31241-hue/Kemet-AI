import { Request, Response } from "express";

import { authService } from "./auth.service.js";
import {
  loginSchema,
  registerSchema,
} from "./auth.validator.js";

import type {
  AuthenticatedRequest,
} from "../../middlewares/auth.middleware.js";

export class AuthController {
  async register(req: Request, res: Response) {
    const body = registerSchema.parse(req.body);

    const result = await authService.register(body);

    return res.status(201).json(result);
  }

  async login(req: Request, res: Response) {
    const body = loginSchema.parse(req.body);

    const result = await authService.login(body);

    return res.status(200).json(result);
  }

  async me(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;

    const result = await authService.me(
      authReq.user.userId,
    );

    return res.status(200).json(result);
  }
}

export const authController = new AuthController();
