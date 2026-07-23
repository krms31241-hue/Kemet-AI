import { workflowRepository } from "../../repositories/workflow.repository.js";
export class WorkflowService {
    async create(data) {
        const workflow = await workflowRepository.create({
            projectId: data.projectId,
            name: data.name,
            description: data.description ?? null,
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
        const updateData = {};
        if (data.name !== undefined) {
            updateData.name = data.name;
        }
        if (data.description !== undefined) {
            updateData.description = data.description;
        }
        if (data.nodes !== undefined) {
            updateData.nodes =
                data.nodes;
        }
        if (data.edges !== undefined) {
            updateData.edges =
                data.edges;
        }
        const updated = await workflowRepository.update(id, updateData);
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
