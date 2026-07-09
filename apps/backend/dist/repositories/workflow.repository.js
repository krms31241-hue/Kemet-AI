import crypto from "node:crypto";
export class WorkflowRepository {
    workflows = new Map();
    async create(data) {
        const workflow = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.workflows.set(workflow.id, workflow);
        return workflow;
    }
    async findById(id) {
        return this.workflows.get(id) ?? null;
    }
    async findByProject(projectId) {
        return [...this.workflows.values()].filter((workflow) => workflow.projectId === projectId);
    }
    async update(id, data) {
        const workflow = await this.findById(id);
        if (!workflow) {
            return null;
        }
        const updated = {
            ...workflow,
            ...data,
            updatedAt: new Date(),
        };
        this.workflows.set(id, updated);
        return updated;
    }
    async delete(id) {
        return this.workflows.delete(id);
    }
}
export const workflowRepository = new WorkflowRepository();
