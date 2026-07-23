import { prisma } from "../database/prisma.js";
export class AgentRepository {
    async create(data) {
        return prisma.agent.create({
            data,
        });
    }
    async findById(id) {
        return prisma.agent.findUnique({
            where: { id },
        });
    }
    async findByProject(projectId) {
        return prisma.agent.findMany({
            where: { projectId },
            orderBy: {
                createdAt: "desc",
            },
        });
    }
    async update(id, data) {
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
    async delete(id) {
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
