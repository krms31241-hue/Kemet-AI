import { Workflow } from "../workflow/index.js";

export class WorkflowRegistry {
  private readonly workflows =
    new Map<string, Workflow>();

  register(
    workflow: Workflow,
  ) {
    this.workflows.set(
      workflow.id,
      workflow,
    );

    return workflow;
  }

  get(id: string) {
    return (
      this.workflows.get(id) ?? null
    );
  }

  has(id: string) {
    return this.workflows.has(id);
  }

  remove(id: string) {
    return this.workflows.delete(id);
  }

  clear() {
    this.workflows.clear();
  }

  list() {
    return [
      ...this.workflows.values(),
    ];
  }

  count() {
    return this.workflows.size;
  }
}

export const workflowRegistry =
  new WorkflowRegistry();
