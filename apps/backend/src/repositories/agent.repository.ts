import crypto from "node:crypto";

export interface AgentEntity {
  id: string;

  projectId: string;

  name: string;

  description?: string;

  systemPrompt: string;

  provider: string;

  model: string;

  temperature: number;

  maxTokens: number;

  createdAt: Date;

  updatedAt: Date;
}

export class AgentRepository {
  private agents = new Map<string, AgentEntity>();

  async create(
    data: Omit<AgentEntity, "id" | "createdAt" | "updatedAt">,
  ) {
    const agent: AgentEntity = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.agents.set(agent.id, agent);

    return agent;
  }

  async findById(id: string) {
    return this.agents.get(id) ?? null;
  }

  async findByProject(projectId: string) {
    return [...this.agents.values()].filter(
      (agent) => agent.projectId === projectId,
    );
  }

  async update(
    id: string,
    data: Partial<Omit<AgentEntity, "id" | "projectId">>,
  ) {
    const agent = await this.findById(id);

    if (!agent) {
      return null;
    }

    const updated: AgentEntity = {
      ...agent,
      ...data,
      updatedAt: new Date(),
    };

    this.agents.set(id, updated);

    return updated;
  }

  async delete(id: string) {
    return this.agents.delete(id);
  }
}

export const agentRepository = new AgentRepository();
