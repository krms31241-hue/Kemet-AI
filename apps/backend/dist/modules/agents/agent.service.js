import { agentRepository } from "../../repositories/index.js";
export class AgentService {
    async create(data) {
        const agent = await agentRepository.create({
            projectId: data.projectId,
            name: data.name,
            description: data.description,
            systemPrompt: data.systemPrompt,
            provider: data.provider,
            model: data.model,
            temperature: data.temperature,
            maxTokens: data.maxTokens,
        });
        return {
            success: true,
            message: "Agent created successfully",
            agent,
        };
    }
    async findAll(projectId) {
        const agents = await agentRepository.findByProject(projectId);
        return {
            success: true,
            agents,
        };
    }
    async update(id, data) {
        const agent = await agentRepository.findById(id);
        if (!agent) {
            throw new Error("Agent not found");
        }
        const updated = await agentRepository.update(id, data);
        return {
            success: true,
            message: "Agent updated successfully",
            agent: updated,
        };
    }
    async delete(id) {
        const agent = await agentRepository.findById(id);
        if (!agent) {
            throw new Error("Agent not found");
        }
        await agentRepository.delete(id);
        return {
            success: true,
            message: "Agent deleted successfully",
        };
    }
}
export const agentService = new AgentService();
