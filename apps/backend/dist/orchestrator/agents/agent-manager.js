export class AgentManager {
    agents = new Map();
    register(runtime) {
        this.agents.set(runtime.config.id, runtime);
    }
    unregister(id) {
        this.agents.delete(id);
    }
    get(id) {
        return this.agents.get(id) ?? null;
    }
    list() {
        return [...this.agents.values()];
    }
    async execute(task) {
        const runtime = this.agents.get(task.agent);
        if (!runtime) {
            throw new Error(`Agent "${task.agent}" not found`);
        }
        return runtime.execute(task);
    }
}
export const agentManager = new AgentManager();
