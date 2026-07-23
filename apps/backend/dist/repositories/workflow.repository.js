import { prisma } from "../database/prisma.js";
export class WorkflowRepository {
    async create(data) {
        return prisma.workflow.create({ data });
    }
    async findById(id) {
        return prisma.workflow.findUnique({ where: { id } });
    }
    async findByProject(projectId) {
        return prisma.workflow.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
        });
    }
    async update(id, data) {
        const exists = await prisma.workflow.findUnique({
            where: { id },
        });
        if (!exists)
            return null;
        return prisma.workflow.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        const exists = await prisma.workflow.findUnique({
            where: { id },
        });
        if (!exists)
            return false;
        await prisma.workflow.delete({
            where: { id },
        });
        return true;
    }
}
export const workflowRepository = new WorkflowRepository();
