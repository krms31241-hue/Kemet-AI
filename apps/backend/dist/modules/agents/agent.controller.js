import { agentService } from "./agent.service.js";
import { createAgentSchema, updateAgentSchema, } from "./agent.validator.js";
export class AgentController {
    async create(req, res) {
        const body = createAgentSchema.parse(req.body);
        const result = await agentService.create(body);
        return res.status(201).json(result);
    }
    async findAll(req, res) {
        const projectId = req.query.projectId;
        const result = await agentService.findAll(projectId);
        return res.status(200).json(result);
    }
    async update(req, res) {
        const body = updateAgentSchema.parse(req.body);
        const result = await agentService.update(req.params.id, body);
        return res.status(200).json(result);
    }
    async delete(req, res) {
        const result = await agentService.delete(req.params.id);
        return res.status(200).json(result);
    }
}
export const agentController = new AgentController();
