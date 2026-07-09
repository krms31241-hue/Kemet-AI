import { workflowRepository } from "../../repositories/workflow.repository.js";

import type {
  CreateWorkflowInput,
  UpdateWorkflowInput,
} from "./workflow.validator.js";

export class WorkflowService {
  async create(data: CreateWorkflowInput) {
    const workflow =
      await workflowRepository.create(data);

    return {
      success: true,
      workflow,
    };
  }

  async findAll(projectId: string) {
    const workflows =
      await workflowRepository.findByProject(projectId);

    return {
      success: true,
      workflows,
    };
  }

  async update(
    id: string,
    data: UpdateWorkflowInput,
  ) {
    const workflow =
      await workflowRepository.findById(id);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const updated =
      await workflowRepository.update(id, data);

    return {
      success: true,
      workflow: updated,
    };
  }

  async delete(id: string) {
    const workflow =
      await workflowRepository.findById(id);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    await workflowRepository.delete(id);

    return {
      success: true,
    };
  }
}

export const workflowService =
  new WorkflowService();
