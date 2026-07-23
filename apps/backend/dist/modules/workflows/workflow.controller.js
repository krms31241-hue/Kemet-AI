import { workflowService } from "./workflow.service.js";
import { createWorkflowSchema, updateWorkflowSchema, } from "./workflow.validator.js";
export class WorkflowController {
    async create(req, res) {
        const body = createWorkflowSchema.parse(req.body);
        const result = await workflowService.create(body);
        return res.status(201).json(result);
    }
    async findAll(req, res) {
        const projectId = req.query.projectId;
        const result = await workflowService.findAll(projectId);
        return res.status(200).json(result);
    }
    async update(req, res) {
        const body = updateWorkflowSchema.parse(req.body);
        const result = await workflowService.update(req.params.id, body);
        return res.status(200).json(result);
    }
    async delete(req, res) {
        const result = await workflowService.delete(req.params.id);
        return res.status(200).json(result);
    }
}
export const workflowController = new WorkflowController();
