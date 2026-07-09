import { Request, Response } from "express";

import { agentService } from "./agent.service.js";

import {
  createAgentSchema,
  updateAgentSchema,
} from "./agent.validator.js";

export class AgentController {
  async create(
    req: Request,
    res: Response,
  ) {
    const body =
      createAgentSchema.parse(req.body);

    const result =
      await agentService.create(body);

    return res.status(201).json(result);
  }

  async findAll(
    req: Request,
    res: Response,
  ) {
    const projectId =
      req.query.projectId as string;

    const result =
      await agentService.findAll(projectId);

    return res.status(200).json(result);
  }

  async update(
    req: Request,
    res: Response,
  ) {
    const body =
      updateAgentSchema.parse(req.body);

    const result =
      await agentService.update(
        req.params.id as string,
        body,
      );

    return res.status(200).json(result);
  }

  async delete(
    req: Request,
    res: Response,
  ) {
    const result =
      await agentService.delete(
        req.params.id as string,
      );

    return res.status(200).json(result);
  }
}

export const agentController =
  new AgentController();
