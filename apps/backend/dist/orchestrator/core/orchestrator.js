import crypto from "node:crypto";
export class Orchestrator {
    tasks = new Map();
    agents = new Map();
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
    }
    unregisterAgent(id) {
        this.agents.delete(id);
    }
    getAgent(id) {
        return this.agents.get(id) ?? null;
    }
    getAgents() {
        return [...this.agents.values()];
    }
    createTask(task) {
        const entity = {
            ...task,
            id: crypto.randomUUID(),
            status: "pending",
            createdAt: new Date(),
        };
        this.tasks.set(entity.id, entity);
        return entity;
    }
    getTask(id) {
        return this.tasks.get(id) ?? null;
    }
    getTasks() {
        return [...this.tasks.values()];
    }
    updateTask(task) {
        this.tasks.set(task.id, task);
        return task;
    }
    removeTask(id) {
        return this.tasks.delete(id);
    }
    clear() {
        this.tasks.clear();
    }
}
export const orchestrator = new Orchestrator();
