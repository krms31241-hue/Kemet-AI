import crypto from "node:crypto";
export class ProjectRepository {
    projects = new Map();
    async create(data) {
        const project = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.projects.set(project.id, project);
        return project;
    }
    async findById(id) {
        return this.projects.get(id) ?? null;
    }
    async findByOwner(ownerId) {
        return [...this.projects.values()].filter((project) => project.ownerId === ownerId);
    }
    async findByIdAndOwner(id, ownerId) {
        const project = await this.findById(id);
        if (!project || project.ownerId !== ownerId) {
            return null;
        }
        return project;
    }
    async update(id, data) {
        const project = await this.findById(id);
        if (!project) {
            return null;
        }
        const updated = {
            ...project,
            ...data,
            updatedAt: new Date(),
        };
        this.projects.set(id, updated);
        return updated;
    }
    async delete(id) {
        return this.projects.delete(id);
    }
}
export const projectRepository = new ProjectRepository();
