import { prisma } from "../database/prisma.js";
export class UserRepository {
    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
        });
    }
    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
        });
    }
    async findByUsername(username) {
        return prisma.user.findUnique({
            where: { username },
        });
    }
    async create(user) {
        return prisma.user.create({
            data: user,
        });
    }
    async update(id, data) {
        const exists = await prisma.user.findUnique({
            where: { id },
        });
        if (!exists) {
            return null;
        }
        return prisma.user.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        const exists = await prisma.user.findUnique({
            where: { id },
        });
        if (!exists) {
            return false;
        }
        await prisma.user.delete({
            where: { id },
        });
        return true;
    }
    async findAll() {
        return prisma.user.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
    }
}
export const userRepository = new UserRepository();
