export class ToolManager {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    unregister(name) {
        this.tools.delete(name);
    }
    get(name) {
        return this.tools.get(name) ?? null;
    }
    list() {
        return [...this.tools.values()];
    }
    async execute(name, input, context) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool "${name}" not found`);
        }
        return tool.execute(input, context);
    }
}
export const toolManager = new ToolManager();
