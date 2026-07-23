import { workflowRepository } from "../../repositories/workflow.repository.js";
export class WorkflowService {
    async create(data) {
        const workflow = await workflowRepository.create({
            ...data,
            nodes: data.nodes,
            edges: data.edges,
        });
        return {
            success: true,
            workflow,
        };
    }
    async findAll(projectId) {
        const workflows = await workflowRepository.findByProject(projectId);
        return {
            success: true,
            workflows,
        };
    }
    async update(id, data) {
        const workflow = await workflowRepository.findById(id);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        const updated = await workflowRepository.update(id, {
            ...data,
            ...(data.nodes && {
                nodes: data.nodes,
            }),
            ...(data.edges && {
                edges: data.edges,
            }),
        });
        return {
            success: true,
            workflow: updated,
        };
    }
    async delete(id) {
        const workflow = await workflowRepository.findById(id);
        if (!workflow) {
            throw new Error("Workflow not found");
        }
        await workflowRepository.delete(id);
        return {
            success: true,
        };
    }
}
export const workflowService = new WorkflowService();
