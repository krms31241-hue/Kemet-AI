import { Request, Response } from "express";

import { projectService } from "./project.service.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "./project.validator.js";

import type {
  AuthenticatedRequest,
} from "../../middlewares/auth.middleware.js";

export class ProjectController {
  async create(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;

    const body = createProjectSchema.parse(req.body);

    const result = await projectService.create(
      authReq.user.userId,
      body,
    );

    return res.status(201).json(result);
  }

  async findAll(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;

    const result = await projectService.findAll(
      authReq.user.userId,
    );

    return res.status(200).json(result);
  }

  async update(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;

    const body = updateProjectSchema.parse(req.body);

    const result = await projectService.update(
      authReq.user.userId,
      req.params.id as string,
      body,
    );

    return res.status(200).json(result);
  }

  async delete(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;

    const result = await projectService.delete(
      authReq.user.userId,
      req.params.id as string,
    );

    return res.status(200).json(result);
  }
}

export const projectController = new ProjectController();
