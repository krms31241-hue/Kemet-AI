import { Request, Response } from "express";

import { workflowService } from "./workflow.service.js";

import {
  createWorkflowSchema,
  updateWorkflowSchema,
} from "./workflow.validator.js";

export class WorkflowController {
  async create(req: Request, res: Response) {
    const body = createWorkflowSchema.parse(req.body);

    const result = await workflowService.create(body);

    return res.status(201).json(result);
  }

  async findAll(req: Request, res: Response) {
    const projectId = req.query.projectId as string;

    const result = await workflowService.findAll(projectId);

    return res.status(200).json(result);
  }

  async update(req: Request, res: Response) {
    const body = updateWorkflowSchema.parse(req.body);

    const result = await workflowService.update(req.params.id as string, body);

    return res.status(200).json(result);
  }

  async delete(req: Request, res: Response) {
    const result = await workflowService.delete(req.params.id as string);

    return res.status(200).json(result);
  }
}

export const workflowController = new WorkflowController();
