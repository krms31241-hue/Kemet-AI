import type { Tool } from "./tool.types.js";

export class ToolRegistry {
  private readonly tools =
    new Map<string, Tool>();

  register(tool: Tool) {
    this.tools.set(
      tool.definition.id,
      tool,
    );

    return tool;
  }

  get(id: string) {
    return this.tools.get(id) ?? null;
  }

  has(id: string) {
    return this.tools.has(id);
  }

  remove(id: string) {
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

export const toolRegistry =
  new ToolRegistry();
