import crypto from "node:crypto";
export class AgentRepository {
    agents = new Map();
    async create(data) {
        const agent = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.agents.set(agent.id, agent);
        return agent;
    }
    async findById(id) {
        return this.agents.get(id) ?? null;
    }
    async findByProject(projectId) {
        return [...this.agents.values()].filter((agent) => agent.projectId === projectId);
    }
    async update(id, data) {
        const agent = await this.findById(id);
        if (!agent) {
            return null;
        }
        const updated = {
            ...agent,
            ...data,
            updatedAt: new Date(),
        };
        this.agents.set(id, updated);
        return updated;
    }
    async delete(id) {
        return this.agents.delete(id);
    }
}
export const agentRepository = new AgentRepository();
