export class ToolRegistry {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.definition.id, tool);
        return tool;
    }
    get(id) {
        return this.tools.get(id) ?? null;
    }
    has(id) {
        return this.tools.has(id);
    }
    remove(id) {
        return this.tools.delete(id);
    }
    clear() {
        this.tools.clear();
    }
    list() {
        return [...this.tools.values()];
    }
    count() {
        return this.tools.size;
    }
}
export const toolRegistry = new ToolRegistry();
