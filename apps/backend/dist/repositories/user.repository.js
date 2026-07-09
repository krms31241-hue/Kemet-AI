import crypto from "node:crypto";
export class UserRepository {
    users = new Map();
    async findById(id) {
        return this.users.get(id) ?? null;
    }
    async findByEmail(email) {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }
    async findByUsername(username) {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return user;
            }
        }
        return null;
    }
    async create(user) {
        const entity = {
            ...user,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.users.set(entity.id, entity);
        return entity;
    }
    async update(id, data) {
        const user = await this.findById(id);
        if (!user) {
            return null;
        }
        const updated = {
            ...user,
            ...data,
            updatedAt: new Date(),
        };
        this.users.set(id, updated);
        return updated;
    }
    async delete(id) {
        return this.users.delete(id);
    }
    async findAll() {
        return [...this.users.values()];
    }
}
export const userRepository = new UserRepository();
