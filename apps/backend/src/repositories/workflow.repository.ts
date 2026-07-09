import crypto from "node:crypto";

export interface WorkflowEntity {
  id: string;

  projectId: string;

  name: string;

  description?: string;

  nodes: unknown[];

  edges: unknown[];

  createdAt: Date;

  updatedAt: Date;
}

export class WorkflowRepository {
  private workflows = new Map<string, WorkflowEntity>();

  async create(
    data: Omit<
      WorkflowEntity,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    const workflow: WorkflowEntity = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(workflow.id, workflow);

    return workflow;
  }

  async findById(id: string) {
    return this.workflows.get(id) ?? null;
  }

  async findByProject(projectId: string) {
    return [...this.workflows.values()].filter(
      (workflow) => workflow.projectId === projectId,
    );
  }

  async update(
    id: string,
    data: Partial<
      Omit<
        WorkflowEntity,
        "id" | "projectId"
      >
    >,
  ) {
    const workflow = await this.findById(id);

    if (!workflow) {
      return null;
    }

    const updated: WorkflowEntity = {
      ...workflow,
      ...data,
      updatedAt: new Date(),
    };

    this.workflows.set(id, updated);

    return updated;
  }

  async delete(id: string) {
    return this.workflows.delete(id);
  }
}

export const workflowRepository =
  new WorkflowRepository();
