import { prisma } from "../database/prisma.js";
export class ProjectRepository {
    async create(data) {
        return prisma.project.create({
            data,
        });
    }
    async findById(id) {
        return prisma.project.findUnique({
            where: { id },
        });
    }
    async findByOwner(ownerId) {
        return prisma.project.findMany({
            where: { ownerId },
            orderBy: {
                createdAt: "desc",
            },
        });
    }
    async findByIdAndOwner(id, ownerId) {
        return prisma.project.findFirst({
            where: {
                id,
                ownerId,
            },
        });
    }
    async update(id, data) {
        const exists = await prisma.project.findUnique({
            where: { id },
        });
        if (!exists) {
            return null;
        }
        return prisma.project.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        const exists = await prisma.project.findUnique({
            where: { id },
        });
        if (!exists) {
            return false;
        }
        await prisma.project.delete({
            where: { id },
        });
        return true;
    }
}
export const projectRepository = new ProjectRepository();
