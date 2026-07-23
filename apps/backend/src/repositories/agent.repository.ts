import { prisma } from "../database/prisma.js";

export interface AgentEntity {
  id: string;
  projectId: string;

  name: string;
  description?: string | null;

  systemPrompt: string;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;

  createdAt: Date;
  updatedAt: Date;
}

export class AgentRepository {
  async create(
    data: Omit<AgentEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<AgentEntity> {
    return prisma.agent.create({
      data,
    });
  }

  async findById(id: string): Promise<AgentEntity | null> {
    return prisma.agent.findUnique({
      where: { id },
    });
  }

  async findByProject(
    projectId: string,
  ): Promise<AgentEntity[]> {
    return prisma.agent.findMany({
      where: { projectId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(
    id: string,
    data: Partial<Omit<AgentEntity, "id" | "projectId">>,
  ): Promise<AgentEntity | null> {
    const exists = await prisma.agent.findUnique({
      where: { id },
    });

    if (!exists) {
      return null;
    }

    return prisma.agent.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    const exists = await prisma.agent.findUnique({
      where: { id },
    });

    if (!exists) {
      return false;
    }

    await prisma.agent.delete({
      where: { id },
    });

    return true;
  }
}

export const agentRepository = new AgentRepository();
